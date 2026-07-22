import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { logger } from '../lib/logger';

// Distributed-ready sync lock and rate limiting service.
// Operates with Redis if REDIS_URL is provided, else falls back to Map.

interface LockEntry {
  lockedAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class LockService {
  private syncLocks = new Map<string, LockEntry>();
  private rateLimits = new Map<string, RateLimitEntry>();
  private lockTimeoutMs = 60000; // 60s auto-expire safety limit for sync locks
  private redis: Redis | null = null;

  constructor() {
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.redis.on('error', (err) => logger.error(`Redis Error: ${err.message}`));
      this.redis.on('connect', () => logger.info('Redis connected successfully for LockService'));
    }
  }

  // Acquire sync lock
  public async acquireSyncLock(key: string): Promise<boolean> {
    if (this.redis) {
      // Set key if not exists (NX), with expiry of lockTimeoutMs in ms (PX)
      const result = await this.redis.set(`lock:${key}`, '1', 'PX', this.lockTimeoutMs, 'NX');
      return result === 'OK';
    } else {
      const now = Date.now();
      const existing = this.syncLocks.get(key);

      if (existing && now - existing.lockedAt < this.lockTimeoutMs) {
        return false; // Lock active
      }

      this.syncLocks.set(key, { lockedAt: now });
      return true;
    }
  }

  // Release sync lock
  public async releaseSyncLock(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(`lock:${key}`);
    } else {
      this.syncLocks.delete(key);
    }
  }

  // Auth rate limiter middleware (20 requests per 15 min per IP)
  public authRateLimit(maxRequests = 20, windowMs = 15 * 60 * 1000) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
      const key = `ratelimit:${ip}`;
      
      if (this.redis) {
        try {
          const current = await this.redis.incr(key);
          if (current === 1) {
            await this.redis.pexpire(key, windowMs);
          }
          if (current > maxRequests) {
            const ttl = await this.redis.pttl(key);
            res.set('Retry-After', String(Math.ceil(ttl / 1000)));
            res.status(429).json({ error: `Too many requests. Try again in ${Math.ceil(ttl / 60000)} minute(s).` });
            return;
          }
          return next();
        } catch (error) {
          logger.error(`Rate limit error: ${error}`);
          return next(); // Fail open if Redis is down
        }
      } else {
        const now = Date.now();
        const entry = this.rateLimits.get(ip);

        if (!entry || now > entry.resetAt) {
          this.rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
          return next();
        }

        if (entry.count >= maxRequests) {
          const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
          res.set('Retry-After', String(retryAfterSec));
          res.status(429).json({ error: `Too many requests. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).` });
          return;
        }

        entry.count++;
        next();
      }
    };
  }
}

export const lockService = new LockService();
