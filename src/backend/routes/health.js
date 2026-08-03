const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { redisClient } = require('../config/redis');

// @route   GET /health
// @desc    Check system health status (API, DB, Redis) + memory & uptime
// @access  Public
router.get('/', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisStatus = redisClient && redisClient.isReady ? 'connected' : 'disconnected';
    
    // API is healthy if both infrastructure dependencies are connected
    const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

    const memUsage = process.memoryUsage();
    const memoryMetrics = {
      rssMb: (memUsage.rss / 1024 / 1024).toFixed(2),
      heapTotalMb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMb: (memUsage.heapUsed / 1024 / 1024).toFixed(2)
    };

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      uptimeSeconds: Math.floor(process.uptime()),
      memory: memoryMetrics,
      services: {
        api: 'connected',
        mongodb: mongoStatus,
        redis: redisStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

module.exports = router;

