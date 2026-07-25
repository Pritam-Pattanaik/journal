import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const SYMBOLS = {
  nifty: '^NSEI',
  banknifty: '^NSEBANK',
  finnifty: 'NIFTY_FIN_SERVICE.NS',
  sensex: '^BSESN',
  vix: '^INDIAVIX'
};

const CACHE_TTL = 3000; // 3 seconds minimum cache to prevent hammering Yahoo
let cachedQuotes: any = null;
let lastFetch = 0;

// GET /api/market/quotes
router.get('/quotes', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    if (cachedQuotes && (now - lastFetch < CACHE_TTL)) {
      res.json(cachedQuotes);
      return;
    }

    // Fetch all symbols in parallel
    const promises = Object.entries(SYMBOLS).map(async ([key, symbol]) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
        const response = await fetch(url);
        const data = await response.json();
        
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) throw new Error('Invalid data format');

        const now = new Date();
        const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric', minute: 'numeric', weekday: 'short' } as const;
        const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
        let hour = 0, minute = 0, weekday = '';
        for (const part of parts) {
          if (part.type === 'hour') hour = parseInt(part.value, 10);
          if (part.type === 'minute') minute = parseInt(part.value, 10);
          if (part.type === 'weekday') weekday = part.value;
        }
        
        let status = 'CLOSED';
        if (weekday !== 'Sat' && weekday !== 'Sun') {
          const timeInMinutes = (hour === 24 ? 0 : hour) * 60 + minute;
          const marketOpen = 9 * 60 + 15; // 09:15 AM
          const marketClose = 15 * 60 + 30; // 03:30 PM
          if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
            status = 'OPEN';
          }
        }

        const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
        const current = meta.regularMarketPrice;
        const change = current - prevClose;
        const pct = (change / prevClose) * 100;

        return {
          id: key,
          name: key === 'nifty' ? 'NIFTY 50' : 
                key === 'banknifty' ? 'BANK NIFTY' : 
                key === 'finnifty' ? 'FINNIFTY' : 
                key === 'sensex' ? 'SENSEX' : 
                'INDIA VIX',
          value: current,
          change: change,
          pct: pct,
          trend: change >= 0 ? 'up' : 'down',
          status: status,
          updatedAt: meta.regularMarketTime * 1000,
          sparkline: data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
        };
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);
    
    if (validResults.length > 0) {
      cachedQuotes = validResults;
      lastFetch = Date.now();
    }

    res.json(validResults);
  } catch (err: any) {
    console.error('Get market quotes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/chart/:symbol
router.get('/chart/:symbol', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const symbolKey = req.params.symbol as keyof typeof SYMBOLS;
    const ticker = SYMBOLS[symbolKey] || '^NSEI';
    const timeframe = req.query.timeframe as string || '1D';
    
    // Map UI timeframe to Yahoo timeframe
    let interval = '1m';
    let range = '1d';
    
    switch(timeframe) {
      case '1D': interval = '1m'; range = '1d'; break;
      case '5D': interval = '5m'; range = '5d'; break;
      case '1M': interval = '1d'; range = '1mo'; break;
      case '3M': interval = '1d'; range = '3mo'; break;
      case '6M': interval = '1d'; range = '6mo'; break;
      case '1Y': interval = '1d'; range = '1y'; break;
      case 'YTD': interval = '1d'; range = 'ytd'; break;
      case 'Max': interval = '1mo'; range = 'max'; break;
      default: interval = '1m'; range = '1d';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const response = await fetch(url);
    const data = await response.json();
    
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('Invalid chart data format');
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    
    // Convert to lightweight-charts format
    const chartData = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close[i] !== null && quotes.open[i] !== null) {
        chartData.push({
          time: timestamps[i],
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          value: quotes.close[i] // for line chart
        });
      }
    }

    res.json(chartData);
  } catch (err: any) {
    console.error('Get market chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
