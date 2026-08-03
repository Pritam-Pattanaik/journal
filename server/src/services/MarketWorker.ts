/**
 * MarketWorker — SSE Broadcaster
 *
 * Refactored: Now uses MarketDataService (provider waterfall + caching).
 * Responsible ONLY for:
 * - Polling on a 5-second interval
 * - Broadcasting updates via EventEmitter to SSE clients
 * - Maintaining an in-memory cache for instant /quotes responses
 *
 * All actual data fetching logic lives in MarketDataService.
 * MarketWorker is now a thin broadcast layer, not a data fetcher.
 */

import { EventEmitter } from 'events';
import { marketDataService } from '../market/MarketDataService';
import { MarketQuote, TRACKED_SYMBOLS } from '../market/types';
import { logger } from '../lib/logger';

const POLLING_INTERVAL_MS = 60_000; // 60 seconds to prevent Yahoo 429 rate limits

class MarketWorker extends EventEmitter {
  private cache: MarketQuote[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isFetching = false;

  constructor() {
    super();
    this.setMaxListeners(0); // Unlimited SSE client listeners
  }

  public start(): void {
    if (this.intervalId) return;

    // Warm up cache immediately on start
    this.fetchData();

    this.intervalId = setInterval(() => this.fetchData(), POLLING_INTERVAL_MS);
    logger.info(`[MarketWorker] Started — polling every ${POLLING_INTERVAL_MS / 1000}s via MarketDataService`);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[MarketWorker] Stopped');
    }
  }

  public getCache(): MarketQuote[] {
    return this.cache;
  }

  private async fetchData(): Promise<void> {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      // MarketDataService handles: provider waterfall, caching, deduplication
      const quotes = await marketDataService.getQuotes(TRACKED_SYMBOLS);

      if (quotes.length === 0) {
        logger.warn('[MarketWorker] Empty quotes from service — keeping previous cache');
        return;
      }

      // Only broadcast if data actually changed (prevents SSE spam)
      const prevJSON = JSON.stringify(this.cache.map(q => `${q.id}:${q.price}`));
      const nextJSON = JSON.stringify(quotes.map(q => `${q.id}:${q.price}`));

      if (prevJSON !== nextJSON) {
        this.cache = quotes;
        this.emit('update', this.cache);
      } else {
        // Still update cache silently (timestamps etc.) but don't broadcast
        this.cache = quotes;
      }

    } catch (err: any) {
      logger.error(`[MarketWorker] Fetch cycle error: ${err.message}`);
    } finally {
      this.isFetching = false;
    }
  }
}

export const marketWorker = new MarketWorker();
