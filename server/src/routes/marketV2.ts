/**
 * Market V2 Router — Unified Market Data API
 *
 * All routes flow through MarketDataService which handles:
 * - Provider waterfall (Yahoo → MoneyControl → Investing.com)
 * - Redis caching
 * - Request deduplication
 * - Response normalization
 *
 * The old market.ts routes are preserved for backward compatibility
 * but now delegate to this service layer.
 *
 * Endpoints:
 *   GET  /api/market/quotes           — Live market quotes (all tracked symbols)
 *   GET  /api/market/stream           — SSE live quote stream
 *   GET  /api/market/chart/:symbol    — Historical OHLCV chart data
 *   GET  /api/market/sectors          — Live sector performance
 *   GET  /api/market/news             — Market news from Yahoo Finance RSS
 *   GET  /api/market/ai-summary       — AI-generated market summary (SSE stream)
 *   GET  /api/market/calendar         — Economic calendar events
 *   GET  /api/market/health           — Provider health status
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { marketWorker } from '../services/MarketWorker';
import { marketDataService } from '../market/MarketDataService';
import { yahooNewsService } from '../market/YahooNewsService';
import { marketAIService } from '../market/MarketAIService';
import { economicCalendarService } from '../market/EconomicCalendarService';
import { logger } from '../lib/logger';
import { redis } from '../lib/redis';

const router = Router();

// ─── Quotes ───────────────────────────────────────────────────────────────────

router.get('/quotes', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Try MarketWorker cache first (5s SSE push data, always fresh)
    const workerCache = marketWorker.getCache();
    if (workerCache && workerCache.length > 0) {
      res.json(workerCache);
      return;
    }
    // Fallback to MarketDataService (provider waterfall)
    const quotes = await marketDataService.getQuotes();
    res.json(quotes);
  } catch (err: any) {
    logger.error(`[Market Routes] GET /quotes error: ${err.message}`);
    res.status(500).json({ error: 'Market data temporarily unavailable' });
  }
});

// ─── SSE Stream ───────────────────────────────────────────────────────────────

router.get('/stream', authenticate, (req: AuthRequest, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',   // Disable Nginx buffering for SSE
  });

  // Send initial data immediately (no blank screen)
  const initialCache = marketWorker.getCache();
  if (initialCache && initialCache.length > 0) {
    res.write(`data: ${JSON.stringify(initialCache)}\n\n`);
  }

  const updateListener = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  marketWorker.on('update', updateListener);

  // Heartbeat every 30s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30_000);

  req.on('close', () => {
    marketWorker.removeListener('update', updateListener);
    clearInterval(heartbeat);
  });
});

// ─── Chart ────────────────────────────────────────────────────────────────────

router.get('/chart/:symbol', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const symbol = decodeURIComponent(String(req.params.symbol));
    const timeframe = String(req.query.timeframe || '1D');

    const candles = await marketDataService.getChart(symbol, timeframe);

    if (!candles.length) {
      res.status(503).json({ error: 'Chart data temporarily unavailable' });
      return;
    }

    res.json(candles);
  } catch (err: any) {
    logger.error(`[Market Routes] GET /chart error: ${err.message}`);
    res.status(500).json({ error: 'Chart data error' });
  }
});

// ─── Sectors ──────────────────────────────────────────────────────────────────

router.get('/sectors', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sectors = await marketDataService.getSectors();
    res.json(sectors);
  } catch (err: any) {
    logger.error(`[Market Routes] GET /sectors error: ${err.message}`);
    res.status(500).json({ error: 'Sector data unavailable' });
  }
});

// ─── News ─────────────────────────────────────────────────────────────────────

router.get('/news', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(String(req.query.limit || '25'), 10);
    const symbol = req.query.symbol ? String(req.query.symbol) : undefined;

    let articles;
    if (symbol) {
      articles = await yahooNewsService.getSymbolNews([symbol], limit);
    } else {
      articles = await yahooNewsService.getMarketNews(limit);
    }

    res.json({ articles, count: articles.length, source: 'yahoo-finance-rss' });
  } catch (err: any) {
    logger.error(`[Market Routes] GET /news error: ${err.message}`);
    res.status(500).json({ error: 'News data unavailable' });
  }
});

// ─── AI Summary (non-streaming, cached 5min) ──────────────────────────────────

router.get('/ai-summary', authenticate, async (_req: AuthRequest, res: Response): Promise<void> => {
  const AI_CACHE_KEY = 'market:ai-summary:v2';
  const AI_CACHE_TTL = 300; // 5 minutes

  try {
    // Check cache
    try {
      const cached = await redis.get(AI_CACHE_KEY);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {}

    const summary = await marketAIService.generateSummaryJSON();

    if (!summary) {
      res.status(503).json({ error: 'AI summary temporarily unavailable' });
      return;
    }

    // Cache the result
    try {
      await redis.setex(AI_CACHE_KEY, AI_CACHE_TTL, JSON.stringify(summary));
    } catch {}

    res.json(summary);
  } catch (err: any) {
    logger.error(`[Market Routes] GET /ai-summary error: ${err.message}`);
    res.status(500).json({ error: 'AI service error' });
  }
});

// ─── AI Summary Stream (SSE) ──────────────────────────────────────────────────

router.get('/ai-summary/stream', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    await marketAIService.streamSummary(res);
  } catch (err: any) {
    logger.error(`[Market Routes] AI stream error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`);
    res.end();
  }
});

// ─── Economic Calendar ────────────────────────────────────────────────────────

router.get('/calendar', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(String(req.query.limit || '30'), 10);
    const events = await economicCalendarService.getEvents(limit);
    res.json({ events, count: events.length });
  } catch (err: any) {
    logger.error(`[Market Routes] GET /calendar error: ${err.message}`);
    res.status(500).json({ error: 'Calendar data unavailable' });
  }
});

// ─── Provider Health ──────────────────────────────────────────────────────────

router.get('/health', authenticate, (_req: AuthRequest, res: Response) => {
  const health = marketDataService.getHealthStatus();
  res.json(health);
});

export default router;
