/**
 * useMarketData — Enhanced Market Data Hook
 *
 * Provides:
 * - useLiveMarketData: SSE-backed live quotes (replaces old hook, backward compatible)
 * - useLiveChartData: Chart data with 15s polling + abort controller
 * - useMarketNews: Real-time Yahoo Finance news
 * - useMarketSectors: Live sector performance
 * - useAISummary: Fetches AI market summary
 * - useEconomicCalendar: Live calendar events
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api, BASE_URL } from '../lib/api';

// ─── Types (mirroring backend types.ts) ──────────────────────────────────────

export type MarketStatus = 'OPEN' | 'CLOSED' | '24/7';
export type TrendDirection = 'up' | 'down' | 'flat';

export interface MarketQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  marketCap?: number;
  status: MarketStatus;
  updatedAt: number;
  sparkline: number[];
  provider: string;
  flash?: 'up' | 'down' | null;
  // Backward compat aliases
  value?: number;
  pct?: number;
  trend?: TrendDirection;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: number;
  imageUrl?: string;
  category?: string;
}

export interface SectorQuote {
  id: string;
  name: string;
  symbol: string;
  changePercent: number;
  volume?: number;
  isLive: boolean;
  provider: string;
}

export type MarketSentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'MIXED';

export interface MarketSummary {
  sentiment: MarketSentiment;
  highlights: string[];
  risks: string[];
  eventsToWatch: string[];
  educationalInsight: string;
  disclaimer: string;
  generatedAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  country: string;
  countryFlag: string;
  date: string;
  time: string;
  timezone: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string | null;
  description?: string;
}

// ─── useLiveMarketData ────────────────────────────────────────────────────────

export function useLiveMarketData() {
  const [data, setData] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let flashTimer: ReturnType<typeof setTimeout> | null = null;

    const initializeData = async () => {
      try {
        const response = await api.get<MarketQuote[]>('/market/quotes');
        if (isMounted && response?.length > 0) {
          setData(normalizeQuotes(response, []));
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Market data unavailable');
          setLoading(false);
        }
      }
    };

    const connectSSE = (retryCount = 0) => {
      const MAX_RETRIES = 10;
      const BASE_DELAY_MS = 5_000;
      const MAX_DELAY_MS = 60_000;

      // Use cookie-based auth instead of exposing JWT in URL query string
      const url = `${BASE_URL}/market/stream`;
      eventSource = new EventSource(url, { withCredentials: true });

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const newQuotes = JSON.parse(event.data) as MarketQuote[];
          if (!Array.isArray(newQuotes) || newQuotes.length === 0) return;

          setData(prev => normalizeQuotes(newQuotes, prev));
          setLoading(false);
          setError(null);

          // Clear flash after 300ms
          if (flashTimer) clearTimeout(flashTimer);
          flashTimer = setTimeout(() => {
            if (isMounted) {
              setData(curr => curr.map(q => ({ ...q, flash: null })));
            }
          }, 300);
        } catch { /* ignore */ }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (!isMounted) return;

        if (retryCount >= MAX_RETRIES) {
          setError('Live market stream unavailable. Refresh to retry.');
          return;
        }

        // Exponential backoff: 5s, 10s, 20s, 40s ... max 60s
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
        setTimeout(() => {
          if (isMounted) connectSSE(retryCount + 1);
        }, delay);
      };
    };

    initializeData().then(() => {
      if (isMounted) connectSSE(0);
    });

    return () => {
      isMounted = false;
      if (flashTimer) clearTimeout(flashTimer);
      eventSource?.close();
    };
  }, []);

  return { data, loading, error };
}

function normalizeQuotes(newQuotes: MarketQuote[], prevData: MarketQuote[]): MarketQuote[] {
  return newQuotes.map(q => {
    const prev = prevData.find(p => p.id === q.id);
    const flash: 'up' | 'down' | null =
      prev && prev.price !== q.price
        ? q.price > prev.price ? 'up' : 'down'
        : null;

    return {
      ...q,
      // Backward compatibility aliases
      value: q.price,
      pct: q.changePercent,
      trend: q.changePercent >= 0 ? 'up' : 'down',
      flash,
    };
  });
}

// ─── useLiveChartData ─────────────────────────────────────────────────────────

export function useLiveChartData(symbol: string, timeframe: string) {
  const [data, setData] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchChart = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);
      const response = await api.get<ChartCandle[]>(
        `/market/chart/${encodeURIComponent(symbol)}?timeframe=${timeframe}`
      );
      if (!controller.signal.aborted) {
        setData(response ?? []);
        setError(null);
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setError('Chart data unavailable');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [symbol, timeframe]);

  // Include timeframe explicitly to ensure the interval is reset when timeframe changes
  useEffect(() => {
    fetchChart();

    // 15-second refresh for intraday (1D); cleared and not recreated for other timeframes
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timeframe === '1D') {
      interval = setInterval(fetchChart, 15_000);
    }

    return () => {
      abortRef.current?.abort();
      if (interval) clearInterval(interval);
    };
  }, [fetchChart, timeframe]); // timeframe is already part of fetchChart via useCallback, but listed explicitly for clarity

  return { data, loading, error, refresh: fetchChart };
}

// ─── useMarketNews ────────────────────────────────────────────────────────────

export function useMarketNews(limit = 20) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{ articles: NewsArticle[]; count: number }>(
        `/market/news?limit=${limit}`
      );
      setArticles(res?.articles ?? []);
      setError(null);
    } catch (err: any) {
      setError('News unavailable');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60_000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { articles, loading, error, refresh: fetchNews };
}

// ─── useMarketSectors ─────────────────────────────────────────────────────────

export function useMarketSectors() {
  const [sectors, setSectors] = useState<SectorQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSectors = useCallback(async () => {
    try {
      const res = await api.get<SectorQuote[]>('/market/sectors');
      if (res?.length > 0) {
        setSectors(res);
        setError(null);
      }
    } catch (err: any) {
      setError('Sector data unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSectors();
    const interval = setInterval(fetchSectors, 15_000);
    return () => clearInterval(interval);
  }, [fetchSectors]);

  return { sectors, loading, error, refresh: fetchSectors };
}

// ─── useAISummary ─────────────────────────────────────────────────────────────

export function useAISummary() {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    let attempt = 0;
    const maxRetries = 3;
    let delay = 2000;

    setLoading(true);
    setRetrying(false);
    setError(null);

    while (attempt < maxRetries) {
      try {
        const res = await api.get<MarketSummary>('/market/ai-summary');
        setSummary(res);
        setError(null);
        setLoading(false);
        setRetrying(false);
        return;
      } catch (err: any) {
        attempt++;
        if (attempt >= maxRetries) {
          setError('AI summary unavailable');
          setLoading(false);
          setRetrying(false);
          return;
        }
        setRetrying(true);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 2s, 4s, 8s
      }
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    // Refresh AI summary every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return { summary, loading, retrying, error, refresh: fetchSummary };
}

// ─── useEconomicCalendar ──────────────────────────────────────────────────────

export function useEconomicCalendar(limit = 20) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCalendar = async () => {
      try {
        const res = await api.get<{ events: CalendarEvent[]; count: number }>(
          `/market/calendar?limit=${limit}`
        );
        if (isMounted) {
          setEvents(res?.events ?? []);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError('Calendar unavailable');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCalendar();
    // Refresh every hour
    const interval = setInterval(fetchCalendar, 60 * 60_000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [limit]);

  return { events, loading, error };
}
