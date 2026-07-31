/**
 * InvestingComProvider — Fallback 2 (Last Resort)
 *
 * Uses Investing.com's public API endpoint.
 * ISOLATED behind IMarketProvider — core app never depends on this.
 * Only activated when both Yahoo AND MoneyControl are unavailable.
 *
 * NOTE: Requires header spoofing. Unstable. Subject to breakage.
 * If this breaks, the app falls back to cached data with a stale indicator.
 */

import { IMarketProvider } from './IMarketProvider';
import { MarketQuote, ChartCandle, SymbolDefinition, ProviderName } from '../types';
import { logger } from '../../lib/logger';

const REQUEST_TIMEOUT_MS = 12_000;
const HEALTH_RECOVERY_MS = 10 * 60_000;

// Investing.com internal pair IDs for Indian indices
const INVESTING_PAIR_MAP: Record<string, number> = {
  '^NSEI':    17971,   // NIFTY 50
  '^NSEBANK': 27074,   // BANK NIFTY
  '^BSESN':   17944,   // SENSEX
  'USDINR=X': 160,     // USD/INR
  'GC=F':     8830,    // Gold
  'CL=F':     8849,    // Crude Oil
};

export class InvestingComProvider implements IMarketProvider {
  readonly name = 'investing';

  private failCount = 0;
  private lastFailAt: number | null = null;

  isHealthy(): boolean {
    if (this.failCount < 3) return true;
    if (!this.lastFailAt) return true;
    if (Date.now() - this.lastFailAt > HEALTH_RECOVERY_MS) {
      this.failCount = 0;
      return true;
    }
    return false;
  }

  private recordSuccess() { this.failCount = 0; this.lastFailAt = null; }
  private recordFailure() { this.failCount++; this.lastFailAt = Date.now(); }

  async fetchQuotes(symbols: SymbolDefinition[]): Promise<MarketQuote[]> {
    if (!this.isHealthy()) return [];

    const quotes: MarketQuote[] = [];
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.investing.com/',
      'X-Requested-With': 'XMLHttpRequest',
      'domain-id': 'www',
    };

    const pairIds = symbols
      .map(s => INVESTING_PAIR_MAP[s.symbol])
      .filter(Boolean);

    if (!pairIds.length) {
      logger.warn('[Investing.com] No mapped pair IDs for requested symbols');
      return [];
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const url = `https://api.investing.com/api/financialdata/assets/currentdata/bulk?pairs=${pairIds.join(',')}&time-frame=PT1M&fields=last,change,change_pct`;
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const items: any[] = data?.data ?? [];

      for (const item of items) {
        const pairId = item.pair_id;
        const def = symbols.find(s => INVESTING_PAIR_MAP[s.symbol] === pairId);
        if (!def) continue;

        const price = parseFloat(item.last?.replace(/,/g, '') || '0');
        if (!price) continue;

        const changePct = parseFloat(item.change_pct?.replace('%', '') || '0');
        const prevClose = price / (1 + changePct / 100);
        const change = price - prevClose;

        quotes.push({
          id: def.id,
          symbol: def.symbol,
          name: def.name,
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePct.toFixed(2)),
          open: price,
          high: price,
          low: price,
          prevClose: Number(prevClose.toFixed(2)),
          volume: 0,
          status: 'OPEN',
          updatedAt: Date.now(),
          sparkline: [],
          provider: 'investing' as ProviderName,
        });
      }

      if (quotes.length > 0) {
        this.recordSuccess();
        logger.info(`[Investing.com] FALLBACK-2: Fetched ${quotes.length} quotes`);
      } else {
        this.recordFailure();
      }

    } catch (err: any) {
      this.recordFailure();
      logger.error(`[Investing.com] fetchQuotes failed: ${err.message}`);
    }

    return quotes;
  }

  async fetchChart(_symbol: string, _interval: string, _range: string): Promise<ChartCandle[]> {
    // Investing.com chart API requires authenticated sessions
    logger.warn('[Investing.com] Chart fetch not supported — returning []');
    return [];
  }
}
