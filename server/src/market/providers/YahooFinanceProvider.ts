/**
 * YahooFinanceProvider — Primary Market Data Provider
 *
 * Uses Yahoo Finance's public (unofficial) JSON API.
 * Implements full retry logic, exponential backoff, timeout handling,
 * and response validation. Never trusts external responses blindly.
 */

import { IMarketProvider } from './IMarketProvider';
import { MarketQuote, ChartCandle, SymbolDefinition, MarketStatus, ProviderName } from '../types';
import { logger } from '../../lib/logger';

const YF_BASE = 'https://query1.finance.yahoo.com';
const YF_CHART_URL = `${YF_BASE}/v8/finance/chart`;

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 2;
const BACKOFF_BASE_MS = 1_000;
const HEALTH_RECOVERY_MS = 30_000; // 30 seconds — recover quickly from transient failures

// Round-robin User-Agents to reduce fingerprinting
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

let uaIndex = 0;
function getUA(): string {
  const ua = USER_AGENTS[uaIndex % USER_AGENTS.length];
  uaIndex++;
  return ua;
}

function buildHeaders(): Record<string, string> {
  return {
    'User-Agent': getUA(),
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://finance.yahoo.com',
    'Referer': 'https://finance.yahoo.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
  };
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: buildHeaders(),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      return json;
    } catch (err: any) {
      if (attempt === retries) throw err;
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
      logger.warn(`[Yahoo] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ─── Market Status Detection ──────────────────────────────────────────────────

function getMarketStatus(symbolId: string, rawObj?: any): MarketStatus {
  // Commodities and currencies trade nearly 24/7
  if (['gold', 'silver', 'crude', 'usdinr'].includes(symbolId)) return '24/7';

  if (!rawObj) return 'CLOSED';

  // 1. Try v7 quote API's direct 'marketState' field
  if (typeof rawObj === 'string') {
    const state = rawObj.toUpperCase();
    if (state === 'REGULAR' || state === 'OPEN') return 'OPEN';
    return 'CLOSED';
  }
  
  if (rawObj.marketState) {
    const state = rawObj.marketState.toUpperCase();
    if (state === 'REGULAR' || state === 'OPEN') return 'OPEN';
    return 'CLOSED';
  }

  // 2. Fallback to v8 chart API's 'currentTradingPeriod'
  if (rawObj.currentTradingPeriod?.regular) {
    const now = Math.floor(Date.now() / 1000);
    const { start, end } = rawObj.currentTradingPeriod.regular;
    if (now >= start && now <= end) return 'OPEN';
    return 'CLOSED';
  }

  return 'CLOSED';
}

// ─── Sparkline Normalizer ─────────────────────────────────────────────────────

function extractSparkline(raw: any): number[] {
  try {
    // Yahoo sometimes returns sparkline in the quote response
    const closes = raw?.spark?.result?.[0]?.response?.[0]?.indicators?.quote?.[0]?.close;
    if (Array.isArray(closes)) {
      return closes.filter((v: any) => typeof v === 'number' && isFinite(v)).slice(-20);
    }
  } catch { /* ignore */ }
  return [];
}

// ─── Quote Normalizer ─────────────────────────────────────────────────────────

function normalizeQuote(raw: any, def: SymbolDefinition): MarketQuote | null {
  try {
    const price = raw.regularMarketPrice ?? raw.bid ?? 0;
    if (!price || price <= 0) return null;

    const prevClose = raw.regularMarketPreviousClose ?? raw.previousClose ?? price;
    const change = raw.regularMarketChange ?? (price - prevClose);
    const changePct = raw.regularMarketChangePercent ?? ((change / prevClose) * 100);

    return {
      id: def.id,
      symbol: def.symbol,
      name: raw.longName || raw.shortName || def.name,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePct.toFixed(2)),
      open: Number((raw.regularMarketOpen ?? price).toFixed(2)),
      high: Number((raw.regularMarketDayHigh ?? price).toFixed(2)),
      low: Number((raw.regularMarketDayLow ?? price).toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      volume: raw.regularMarketVolume ?? 0,
      marketCap: raw.marketCap,
      status: getMarketStatus(def.id, raw),
      updatedAt: (raw.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
      sparkline: extractSparkline(raw),
      provider: 'yahoo' as ProviderName,
    };
  } catch (err: any) {
    logger.warn(`[Yahoo] Failed to normalize quote for ${def.symbol}: ${err.message}`);
    return null;
  }
}

// ─── Chart Meta Normalizer (for quote data extracted from chart API) ──────────
// The chart API meta object contains all the same fields as the v7/quote API
// but doesn't require crumb authentication.

function normalizeChartMeta(data: any, def: SymbolDefinition): MarketQuote | null {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    if (!price || price <= 0) return null;

    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    // Extract sparkline from closes
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const sparkline = closes.filter((v: any) => typeof v === 'number' && isFinite(v)).slice(-20);

    return {
      id: def.id,
      symbol: def.symbol,
      name: def.name,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePct.toFixed(2)),
      open: Number((meta.regularMarketOpen ?? price).toFixed(2)),
      high: Number((meta.regularMarketDayHigh ?? price).toFixed(2)),
      low: Number((meta.regularMarketDayLow ?? price).toFixed(2)),
      prevClose: Number(prevClose.toFixed(2)),
      volume: meta.regularMarketVolume ?? 0,
      status: getMarketStatus(def.id, meta),
      updatedAt: (meta.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000,
      sparkline,
      provider: 'yahoo' as ProviderName,
    };
  } catch (err: any) {
    logger.warn(`[Yahoo] Failed to normalize chart meta for ${def.symbol}: ${err.message}`);
    return null;
  }
}

// ─── Chart Normalizer ─────────────────────────────────────────────────────────

function normalizeChart(data: any): ChartCandle[] {
  try {
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const ohlcv = result.indicators?.quote?.[0];
    if (!ohlcv || !timestamps.length) return [];

    const candles: ChartCandle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = ohlcv.close?.[i];
      const open = ohlcv.open?.[i];
      const high = ohlcv.high?.[i];
      const low = ohlcv.low?.[i];
      const volume = ohlcv.volume?.[i] ?? 0;

      // Skip null candles (gaps in data)
      if (close == null || !isFinite(close)) continue;

      candles.push({
        time: timestamps[i],
        open: Number((open ?? close).toFixed(2)),
        high: Number((high ?? close).toFixed(2)),
        low: Number((low ?? close).toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        value: Number(close.toFixed(2)),
      });
    }

    // Return sorted ascending
    return candles.sort((a, b) => a.time - b.time);
  } catch (err: any) {
    logger.warn(`[Yahoo] Chart normalize error: ${err.message}`);
    return [];
  }
}

// ─── Provider Implementation ──────────────────────────────────────────────────

export class YahooFinanceProvider implements IMarketProvider {
  readonly name = 'yahoo';

  private failCount = 0;
  private lastFailAt: number | null = null;
  private lastSuccessAt: number | null = null;

  isHealthy(): boolean {
    if (this.failCount < 3) return true;
    if (!this.lastFailAt) return true;
    // Allow recovery after HEALTH_RECOVERY_MS
    if (Date.now() - this.lastFailAt > HEALTH_RECOVERY_MS) {
      this.failCount = 0;
      return true;
    }
    return false;
  }

  private recordSuccess() {
    this.failCount = 0;
    this.lastSuccessAt = Date.now();
  }

  private recordFailure() {
    this.failCount++;
    this.lastFailAt = Date.now();
  }

  async fetchQuotes(symbols: SymbolDefinition[]): Promise<MarketQuote[]> {
    if (!this.isHealthy()) {
      logger.warn('[Yahoo] Provider unhealthy — skipping quote fetch');
      return [];
    }

    try {
      // Use the chart API (v8) per-symbol — no crumb/auth required.
      // Each call gets 1d/1m data; we extract the meta object for quote fields.
      // Run all fetches in parallel (some may 429 — we accept partial results).
      const results = await Promise.allSettled(
        symbols.map(async (def) => {
          const url = `${YF_CHART_URL}/${encodeURIComponent(def.symbol)}?interval=1m&range=1d&includePrePost=false&lang=en-US&region=US`;
          const data = await fetchWithRetry(url, 1); // 1 retry per symbol handles transient 429s
          return { def, data };
        })
      );

      const quotes: MarketQuote[] = [];
      for (const result of results) {
        if (result.status === 'rejected') continue;
        const { def, data } = result.value;
        const q = normalizeChartMeta(data, def);
        if (q) quotes.push(q);
      }

      // Accept partial results — at least 3 symbols must succeed
      if (quotes.length < 3) {
        throw new Error(`Too few quotes returned: ${quotes.length}/${symbols.length}`);
      }

      this.recordSuccess();
      logger.info(`[Yahoo] Fetched ${quotes.length}/${symbols.length} quotes via chart API`);
      return quotes;

    } catch (err: any) {
      this.recordFailure();
      logger.error(`[Yahoo] fetchQuotes failed (fail #${this.failCount}): ${err.message}`);
      return [];
    }
  }

  async fetchChart(symbol: string, interval: string, range: string): Promise<ChartCandle[]> {
    if (!this.isHealthy()) {
      logger.warn('[Yahoo] Provider unhealthy — skipping chart fetch');
      return [];
    }

    try {
      const url = `${YF_CHART_URL}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false&events=div|split&lang=en-US&region=US`;
      const data = await fetchWithRetry(url);

      const candles = normalizeChart(data);
      if (!candles.length) {
        throw new Error('Empty chart after normalization');
      }

      this.recordSuccess();
      logger.info(`[Yahoo] Chart ${symbol} ${range}/${interval}: ${candles.length} candles`);
      return candles;

    } catch (err: any) {
      this.recordFailure();
      logger.error(`[Yahoo] fetchChart(${symbol}) failed: ${err.message}`);
      return [];
    }
  }
}
