import { useState, useEffect } from 'react';
import { api, BASE_URL } from '../lib/api';

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

export function useLiveMarketData() {
  const [data, setData] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let eventSource: EventSource | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    const initializeData = async () => {
      try {
        const response = await api.get<MarketQuote[]>('/market/quotes');
        if (isMounted && response) {
          setData(response);
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
    
    const connectSSE = () => {
      const token = localStorage.getItem('token');
      // Pass token via query params since EventSource doesn't support headers
      eventSource = new EventSource(`${BASE_URL}/market/stream?token=${token}`);
      
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const newQuotes = JSON.parse(event.data) as MarketQuote[];
          
          setData(prevData => {
            return newQuotes.map(newQuote => {
              const prevQuote = prevData.find(p => p.id === newQuote.id);
              let flash: 'up' | 'down' | null = null;
              
              if (prevQuote && prevQuote.value !== newQuote.value) {
                flash = newQuote.value > prevQuote.value ? 'up' : 'down';
              }
              
              return { ...newQuote, flash };
            });
          });
          
          setLoading(false);
          setError(null);
          
          // Clear flashes after a short delay
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            if (isMounted) {
              setData(curr => curr.map(q => ({ ...q, flash: null })));
            }
          }, 300);
          
        } catch (err) {
          console.error('SSE Parsing error', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        eventSource?.close();
        // Attempt to reconnect gracefully
        if (isMounted) {
            setTimeout(connectSSE, 5000);
        }
      };
    };

    initializeData().then(() => {
       if (isMounted) connectSSE();
    });
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

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
