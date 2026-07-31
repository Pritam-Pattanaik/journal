/**
 * useLiveMarketData — Backward Compatibility Shim
 *
 * This file is kept for backward compatibility only.
 * All logic has been moved to useMarketData.ts.
 * Import from useMarketData.ts for new code.
 */

export {
  useLiveMarketData,
  useLiveChartData,
  type MarketQuote,
  type ChartCandle,
} from './useMarketData';
