import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT, 10),
  password: env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

export class CacheService {
  /**
   * Set a key-value pair in Redis with an optional TTL in seconds.
   */
  static async set(key: string, value: any, ttlInSeconds: number = 3600): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', ttlInSeconds);
    } catch (error) {
      logger.error(`Error setting cache for key ${key}`, error);
    }
  }

  /**
   * Get a value from Redis by key.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}`, error);
      return null;
    }
  }

  /**
   * Delete a key from Redis.
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}`, error);
    }
  }

  /**
   * Delete multiple keys by pattern.
   */
  static async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error(`Error deleting cache by pattern ${pattern}`, error);
    }
  }
}
