const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy(retries) {
      // Exponential backoff: 100ms, 200ms, 400ms ... capped at 5s
      // Never return an Error — always retry so the server stays alive
      const delay = Math.min(100 * Math.pow(2, retries), 5000);
      if (retries % 5 === 0) {
        console.warn(`Redis reconnect attempt #${retries}, next retry in ${delay}ms`);
      }
      return delay;
    }
  }
});

redisClient.on('error', (err) => console.error(`Redis Client Error: ${err.message}`));
redisClient.on('connect', () => console.log('Redis Client Connected'));
redisClient.on('ready', () => console.log('Redis Client Ready'));
redisClient.on('reconnecting', () => console.warn('Redis Client Reconnecting...'));
redisClient.on('end', () => console.warn('Redis Client connection closed.'));

const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch(err) {
        console.error(`Initial Redis connection failed: ${err.message}`);
    }
}

module.exports = { redisClient, connectRedis };

