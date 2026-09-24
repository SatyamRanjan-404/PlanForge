const { redisClient } = require('../config/redis');
const Task = require('../models/Task');
const AgentRegistry = require('./registry');
const { handleTaskError } = require('../services/dlq');
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser, OutputFixingParser } = require('langchain/output_parsers');
const { z } = require('zod');

const llm = new ChatOpenAI({
    openAIApiKey: process.env.GROQ_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE || 'https://api.groq.com/openai/v1'
    },
    modelName: 'openai/gpt-oss-20b',
    temperature: 0.1
});

const validationSchema = z.object({
    passed: z.boolean(),
    reason: z.string()
});

const parser = StructuredOutputParser.fromZodSchema(validationSchema);

const validatorPrompt = PromptTemplate.fromTemplate(`
You are a strict reviewer. Given the subtask description and the result produced for it, decide if the result actually satisfies the subtask.
Respond only in the required JSON format.

Subtask: {subtask}
Result: {result}

{format_instructions}
`);

const runValidator = async () => {
    const subscriber = redisClient.duplicate();
    subscriber.on('error', (err) => {
        console.error(`[Validator] Subscriber connection error: ${err.message}`);
    });
    await subscriber.connect();

    console.log(`Validator Agent daemon listening on ${AgentRegistry.VALIDATOR.queueName}...`);

    while (true) {
        let payload = null;
        try {
            const result = await subscriber.brPop(AgentRegistry.VALIDATOR.queueName, 0);
            if (result) {
                payload = JSON.parse(result.element);
                console.log(`[Validator] Validating subtask ${payload.subtaskId} for Task ${payload.taskId}`);

                const task = await Task.findById(payload.taskId);
                if (!task) {
                   throw new Error("Task not found in MongoDB.");
                }

                // Step 7: Update status to VALIDATING right after fetching task & before LLM check
                task.status = 'VALIDATING';
                await task.save();

                // Step 6: Perform LLM Validation
                const promptValue = await validatorPrompt.format({
                    subtask: payload.description,
                    result: payload.executorResult,
                    format_instructions: parser.getFormatInstructions()
                });

                const response = await llm.invoke(promptValue);

                let parsedResult;
                try {
                    parsedResult = await parser.parse(response.content);
                } catch (parseError) {
                    console.log(`[Validator] Standard parse failed, attempting OutputFixingParser Rescue...`);
                    const fixingParser = OutputFixingParser.fromLLM(llm, parser);
                    parsedResult = await fixingParser.parse(response.content);
                }

                if (parsedResult.passed) {
                    const subtasks = task.metadata.subtasks;
                    const targetIdx = subtasks.findIndex(st => st.id === payload.subtaskId);
                    
                    if (targetIdx !== -1) {
                        subtasks[targetIdx].status = 'COMPLETED';
                        subtasks[targetIdx].result = payload.executorResult;
                        task.markModified('metadata');
                        
                        const allCompleted = subtasks.every(st => st.status === 'COMPLETED');
                        
                        if (allCompleted) {
                            task.status = 'COMPLETED';
                            task.assignedAgent = null;
                            console.log(`[Validator] ALL subtasks completed. Task ${payload.taskId} marked COMPLETED.`);
                        } else {
                            task.status = 'EXECUTING';
                            console.log(`[Validator] Task ${payload.taskId} subtask ${payload.subtaskId} validated. Waiting for others.`);
                        }
                        
                        await task.save();
                    }
                } else {
                    console.log(`[Validator] Subtask ${payload.subtaskId} rejected: ${parsedResult.reason}`);
                    task.status = 'EXECUTING';
                    await task.save();

                    await handleTaskError(
                        AgentRegistry.EXECUTOR.queueName,
                        payload,
                        `Validation rejected: ${parsedResult.reason}`,
                        'validation_failed'
                    );
                }
                payload = null;
            }
        } catch (error) {
            console.error('[Validator] Loop Error:', error.message);
            if (payload) {
                await handleTaskError(AgentRegistry.VALIDATOR.queueName, payload, error.message);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

module.exports = runValidator;

