import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { marketWorker } from '../services/MarketWorker';
import { redis } from '../lib/redis';

const router = Router();

const SYMBOLS = {
  nifty: '^NSEI',
  banknifty: '^NSEBANK',
  finnifty: 'NIFTY_FIN_SERVICE.NS',
  sensex: '^BSESN',
  vix: '^INDIAVIX'
};

// GET /api/market/quotes
router.get('/quotes', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quotes = marketWorker.getCache();
    res.json(quotes);
  } catch (err: any) {
    console.error('Get market quotes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/market/stream (Server-Sent Events)
router.get('/stream', authenticate, (req: AuthRequest, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial data immediately
  const initialCache = marketWorker.getCache();
  if (initialCache.length > 0) {
    res.write(`data: ${JSON.stringify(initialCache)}\n\n`);
  }

  // Listener for future updates
  const updateListener = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  marketWorker.on('update', updateListener);

  req.on('close', () => {
    marketWorker.removeListener('update', updateListener);
  });
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
    const cacheKey = `market:chart:${ticker}:${timeframe}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch (e) {
      console.warn('Redis cache get failed for chart:', e);
    }

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

    try {
      await redis.set(cacheKey, JSON.stringify(chartData), 'EX', 60);
    } catch (e) {
      console.warn('Redis cache set failed for chart:', e);
    }

    res.json(chartData);
  } catch (err: any) {
    console.error('Get market chart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
