const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy(retries) {
      if (retries > 10) {
        logger.error('Too many attempts to reconnect. Redis connection failed.');
        return new Error('Too many retries.');
      }
      // Reconnect after
      const delay = Math.min(retries * 50, 2000);
      return delay;
    }
  }
});

redisClient.on('error', (err) => logger.error(`Redis Client Error: ${err.message}`));
redisClient.on('connect', () => logger.info('Redis Client Connected'));
redisClient.on('ready', () => logger.info('Redis Client Ready'));
redisClient.on('reconnecting', () => logger.warn('Redis Client Reconnecting...'));
redisClient.on('end', () => logger.warn('Redis Client connection closed.'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch(err) {
        logger.error(`Initial Redis connection failed: ${err.message}`);
    }
}

module.exports = { redisClient, connectRedis };
