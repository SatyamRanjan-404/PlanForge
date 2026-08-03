const { redisClient } = require('../config/redis');
const Task = require('../models/Task');
const AgentRegistry = require('../agents/registry');

/**
 * Dead Letter Queue (DLQ) & Retry Service
 * Safely increments retry limits. If surpassed, relegates task to the DLQ graveyard.
 */
const handleTaskError = async (queueName, payload, errorMsg, errorType = 'runtime_crash') => {
    let retryCount = payload.retryCount || 0;
    retryCount++;
    
    console.error(`[DLQ] Task ${payload.taskId} failed on ${queueName} [${errorType}]. Retry ${retryCount}/3`);
    
    // Update payload with new retry count
    const newPayload = { ...payload, retryCount, lastError: errorMsg, errorType };
    
    if (retryCount >= 3) {
        // Exceeded retries. Send to DLQ graveyard.
        console.error(`[DLQ] Task ${payload.taskId} exceeded retries. Pushing to DEAD_LETTER.`);
        await redisClient.lPush(AgentRegistry.DEAD_LETTER.queueName, JSON.stringify(newPayload));
        
        // Mark MongoDB as globally failed so the frontend UI can update the user
        try {
            const task = await Task.findById(newPayload.taskId);
            if (task) {
                task.status = 'FAILED';
                task.metadata.error = `Exceeded retries on ${queueName} [${errorType}]: ${errorMsg}`;
                await task.save();
            }
        } catch (e) {
            console.error('[DLQ] Failed to update Mongo status on final retry:', e);
        }
    } else {
        // Soft failure: Push back onto the normal queue to try again
        await redisClient.lPush(queueName, JSON.stringify(newPayload));
    }
};

module.exports = { handleTaskError };
