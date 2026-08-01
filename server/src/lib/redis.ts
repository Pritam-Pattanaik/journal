import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── In-Memory Cache Fallback ───────────────────────────────────────────────
const memoryCache = new Map<string, { value: string; expiry: number | null }>();

function setMemoryCache(key: string, value: string, ttlSec?: number) {
  const expiry = ttlSec ? Date.now() + ttlSec * 1000 : null;
  memoryCache.set(key, { value, expiry });
}

function getMemoryCache(key: string): string | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiry && Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}
// ─────────────────────────────────────────────────────────────────────────────

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
let isRedisAvailable = false;

redis.on('error', (err) => {
  isRedisAvailable = false;
  if (!redisErrorLogged) {
    logger.warn(`[Redis] Unavailable (${err.message}) — running without cache. Falling back to in-memory caching.`);
    redisErrorLogged = true;
  }
});

redis.on('connect', () => {
  isRedisAvailable = true;
  if (redisErrorLogged) {
    logger.info('[Redis] Connected successfully');
    redisErrorLogged = false; // reset on reconnect
  }
});

// ─── Unified Cache API ────────────────────────────────────────────────────────
export const cache = {
  async get(key: string): Promise<string | null> {
    if (isRedisAvailable) {
      try {
        return await redis.get(key);
      } catch {
        return getMemoryCache(key);
      }
    }
    return getMemoryCache(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isRedisAvailable) {
      try {
        await redis.set(key, value);
        return;
      } catch { /* ignore */ }
    }
    setMemoryCache(key, value);
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (isRedisAvailable) {
      try {
        await redis.setex(key, seconds, value);
        return;
      } catch { /* ignore */ }
    }
    setMemoryCache(key, value, seconds);
  },
  
  async del(key: string): Promise<void> {
    if (isRedisAvailable) {
      try {
        await redis.del(key);
        return;
      } catch { /* ignore */ }
    }
    memoryCache.delete(key);
  }
};
