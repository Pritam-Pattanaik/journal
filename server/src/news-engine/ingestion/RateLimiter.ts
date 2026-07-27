/**
 * Rate Limiter
 *
 * Per-source rate limiting with exponential backoff + jitter.
 * Prevents hammering external APIs and respects their throttling policies.
 */

import { logger } from '../../lib/logger';
import { SourceConfig } from '../config';

interface SourceState {
  lastCallAt: number;
  consecutiveFailures: number;
  backoffUntil: number;
}

export class RateLimiter {
  private state: Map<string, SourceState> = new Map();

  constructor(private configs: Record<string, SourceConfig>) {}

  /**
   * Returns true if the source can be polled right now.
   */
  canPoll(source: string): boolean {
    const now = Date.now();
    const cfg = this.configs[source];
    const st = this.state.get(source);

    if (!cfg) return false;

    // Respect backoff window
    if (st && now < st.backoffUntil) {
      logger.debug(`[RateLimiter:${source}] In backoff until ${new Date(st.backoffUntil).toISOString()}`);
      return false;
    }

    // Respect minimum poll interval
    if (st && now - st.lastCallAt < cfg.intervalMs) {
      return false;
    }

    return true;
  }

  /**
   * Record a successful poll — resets failure count.
   */
  recordSuccess(source: string): void {
    const now = Date.now();
    this.state.set(source, {
      lastCallAt: now,
      consecutiveFailures: 0,
      backoffUntil: 0,
    });
  }

  /**
   * Record a failed poll — applies exponential backoff.
   */
  recordFailure(source: string, error: Error): void {
    const now = Date.now();
    const cfg = this.configs[source];
    const st = this.state.get(source) ?? { lastCallAt: 0, consecutiveFailures: 0, backoffUntil: 0 };

    st.consecutiveFailures += 1;
    st.lastCallAt = now;

    // Exponential backoff: base * 2^failures + jitter (up to 30s max)
    const jitter = Math.random() * 1_000;
    const backoffMs = Math.min(
      cfg.backoffBaseMs * Math.pow(2, st.consecutiveFailures - 1) + jitter,
      30_000
    );

    st.backoffUntil = now + backoffMs;
    this.state.set(source, st);

    logger.warn(
      `[RateLimiter:${source}] Failure #${st.consecutiveFailures}: ${error.message}. ` +
      `Backing off for ${(backoffMs / 1000).toFixed(1)}s`
    );
  }

  /**
   * Get stats for health reporting.
   */
  getStats(): Record<string, { failures: number; backoffUntil: number | null }> {
    const result: Record<string, { failures: number; backoffUntil: number | null }> = {};
    const now = Date.now();
    for (const [source, st] of this.state) {
      result[source] = {
        failures: st.consecutiveFailures,
        backoffUntil: st.backoffUntil > now ? st.backoffUntil : null,
      };
    }
    return result;
  }
}
