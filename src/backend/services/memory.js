const { redisClient } = require('../config/redis');

/**
 * Shared Ephemeral Memory Service
 * Agents use this to write scratchpad data that expires automatically (TTL).
 * This prevents MongoDB from bloating with temporary LLM working thoughts.
 */
const MemoryService = {
    // Default TTL = 1 Hour (3600 seconds)
    async setMemory(key, data, ttlSeconds = 3600) {
        if (!redisClient.isReady) throw new Error('Redis not connected');
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        const namespaceKey = `memory:${key}`;
        
        // SETEX: Set value and expiration atomically in Redis
        await redisClient.setEx(namespaceKey, ttlSeconds, payload);
        return true;
    },

    async getMemory(key) {
        if (!redisClient.isReady) return null;
        const namespaceKey = `memory:${key}`;
        const raw = await redisClient.get(namespaceKey);
        
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return raw; // Return raw string if it couldn't be parsed as JSON
        }
    }
};

module.exports = MemoryService;
