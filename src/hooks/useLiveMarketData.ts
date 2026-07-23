import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface MarketQuote {
  id: string;
  name: string;
  value: number;
  change: number;
  pct: number;
  trend: 'up' | 'down';
  status: 'OPEN' | 'CLOSED' | '24/7';
  updatedAt: number;
  sparkline: number[];
  flash?: 'up' | 'down' | null;
}

export function useLiveMarketData(pollingInterval = 3000) {
  const [data, setData] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchQuotes = async () => {
      try {
        const response = await api.get('/market/quotes');
        if (!isMounted) return;
        
        // Merge with previous data to detect flashes
        setData(prevData => {
          const newQuotes = response as MarketQuote[];
          return newQuotes.map(newQuote => {
            const prevQuote = prevData.find(p => p.id === newQuote.id);
            let flash: 'up' | 'down' | null = null;
            
            if (prevQuote && prevQuote.value !== newQuote.value) {
              flash = newQuote.value > prevQuote.value ? 'up' : 'down';
            }
            
            return { ...newQuote, flash };
          });
        });
        
        setError(null);
        setLoading(false);
        
        // Clear flashes after a short delay
        setTimeout(() => {
          if (isMounted) {
            setData(curr => curr.map(q => ({ ...q, flash: null })));
          }
        }, 300);

      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to fetch market quotes:', err);
        setError('Market data unavailable');
        // Do not set loading to false immediately on error if we already have data
        // Let it just fail silently in the background instead of breaking the UI
        if (data.length === 0) {
          setLoading(false);
        }
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, pollingInterval);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollingInterval]); // data intentionally omitted from dependency array to avoid reset loops

  return { data, loading, error };
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  value: number; // for line chart
}

export function useLiveChartData(symbol: string, timeframe: string) {
  const [data, setData] = useState<ChartCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchChart = async () => {
      try {
        setLoading(true);
        const response = await api.get<ChartCandle[]>(`/market/chart/${symbol.toLowerCase()}?timeframe=${timeframe}`);
        if (!isMounted) return;
        
        setData(response);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to fetch chart data:', err);
        setError('Chart data unavailable');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChart();
    
    // For 1D chart, we poll more frequently
    let interval: ReturnType<typeof setInterval>;
    if (timeframe === '1D') {
      interval = setInterval(fetchChart, 15000); // 15 seconds
    }
    
    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [symbol, timeframe]);

  return { data, loading, error };
}
