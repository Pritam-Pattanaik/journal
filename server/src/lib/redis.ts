import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false, // Don't queue commands when disconnected
  lazyConnect: true,         // Don't connect until first command
});

let redisErrorLogged = false;

redis.on('error', (err) => {
  if (!redisErrorLogged) {
    logger.warn(`[Redis] Unavailable (${err.message}) — running without cache. Market data will use in-memory stale cache.`);
    redisErrorLogged = true;
  }
});

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
  redisErrorLogged = false; // reset on reconnect
});
