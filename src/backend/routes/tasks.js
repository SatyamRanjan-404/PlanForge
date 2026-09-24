const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');
const CoordinatorService = require('../services/coordinator');
const Task = require('../models/Task');

const { z } = require('zod');

const DEFAULT_USER_ID = 'demo-user';

/**
 * Guards: check connection readiness before executing queries.
 * Mongoose readyState 1 = connected. Redis isReady is its own boolean.
 */
const isDbReady = () => mongoose.connection.readyState === 1;
const isRedisReady = () => redisClient && redisClient.isReady;

const serviceUnavailable = (res, detail) =>
  res.status(503)
    .set('Retry-After', '5')
    .json({ error: detail || 'Service temporarily unavailable. Please retry in a moment.' });

const createTaskSchema = z.object({
  prompt: z.string({ required_error: 'Prompt is required' })
    .trim()
    .min(5, { message: 'Prompt must be at least 5 characters long' })
    .max(2000, { message: 'Prompt cannot exceed 2000 characters' })
});

// @route   POST /tasks
// @desc    Submit a new high-level objective/task
// @access  Public
router.post('/', async (req, res) => {
  if (!isDbReady()) return serviceUnavailable(res, 'Database temporarily unavailable. Please retry in a moment.');
  if (!isRedisReady()) return serviceUnavailable(res, 'Task queue is temporarily reconnecting. Please retry in a moment.');

  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: errorMsg });
    }

    const { prompt } = parseResult.data;

    const task = await CoordinatorService.submitTask(prompt, DEFAULT_USER_ID);
    
    res.status(201).json({
      message: 'Task submitted successfully',
      taskId: task._id
    });

  } catch (error) {
    console.error('Task submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit task. Please try again.' });
  }
});

// @route   GET /tasks/:id
// @desc    Get the current state of a task
// @access  Public
router.get('/:id', async (req, res) => {
  if (!isDbReady()) return serviceUnavailable(res, 'Database temporarily unavailable. Please retry in a moment.');

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    if (task.userId !== DEFAULT_USER_ID) {
      return res.status(403).json({ error: 'Not authorized to view this task' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching task' });
  }
});

/**
 * @route   GET /tasks
 * @desc    Fetch the 15 most recent tasks (Dashboard polling)
 * @access  Public
 */
router.get('/', async (req, res) => {
    if (!isDbReady()) return serviceUnavailable(res, 'Database temporarily unavailable. Please retry in a moment.');

    try {
        const tasks = await Task.find({ userId: DEFAULT_USER_ID }).sort({ createdAt: -1 }).limit(15);
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        res.status(500).json({ error: 'Failed to retrieve task listing.' });
    }
});

module.exports = router;

