const redis = require('redis');
const logger = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Redis v4+ configuration
      const redisUrl = `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`;
      this.client = redis.createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || undefined,
        database: process.env.REDIS_DB || 0,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, returning null for key:', key);
      return null;
    }
    
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, options = {}) {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, skipping SET for key:', key);
      return false;
    }
    
    try {
      if (options.ttl) {
        return await this.client.setEx(key, options.ttl, value);
      } else {
        return await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async setex(key, seconds, value) {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, skipping SETEX for key:', key);
      return false;
    }
    
    try {
      return await this.client.setEx(key, seconds, value);
    } catch (error) {
      logger.error('Redis SETEX error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, skipping DEL for key:', key);
      return false;
    }
    
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async lpush(key, value) {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, skipping LPUSH for key:', key);
      return false;
    }
    
    try {
      return await this.client.lPush(key, value);
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      return false;
    }
  }

  async rpop(key) {
    if (!this.isConnected || !this.client) {
      logger.warn('Redis not connected, skipping RPOP for key:', key);
      return null;
    }
    
    try {
      return await this.client.rPop(key);
    } catch (error) {
      logger.error('Redis RPOP error:', error);
      return null;
    }
  }

  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info('Redis client disconnected gracefully');
      } catch (error) {
        logger.error('Error disconnecting from Redis:', error);
      }
    }
  }
}

const redisClient = new RedisClient();

// Initialize Redis connection
if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch(err => {
    logger.error('Failed to initialize Redis connection:', err);
  });
}

module.exports = redisClient;
