/**
 * Macro Data Source Adapter
 *
 * Fetches macro indicators relevant to Indian market direction:
 * - USD/INR exchange rate (ExchangeRate.host — free, unlimited)
 * - Brent crude oil price (Alpha Vantage free tier)
 * - US S&P 500 / futures (Yahoo Finance — same pattern as existing market.ts)
 *
 * These are not "news items" per se, but significant macro moves are
 * synthesised into a brief summary item by the adapter when thresholds are crossed.
 */

import { logger } from '../../../lib/logger';
import { normalise, NormalisedItem } from '../../processing/Normalizer';

export interface RawSourceItem extends NormalisedItem {
  source: string;
  externalId?: string;
  rawPayload: Record<string, unknown>;
}

// ─── USD/INR ─────────────────────────────────────────────────────────────────

interface MacroState {
  usdInr: number | null;
  brentCrude: number | null;
  snp500: number | null;
  lastCheckedAt: Date | null;
}

const state: MacroState = {
  usdInr: null,
  brentCrude: null,
  snp500: null,
  lastCheckedAt: null,
};

async function fetchUsdInr(): Promise<number | null> {
  try {
    const url = 'https://api.exchangerate.host/live?currencies=INR&source=USD';
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.quotes?.USDINR || null;
  } catch {
    return null;
  }
}

async function fetchSnP500(): Promise<number | null> {
  try {
    // Yahoo Finance — same unofficial API as market.ts
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1d&range=1d';
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch {
    return null;
  }
}

async function fetchBrentCrude(): Promise<number | null> {
  try {
    // Yahoo Finance for UKOIL or Brent futures
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/BZ%3DF?interval=1d&range=1d';
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch {
    return null;
  }
}

/**
 * Generates synthetic news items only when macro thresholds are crossed.
 * This avoids noise — a 0.1% move is not news; a 1.5% move is.
 */
const THRESHOLDS = {
  USD_INR_MOVE_PCT: 0.5,      // Alert if USD/INR moves >0.5% from last check
  BRENT_MOVE_PCT: 2.0,        // Alert if Brent crude moves >2% from last check
  SNP_MOVE_PCT: 1.0,          // Alert if S&P 500 moves >1% from last check
};

export async function fetchMacroItems(): Promise<RawSourceItem[]> {
  const [usdInr, brentCrude, snp500] = await Promise.all([
    fetchUsdInr(),
    fetchBrentCrude(),
    fetchSnP500(),
  ]);

  const items: RawSourceItem[] = [];
  const now = new Date();

  // Detect significant moves and synthesise news items
  if (usdInr && state.usdInr) {
    const movePct = Math.abs((usdInr - state.usdInr) / state.usdInr) * 100;
    if (movePct >= THRESHOLDS.USD_INR_MOVE_PCT) {
      const dir = usdInr > state.usdInr ? 'weakened' : 'strengthened';
      const headline = `INR ${dir} ${movePct.toFixed(2)}% against USD to ₹${usdInr.toFixed(2)}`;
      items.push({
        ...normalise({ headline, publishedAt: now, url: 'https://www.xe.com/currencycharts/?from=USD&to=INR' }),
        source: 'MACRO',
        externalId: `usdinr-${now.toISOString().split('T')[0]}`,
        rawPayload: { usdInr, prevUsdInr: state.usdInr, movePct },
      });
      logger.info(`[Macro] USD/INR significant move detected: ${movePct.toFixed(2)}%`);
    }
  }

  if (brentCrude && state.brentCrude) {
    const movePct = Math.abs((brentCrude - state.brentCrude) / state.brentCrude) * 100;
    if (movePct >= THRESHOLDS.BRENT_MOVE_PCT) {
      const dir = brentCrude > state.brentCrude ? 'surged' : 'dropped';
      const headline = `Brent crude oil ${dir} ${movePct.toFixed(1)}% to $${brentCrude.toFixed(2)}/bbl`;
      items.push({
        ...normalise({ headline, publishedAt: now, url: 'https://www.oilprice.com/' }),
        source: 'MACRO',
        externalId: `brent-${now.toISOString().split('T')[0]}`,
        rawPayload: { brentCrude, prevBrentCrude: state.brentCrude, movePct },
      });
      logger.info(`[Macro] Brent crude significant move detected: ${movePct.toFixed(1)}%`);
    }
  }

  if (snp500 && state.snp500) {
    const movePct = Math.abs((snp500 - state.snp500) / state.snp500) * 100;
    if (movePct >= THRESHOLDS.SNP_MOVE_PCT) {
      const dir = snp500 > state.snp500 ? 'gained' : 'fell';
      const headline = `S&P 500 ${dir} ${movePct.toFixed(1)}% — potential Nifty gap-${snp500 > state.snp500 ? 'up' : 'down'} at open`;
      items.push({
        ...normalise({ headline, publishedAt: now, url: 'https://finance.yahoo.com/quote/%5EGSPC' }),
        source: 'MACRO',
        externalId: `snp500-${now.toISOString().split('T')[0]}`,
        rawPayload: { snp500, prevSnp500: state.snp500, movePct },
      });
      logger.info(`[Macro] S&P 500 significant move detected: ${movePct.toFixed(1)}%`);
    }
  }

  // Update state for next cycle
  if (usdInr) state.usdInr = usdInr;
  if (brentCrude) state.brentCrude = brentCrude;
  if (snp500) state.snp500 = snp500;
  state.lastCheckedAt = now;

  return items;
}

export function getMacroState(): MacroState {
  return { ...state };
}
