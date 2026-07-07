import Redis from 'ioredis';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;
let isRedisAvailable = false;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 2000);
        return delay;
      }
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis Cache server');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.warn('Redis Cache Error (Graceful Bypass Enabled):', err.message);
      isRedisAvailable = false;
    });
  } catch (err) {
    console.error('Failed to initialize Redis client', err);
    redisClient = null;
    isRedisAvailable = false;
  }
} else {
  console.warn('Warning: REDIS_URL environment variable is not defined. Redis caching will be bypassed.');
}

export const cache = {
  /**
   * Get value from cache
   */
  async get(key: string): Promise<string | null> {
    if (!isRedisAvailable || !redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch {
      return null;
    }
  },

  /**
   * Set value in cache with expiration (seconds)
   */
  async set(key: string, value: string, expireSeconds?: number): Promise<boolean> {
    if (!isRedisAvailable || !redisClient) return false;
    try {
      if (expireSeconds) {
        await redisClient.set(key, value, 'EX', expireSeconds);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable || !redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Status check
   */
  isAvailable(): boolean {
    return isRedisAvailable;
  }
};
