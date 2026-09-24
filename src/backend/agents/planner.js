const { redisClient } = require('../config/redis');
const Task = require('../models/Task');
const AgentRegistry = require('./registry');
const { handleTaskError } = require('../services/dlq');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');

const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const { z } = require('zod');

// We use the OpenAI integration but point it to Groq API via env vars
const llm = new ChatOpenAI({
    openAIApiKey: process.env.GROQ_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE || 'https://api.groq.com/openai/v1'
    },
    modelName: 'openai/gpt-oss-20b',
    temperature: 0.1
});

// Zod Schema enforcement
const subtaskSchema = z.object({
  subtasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    status: z.string().default('PENDING')
  }))
});

const parser = StructuredOutputParser.fromZodSchema(subtaskSchema);

const plannerPrompt = PromptTemplate.fromTemplate(`
You are a brilliant system architect Planner.
Your goal is to break down the following high-level objective into exactly 3 smaller subtasks.

{format_instructions}

Objective: {objective}
`);

const runPlanner = async () => {
    // Duplicate client because BRPOP blocks the connection for this agent only
    const subscriber = redisClient.duplicate();
    // Prevent unhandled 'error' event from crashing the worker process on ECONNRESET
    subscriber.on('error', (err) => {
        console.error(`[Planner] Subscriber connection error: ${err.message}`);
    });
    await subscriber.connect();

    console.log(`Planner Agent daemon listening on ${AgentRegistry.PLANNER.queueName}...`);

    while (true) {
        let payload = null;
        try {
            // Block (wait) for up to 0 seconds (infinite)
            const result = await subscriber.brPop(AgentRegistry.PLANNER.queueName, 0);
            
            if (result) {
                // result is an object: { key: 'queue:planner', element: '...' }
                payload = JSON.parse(result.element);
                console.log(`\n[Planner] Received Task ${payload.taskId}`);

                const task = await Task.findById(payload.taskId);
                if (!task) continue;

                // Update state
                task.status = 'PLANNING';
                await task.save();

                // Use Structured Parsing natively mapped to Zod
                let parsedResult;
                try {
                    const promptValue = await plannerPrompt.format({
                        objective: payload.prompt,
                        format_instructions: parser.getFormatInstructions()
                    });
                    
                    const response = await llm.invoke(promptValue);
                    
                    try {
                        parsedResult = await parser.parse(response.content);
                    } catch (parseError) {
                        console.log(`[Planner] Standard parse failed, attempting OutputFixingParser Rescue...`);
                        const fixingParser = OutputFixingParser.fromLLM(llm, parser);
                        parsedResult = await fixingParser.parse(response.content);
                        console.log(`[Planner] Rescue successful!`);
                    }
                    
                } catch (e) {
                    const isSchemaFail = e.message && (e.message.toLowerCase().includes('parse') || e.message.toLowerCase().includes('schema'));
                    throw { 
                        message: e.message, 
                        type: isSchemaFail ? 'schema_validation_failed' : 'runtime_crash' 
                    };
                }

                task.metadata.subtasks = parsedResult.subtasks;
                task.status = 'EXECUTING';
                task.assignedAgent = AgentRegistry.EXECUTOR.id;
                task.markModified('metadata');
                await task.save();

                // Dispatch to Executor Queue
                for (const subtask of parsedResult.subtasks) {
                    const executorPayload = JSON.stringify({
                        ...payload,
                        subtaskId: subtask.id,
                        description: subtask.description
                    });
                    // Main client pushes, subscriber blocks
                    await redisClient.lPush(AgentRegistry.EXECUTOR.queueName, executorPayload);
                }
                
                console.log(`[Planner] Task ${payload.taskId} planned mapping to ${parsedResult.subtasks.length} subtasks.`);
                payload = null; // Clean out payload on success
            }
        } catch (error) {
            console.error('[Planner] Loop Error:', error.message || error);
            if (payload) {
                const errorType = error.type || 'runtime_crash';
                const errorMsg = error.message || 'Unknown error';
                await handleTaskError(AgentRegistry.PLANNER.queueName, payload, errorMsg, errorType);
            }
            // Wait 2 seconds before looping again upon failure to prevent crash thrashing
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = runPlanner;
