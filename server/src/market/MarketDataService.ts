/**
 * MarketDataService — Central Market Data Orchestrator
 *
 * Responsibilities:
 * - Provider waterfall: Yahoo → MoneyControl → Investing.com
 * - Redis-backed caching with intelligent TTL
 * - In-memory stale cache as Redis fallback (serves last-known-good data)
 * - In-flight request deduplication (same symbol = same Promise)
 * - Response validation before storing
 * - Provider health monitoring
 * - Symbol normalization
 * - Logging and metrics
 *
 * This is the ONLY class the routes talk to.
 * Frontend never knows which provider served the data.
 */

import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import {
  MarketQuote, ChartCandle, SectorQuote,
  TRACKED_SYMBOLS, SECTOR_SYMBOLS, TIMEFRAME_MAP,
  SymbolDefinition, ProviderName,
} from './types';
import { IMarketProvider } from './providers/IMarketProvider';
import { YahooFinanceProvider } from './providers/YahooFinanceProvider';
import { MoneyControlProvider } from './providers/MoneyControlProvider';
import { InvestingComProvider } from './providers/InvestingComProvider';

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const CACHE_KEYS = {
  quotes: 'market:quotes:v2',
  chart: (symbol: string, interval: string, range: string) =>
    `market:chart:v2:${symbol}:${interval}:${range}`,
  sectors: 'market:sectors:v2',
};

const QUOTE_TTL_SEC = 5;       // 5 seconds — matches polling interval
const SECTOR_TTL_SEC = 10;     // 10 seconds for sectors

// ─── In-Flight Deduplication ──────────────────────────────────────────────────

const inFlight = new Map<string, Promise<any>>();

function dedup<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = factory().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

// ─── In-Memory Stale Cache ────────────────────────────────────────────────────
// Serves last-known-good data when Redis is unavailable AND all providers fail.
// This prevents the frontend from going blank after a transient network hiccup.

interface StaleEntry<T> {
  data: T;
  timestamp: number;
}

const staleCache = new Map<string, StaleEntry<any>>();
const STALE_MAX_AGE_MS = 5 * 60_000; // serve stale data for up to 5 minutes

