const { redisClient } = require('../config/redis');
const Task = require('../models/Task');
const AgentRegistry = require('./registry');
const { handleTaskError } = require('../services/dlq');
const MemoryService = require('../services/memory');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');

const llm = new ChatOpenAI({
    openAIApiKey: process.env.GROQ_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE || 'https://api.groq.com/openai/v1'
    },
    modelName: 'openai/gpt-oss-20b',
    temperature: 0.3
});

const searchWikipedia = async (topic) => {
    try {
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.extract || null;
    } catch (e) {
        return null;
    }
};

const runExecutor = async () => {
    const subscriber = redisClient.duplicate();
    subscriber.on('error', (err) => {
        console.error(`[Executor] Subscriber connection error: ${err.message}`);
    });
    await subscriber.connect();

    console.log(`Executor Agent daemon listening on ${AgentRegistry.EXECUTOR.queueName}...`);

    while (true) {
        let payload = null; // Hoisted for DLQ catching
        try {
            const result = await subscriber.brPop(AgentRegistry.EXECUTOR.queueName, 0);
            if (result) {
                payload = JSON.parse(result.element);
                console.log(`[Executor] Processing subtask ${payload.subtaskId} for Task ${payload.taskId}`);

                const task = await Task.findById(payload.taskId);
                if (!task) {
                    throw new Error("Task not found in MongoDB.");
                }

                // Check Shared Memory Context
                const previousContext = await MemoryService.getMemory(task._id.toString());
                if (previousContext) {
                    console.log(`[Executor] Found cached context:`, previousContext.lastAction);
                }

                // Grounding via Wikipedia tool call
                let wikiContext = null;
                try {
                    const topicRes = await llm.invoke(`Extract the single core topic or main keyword of this subtask to look up on Wikipedia. Return ONLY the keyword/topic text:\nSubtask: ${payload.description}`);
                    const topic = topicRes.content ? topicRes.content.trim() : payload.description;
                    wikiContext = await searchWikipedia(topic);
                } catch (e) {
                    wikiContext = null;
                }

                const safeWiki = wikiContext ? wikiContext.replace(/\{/g, '{{').replace(/\}/g, '}}') : '';
                const safeLastError = payload.lastError ? payload.lastError.replace(/\{/g, '{{').replace(/\}/g, '}}') : '';

                let promptText = "";
                if (safeWiki) {
                    promptText += `Reference material (from Wikipedia): ${safeWiki}\n\n`;
                }
                promptText += `Subtask: {subtask}\n\n`;
                if (safeWiki) {
                    promptText += `Using the reference material where relevant, execute this subtask and summarize what you found.`;
                } else {
                    promptText += `Execute this subtask to the best of your ability and return a concise summary of what you did and the result.`;
                }
                if (safeLastError) {
                    promptText += `\n\nNote: a previous attempt at this subtask was rejected for this reason: ${safeLastError}. Address this in your new attempt.`;
                }

                const executorPrompt = PromptTemplate.fromTemplate(`You are a highly capable AI Executor.\n\n${promptText}`);
                const chain = executorPrompt.pipe(llm);
                const response = await chain.invoke({ subtask: payload.description });
                
                // Route to validator
                const validatorPayload = JSON.stringify({
                    ...payload, 
                    taskId: task._id.toString(),
                    subtaskId: payload.subtaskId,
                    executorResult: response.content
                });
                
                await redisClient.lPush(AgentRegistry.VALIDATOR.queueName, validatorPayload);
                
                // Write to cache memory
                await MemoryService.setMemory(task._id.toString(), {
                    lastAction: `Completed ${payload.subtaskId}`,
                    timestamp: Date.now()
                });

                console.log(`[Executor] Subtask ${payload.subtaskId} executed & sent to Validator.`);
                payload = null; // Clear payload on success so catch block ignores it
            }
        } catch (error) {
            console.error('[Executor] Loop Error:', error.message);
            if (payload) {
                await handleTaskError(AgentRegistry.EXECUTOR.queueName, payload, error.message);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = runExecutor;

