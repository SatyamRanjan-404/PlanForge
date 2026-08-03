const Task = require('../models/Task');
const { redisClient } = require('../config/redis');
const AgentRegistry = require('../agents/registry');

/**
 * The Coordinator is responsible for ingesting jobs,
 * persisting initial state to MongoDB, and routing to the right Redis queue.
 */
const CoordinatorService = {
  
  async submitTask(prompt, userId) {
    // 1. Create structural persistence in MongoDB
    const newTask = new Task({
      userId,
      originalPrompt: prompt,
      status: 'PENDING',
      assignedAgent: AgentRegistry.PLANNER.id
    });
    
    await newTask.save();
    
    // 2. Dispatch to Planner Queue using Raw Redis (LPUSH)
    const payload = JSON.stringify({
        taskId: newTask._id.toString(),
        prompt: prompt,
        timestamp: Date.now()
    });

    try {
        // LPUSH puts the new item at the left (head) of the list
        // A worker will read from the right (tail) using RPOP or BRPOP for FIFO logic
        await redisClient.lPush(AgentRegistry.PLANNER.queueName, payload);
    } catch (error) {
        // If Redis pushing fails, mark MongoDB as failed
        newTask.status = 'FAILED';
        newTask.metadata.error = `Failed to queue task to planner: ${error.message}`;
        await newTask.save();
        throw new Error('Queue submission failed');
    }

    return newTask;
  }
};

module.exports = CoordinatorService;
