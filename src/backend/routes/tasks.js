const express = require('express');
const router = express.Router();
const CoordinatorService = require('../services/coordinator');
const Task = require('../models/Task');
const { requireAuth } = require('../middleware/auth');

const { z } = require('zod');

const createTaskSchema = z.object({
  prompt: z.string({ required_error: 'Prompt is required' })
    .trim()
    .min(5, { message: 'Prompt must be at least 5 characters long' })
    .max(2000, { message: 'Prompt cannot exceed 2000 characters' })
});

// @route   POST /tasks
// @desc    Submit a new high-level objective/task
// @access  Private
router.post('/', requireAuth, async (req, res) => {
  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: errorMsg });
    }

    const { prompt } = parseResult.data;

    // Submit task with associated user
    const task = await CoordinatorService.submitTask(prompt, req.user.id);
    
    res.status(201).json({
      message: 'Task submitted successfully',
      taskId: task._id
    });

  } catch (error) {
    console.error('Task submission error:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

// @route   GET /tasks/:id
// @desc    Get the current state of a task
// @access  Private
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    // Simple enforcement: user can only see their own tasks
    if (task.userId !== req.user.id) {
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
 * @access  Private
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(15);
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error.message);
        res.status(500).json({ error: 'Failed to retrieve task listing.' });
    }
});

module.exports = router;
