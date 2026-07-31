/**
 * MoneyControlProvider — Fallback 1
 *
 * Uses MoneyControl's public price API endpoint.
 * ISOLATED behind IMarketProvider — if this breaks, only this class needs updating.
 * Only activated when YahooFinanceProvider is unhealthy.
 *
 * NOTE: This is an unofficial/undocumented endpoint.
 * Core app functionality NEVER depends on this provider.
 */

import { IMarketProvider } from './IMarketProvider';
import { MarketQuote, ChartCandle, SymbolDefinition, ProviderName } from '../types';
import { logger } from '../../lib/logger';

const REQUEST_TIMEOUT_MS = 10_000;
const HEALTH_RECOVERY_MS = 5 * 60_000;

// MoneyControl symbol mapping (MC uses its own IDs, not Yahoo symbols)
const MC_SYMBOL_MAP: Record<string, string> = {
  '^NSEI':      'NSE:NIFTY_50',
  '^NSEBANK':   'NSE:NIFTY_BANK',
  '^BSESN':     'BSE:SENSEX',
  '^INDIAVIX':  'NSE:INDIA_VIX',
  'USDINR=X':   'CURRENCY:USDINR',
};

// MC price feed base (public, JSON, no auth required)
const MC_BASE = 'https://priceapi.moneycontrol.com/techCharts/techChartController/getHistoricalData';

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class MoneyControlProvider implements IMarketProvider {
  readonly name = 'moneycontrol';

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
      'Accept': 'application/json',
      'Referer': 'https://www.moneycontrol.com/',
    };

    for (const def of symbols) {
      const mcSymbol = MC_SYMBOL_MAP[def.symbol];
      if (!mcSymbol) continue;

      try {
        // MC exposes a quote API via their chart controller
        const url = `https://priceapi.moneycontrol.com/pricefeed/${mcSymbol.startsWith('BSE') ? 'bse' : 'nse'}/I/${mcSymbol.split(':')[1]}`;
        const res = await fetchWithTimeout(url, headers);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const priceFeed = data?.data;
        if (!priceFeed) continue;

        const price = parseFloat(priceFeed.pricecurrent || '0');
        const prevClose = parseFloat(priceFeed.priceclose || priceFeed.priceprevclose || String(price));
        if (!price || price <= 0) continue;

        const change = price - prevClose;
        const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

        quotes.push({
          id: def.id,
          symbol: def.symbol,
          name: def.name,
          price: Number(price.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePct.toFixed(2)),
          open: Number(parseFloat(priceFeed.priceopen || String(price)).toFixed(2)),
          high: Number(parseFloat(priceFeed.pricehigh || String(price)).toFixed(2)),
          low: Number(parseFloat(priceFeed.pricelow || String(price)).toFixed(2)),
          prevClose: Number(prevClose.toFixed(2)),
          volume: parseInt(priceFeed.volume || '0', 10),
          status: 'OPEN',
          updatedAt: Date.now(),
          sparkline: [],
          provider: 'moneycontrol' as ProviderName,
        });

      } catch (err: any) {
        logger.warn(`[MoneyControl] Failed for ${def.symbol}: ${err.message}`);
      }
    }

    if (quotes.length > 0) {
      this.recordSuccess();
      logger.info(`[MoneyControl] FALLBACK: Fetched ${quotes.length} quotes`);
    } else {
      this.recordFailure();
    }

    return quotes;
  }

  async fetchChart(_symbol: string, _interval: string, _range: string): Promise<ChartCandle[]> {
    // MoneyControl chart API requires session cookies — not reliable enough for fallback charts
    // Return empty and let the orchestrator serve cached data
    logger.warn('[MoneyControl] Chart fetch not supported in fallback mode — returning []');
    return [];
  }
}
