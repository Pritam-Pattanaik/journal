/**
 * IMarketProvider — Provider Interface Contract
 *
 * Every data provider (Yahoo, MoneyControl, Investing.com) MUST implement this.
 * The orchestrator (MarketDataService) only interacts through this interface.
 * Zero frontend changes required when swapping providers.
 */

import { MarketQuote, ChartCandle, SymbolDefinition } from '../types';

export interface IMarketProvider {
  /** Unique name for this provider (for logging and health tracking) */
  readonly name: string;

  /**
   * Fetch live quotes for all given symbols.
   * Must return normalized MarketQuote[].
   * Must NOT throw — return [] on complete failure.
   */
  fetchQuotes(symbols: SymbolDefinition[]): Promise<MarketQuote[]>;

  /**
   * Fetch historical OHLCV data for charting.
   * interval: '1m', '5m', '1d', etc.
   * range: '1d', '5d', '1mo', '3mo', '6mo', '1y', 'ytd', 'max'
   * Must return normalized ChartCandle[] sorted ascending by time.
   * Must NOT throw — return [] on complete failure.
   */
  fetchChart(symbol: string, interval: string, range: string): Promise<ChartCandle[]>;

  /**
   * Returns true if the provider is currently considered healthy.
   * Used by MarketDataService to skip unhealthy providers without attempting a request.
   */
  isHealthy(): boolean;
}
