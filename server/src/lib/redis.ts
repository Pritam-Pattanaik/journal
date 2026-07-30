import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 1, 
});

redis.on('error', (err) => {
  logger.error(`[Redis] Connection error: ${err.message}`);
});

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});
