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
    modelName: 'llama-3.1-8b-instant',
    temperature: 0.3
});

const executorPrompt = PromptTemplate.fromTemplate(`
You are a highly capable AI Executor.
Your job is to execute the following subtask to the best of your ability.
Return a concise summary of what you did and the result.

Subtask: {subtask}
`);

const runExecutor = async () => {
    const subscriber = redisClient.duplicate();
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

                // Execute LangChain
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
