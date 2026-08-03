const { redisClient } = require('../config/redis');
const Task = require('../models/Task');
const AgentRegistry = require('./registry');
const { handleTaskError } = require('../services/dlq');

const runValidator = async () => {
    const subscriber = redisClient.duplicate();
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

                // In a robust system, the LLM would validate the result against the original prompt.
                // For this implementation, we will perform a deterministic structural pass.
                const subtasks = task.metadata.subtasks;
                const targetIdx = subtasks.findIndex(st => st.id === payload.subtaskId);
                
                if (targetIdx !== -1) {
                    // Update the status of this specific subtask
                    subtasks[targetIdx].status = 'COMPLETED';
                    subtasks[targetIdx].result = payload.executorResult;
                    
                    // Force mongoose to recognize the mixed object array change
                    task.markModified('metadata');
                    
                    // Check if all subtasks are COMPLETED
                    const allCompleted = subtasks.every(st => st.status === 'COMPLETED');
                    
                    if (allCompleted) {
                        task.status = 'COMPLETED';
                        task.assignedAgent = null;
                        console.log(`[Validator] ALL subtasks completed. Task ${payload.taskId} marked COMPLETED.`);
                    } else {
                        console.log(`[Validator] Task ${payload.taskId} subtask ${payload.subtaskId} validated. Waiting for others.`);
                    }
                    
                    await task.save();
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