function getStale<T>(key: string): T | null {
  const entry = staleCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > STALE_MAX_AGE_MS) {
    staleCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setStale<T>(key: string, data: T): void {
  staleCache.set(key, { data, timestamp: Date.now() });
}

// ─── Redis helper — never throws ─────────────────────────────────────────────

async function redisGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

async function redisSet(key: string, ttlSec: number, value: string): Promise<void> {
  try {
    await redis.setex(key, ttlSec, value);
  } catch {
    // Redis unavailable — stale cache handles it
  }
}

// ─── MarketDataService ────────────────────────────────────────────────────────

class MarketDataService {
  private providers: IMarketProvider[];
  private activeProvider: ProviderName = 'yahoo';
  private lastProviderSwitch: number = 0;

  constructor() {
    this.providers = [
      new YahooFinanceProvider(),
      new MoneyControlProvider(),
      new InvestingComProvider(),
    ];
  }

  // ─── Provider Waterfall ───────────────────────────────────────────────────

  private async fetchQuotesFromProviders(symbols: SymbolDefinition[]): Promise<MarketQuote[]> {
    for (const provider of this.providers) {
      if (!provider.isHealthy()) {
        logger.warn(`[MarketDataService] Provider '${provider.name}' unhealthy — skipping`);
        continue;
      }

      const quotes = await provider.fetchQuotes(symbols);
      if (quotes.length > 0) {
        if (this.activeProvider !== provider.name) {
          logger.warn(`[MarketDataService] ⚡ Provider switched: ${this.activeProvider} → ${provider.name}`);
          this.activeProvider = provider.name as ProviderName;
          this.lastProviderSwitch = Date.now();
        }
        return quotes;
      }
    }

    logger.error('[MarketDataService] ALL providers failed — returning empty quotes');
    return [];
  }

  private async fetchChartFromProviders(symbol: string, interval: string, range: string): Promise<ChartCandle[]> {
    for (const provider of this.providers) {
      if (!provider.isHealthy()) continue;

      const candles = await provider.fetchChart(symbol, interval, range);
      if (candles.length > 0) return candles;
    }

    logger.error(`[MarketDataService] All providers failed for chart: ${symbol}`);
    return [];
  }

  // ─── Public: Get Quotes ───────────────────────────────────────────────────

  async getQuotes(symbols: SymbolDefinition[] = TRACKED_SYMBOLS): Promise<MarketQuote[]> {
    const cacheKey = CACHE_KEYS.quotes;

    // 1. Try Redis (hot cache)
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        const parsed: MarketQuote[] = JSON.parse(cached);
        if (parsed.length > 0) return parsed;
      } catch {}
    }

    // 2. Deduped live fetch
    return dedup(cacheKey, async () => {
      let quotes = await this.fetchQuotesFromProviders(symbols);

      if (quotes.length > 0) {
        // Merge with stale cache to handle partial results (e.g., rate limits)
        if (quotes.length < symbols.length) {
          const stale = getStale<MarketQuote[]>(cacheKey) || [];
          const merged = [...quotes];
          const fetchedIds = new Set(quotes.map(q => q.id));
          for (const s of stale) {
            if (!fetchedIds.has(s.id)) merged.push(s);
          }
          quotes = merged;
        }

        await redisSet(cacheKey, QUOTE_TTL_SEC, JSON.stringify(quotes));
        setStale(cacheKey, quotes); // update stale cache on success
        return quotes;
      }

      // 3. All providers failed — serve stale data rather than empty
      const stale = getStale<MarketQuote[]>(cacheKey);
      if (stale && stale.length > 0) {
        logger.warn('[MarketDataService] Serving stale quote data (all providers temporarily failed)');
        return stale;
      }

      return [];
    });
  }

  // ─── Public: Get Sectors ──────────────────────────────────────────────────

  async getSectors(): Promise<SectorQuote[]> {
    const cacheKey = CACHE_KEYS.sectors;

    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        const parsed: SectorQuote[] = JSON.parse(cached);
        if (parsed.length > 0) return parsed;
      } catch {}
    }

    return dedup(cacheKey, async () => {
      const allDefs = [...TRACKED_SYMBOLS, ...SECTOR_SYMBOLS];
      let quotes = await this.fetchQuotesFromProviders(allDefs);

      if (quotes.length > 0) {
        // Merge with stale cache to handle partial results
        if (quotes.length < allDefs.length) {
          const staleQuotes = getStale<MarketQuote[]>('market:quotes:v2_raw_sectors') || [];
          const merged = [...quotes];
          const fetchedIds = new Set(quotes.map(q => q.id));
          for (const s of staleQuotes) {
            if (!fetchedIds.has(s.id)) merged.push(s);
          }
          quotes = merged;
          setStale('market:quotes:v2_raw_sectors', quotes);
        } else {
          setStale('market:quotes:v2_raw_sectors', quotes);
        }

        const sectorQuotes: SectorQuote[] = quotes
          .filter(q => SECTOR_SYMBOLS.some(s => s.id === q.id))
          .map(q => ({
            id: q.id,
            name: q.name,
            symbol: q.symbol,
            changePercent: q.changePercent,
            volume: q.volume,
            isLive: true,
            provider: q.provider,
          }));

        await redisSet(cacheKey, SECTOR_TTL_SEC, JSON.stringify(sectorQuotes));
        setStale(cacheKey, sectorQuotes);
        return sectorQuotes;
      }

      // Stale fallback
      const stale = getStale<SectorQuote[]>(cacheKey);
      if (stale && stale.length > 0) {
        logger.warn('[MarketDataService] Serving stale sector data');
        return stale;
      }

      return [];
    });
  }

  // ─── Public: Get Chart ────────────────────────────────────────────────────

  async getChart(symbolOrId: string, timeframe: string): Promise<ChartCandle[]> {
    // Resolve short ID to Yahoo ticker (e.g. 'nifty' → '^NSEI')
    const allSymbols = [...TRACKED_SYMBOLS, ...SECTOR_SYMBOLS];
    const def = allSymbols.find(s => s.id === symbolOrId || s.symbol === symbolOrId);
    const yahooTicker = def ? def.symbol : symbolOrId;

    const tf = TIMEFRAME_MAP[timeframe] ?? TIMEFRAME_MAP['1D'];
    const cacheKey = CACHE_KEYS.chart(yahooTicker, tf.interval, tf.range);

    // Try Redis first
    const cached = await redisGet(cacheKey);
    if (cached) {
      try {
        const parsed: ChartCandle[] = JSON.parse(cached);
        if (parsed.length > 0) return parsed;
      } catch {}
    }

    // Deduped live fetch
    return dedup(cacheKey, async () => {
      const candles = await this.fetchChartFromProviders(yahooTicker, tf.interval, tf.range);

      if (candles.length > 0) {
        await redisSet(cacheKey, tf.cacheTtlSec, JSON.stringify(candles));
        setStale(cacheKey, candles);
        return candles;
      }

      // Stale fallback
      const stale = getStale<ChartCandle[]>(cacheKey);
      if (stale && stale.length > 0) {
        logger.warn(`[MarketDataService] Serving stale chart for ${yahooTicker}`);
        return stale;
      }

      return [];
    });
  }

  // ─── Public: Health Status ────────────────────────────────────────────────

  getHealthStatus() {
    return {
      activeProvider: this.activeProvider,
      lastProviderSwitch: this.lastProviderSwitch,
      providers: this.providers.map(p => ({
        name: p.name,
        healthy: p.isHealthy(),
      })),
      inFlightRequests: inFlight.size,
      staleCacheEntries: staleCache.size,
    };
  }

  // ─── Public: Force Refresh (bypass cache) ────────────────────────────────

  async forceRefreshQuotes(): Promise<MarketQuote[]> {
    try { await redis.del(CACHE_KEYS.quotes); } catch {}
    staleCache.delete(CACHE_KEYS.quotes);
    return this.getQuotes();
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const marketDataService = new MarketDataService();
