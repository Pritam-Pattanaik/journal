/**
 * News Engine API Routes
 *
 * Exposes monitoring, admin controls, and the processed news feed.
 *
 * Public (authenticated user):
 *   GET  /api/news-engine/feed              — processed news feed with sector filter
 *   GET  /api/news-engine/digest/today      — today's pre-market digest
 *   GET  /api/news-engine/sectors           — available sector buckets
 *
 * Health (any authenticated user):
 *   GET  /api/news-engine/health            — pipeline health status
 *
 * Admin (ADMIN or SUPER_ADMIN role only):
 *   GET  /api/news-engine/admin/stats       — detailed metrics
 *   GET  /api/news-engine/admin/failed      — dead-letter queue items
 *   POST /api/news-engine/admin/replay/:id  — replay a failed item
 *   POST /api/news-engine/admin/pause       — pause the pipeline
 *   POST /api/news-engine/admin/resume      — resume the pipeline
 *   GET  /api/news-engine/admin/review-queue — items awaiting human review
 *   PATCH /api/news-engine/admin/review/:id  — approve or reject an item
 *
 * COMPLIANCE: All feed responses include the SEBI educational disclaimer.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authenticate, requireRoles } from '../middleware/auth';
import { EDUCATIONAL_DISCLAIMER, SECTOR_KEYWORDS } from '../news-engine/config';
import { isEngineRunning, startNewsEngine, stopNewsEngine } from '../news-engine';
import { getTriageCircuitState } from '../news-engine/processing/TriageWorker';
import { getScoringStats } from '../news-engine/processing/ScoringWorker';
import { getSourceStats } from '../news-engine/ingestion/SourceRegistry';
import { queue, QUEUES } from '../news-engine/queue/InProcessQueue';
import { logger } from '../lib/logger';
import { z } from 'zod';

const router = Router();

// ─── Health Endpoint ─────────────────────────────────────────────────────────

router.get('/health', authenticate, async (_req: Request, res: Response) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [itemsLast1h, scoredLast1h, failedLast1h, triagePass] = await Promise.all([
      prisma.newsRawItem.count({ where: { createdAt: { gte: oneHourAgo } } }),
      prisma.newsRawItem.count({ where: { createdAt: { gte: oneHourAgo }, status: 'SCORED' } }),
      prisma.newsRawItem.count({ where: { createdAt: { gte: oneHourAgo }, status: 'FAILED' } }),
      prisma.newsTriage.count({ where: { createdAt: { gte: oneHourAgo }, relevant: true } }),
    ]);

    const triageTotal = await prisma.newsTriage.count({ where: { createdAt: { gte: oneHourAgo } } });
    const triagePassRate = triageTotal > 0 ? (triagePass / triageTotal) : 0;

    const triageState = getTriageCircuitState();
    const scoringState = getScoringStats();

    const status = !isEngineRunning() ? 'down'
      : triageState.state === 'OPEN' ? 'degraded'
      : failedLast1h > itemsLast1h * 0.3 ? 'degraded'
      : 'healthy';

    res.json({
      status,
      engine: { running: isEngineRunning(), mode: 'EDUCATIONAL_MODE' },
      pipeline: {
        itemsLast1h,
        scoredLast1h,
        failedLast1h,
        triagePassRate: `${(triagePassRate * 100).toFixed(1)}%`,
        triageCircuitBreaker: triageState.state,
        scoringCircuitBreaker: scoringState.circuitState,
        queueDepths: {
          triage: queue.depth(QUEUES.TRIAGE),
          scoring: queue.depth(QUEUES.SCORING),
          delivery: queue.depth(QUEUES.DELIVERY),
        },
      },
      costs: {
        triageDailyUsd: triageState.estimatedDailyCostUsd.toFixed(4),
        scoringDailyUsd: scoringState.dailyCostUsd.toFixed(4),
      },
      sources: getSourceStats(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── News Feed ────────────────────────────────────────────────────────────────

const FeedQuerySchema = z.object({
  sector: z.string().optional(),
  direction: z.enum(['positive', 'negative', 'neutral', 'mixed']).optional(),
  urgency: z.enum(['breaking', 'routine']).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

router.get('/feed', authenticate, async (req: Request, res: Response) => {
  try {
    const query = FeedQuerySchema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ error: query.error.flatten() });
    }

    const { sector, direction, urgency, limit, offset } = query.data;

    const impacts = await prisma.newsImpact.findMany({
      where: {
        ...(sector ? { sectorImpact: { has: sector } } : {}),
        ...(direction ? { direction } : {}),
        // Only show human-approved items if review is required
        OR: [
          { humanApproved: true },
          { humanApproved: null }
        ],
      },
      include: {
        rawItem: {
          include: {
            triage: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const feed = impacts
      .filter(impact => {
        if (urgency && impact.rawItem.triage?.urgency !== urgency) return false;
        return true;
      })
      .map(impact => ({
        id: impact.id,
        headline: impact.rawItem.headline,
        url: impact.rawItem.url,
        source: impact.rawItem.source,
        publishedAt: impact.rawItem.publishedAt,
        sectors: impact.sectorImpact,
        direction: impact.direction,
        confidence: impact.confidence,
        rationale: impact.rationale,
        historicalAnalogues: impact.historicalAnalogues,
        category: impact.rawItem.triage?.category || 'other',
        urgency: impact.rawItem.triage?.urgency || 'routine',
        mode: 'EDUCATIONAL_MODE',
        disclaimer: EDUCATIONAL_DISCLAIMER,
        scoredAt: impact.createdAt,
      }));

    res.json({ feed, total: feed.length, disclaimer: EDUCATIONAL_DISCLAIMER });
  } catch (err: any) {
    logger.error(`[NewsEngine:feed] ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch news feed' });
  }
});

// ─── Today's Digest ───────────────────────────────────────────────────────────

router.get('/digest/today', authenticate, async (_req: Request, res: Response) => {
  try {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const digest = await prisma.newsDigest.findFirst({
      where: {
        date: { gte: todayDate },
        type: 'PRE_MARKET',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!digest) {
      return res.json({
        available: false,
        message: 'Pre-market digest not yet generated for today. Check back at 7:30 AM IST.',
        disclaimer: EDUCATIONAL_DISCLAIMER,
      });
    }

    res.json({
      available: true,
      digest: digest.content,
      generatedAt: digest.createdAt,
      disclaimer: EDUCATIONAL_DISCLAIMER,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch digest' });
  }
});

// ─── Sectors List ─────────────────────────────────────────────────────────────

router.get('/sectors', authenticate, (_req: Request, res: Response) => {
  res.json({
    sectors: Object.keys(SECTOR_KEYWORDS),
    disclaimer: EDUCATIONAL_DISCLAIMER,
  });
});

// ─── Admin: Stats ─────────────────────────────────────────────────────────────

router.get('/admin/stats', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (_req, res) => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [ingested, deduplicated, triaged, scored, delivered, failed, complianceBlocks] =
      await Promise.all([
        prisma.newsRawItem.count({ where: { createdAt: { gte: yesterday } } }),
        prisma.newsRawItem.count({ where: { createdAt: { gte: yesterday } } }), // Approx — actual dedup in logs
        prisma.newsTriage.count({ where: { createdAt: { gte: yesterday }, relevant: true } }),
        prisma.newsImpact.count({ where: { createdAt: { gte: yesterday } } }),
        prisma.newsRawItem.count({ where: { status: 'DELIVERED', createdAt: { gte: yesterday } } }),
        prisma.newsRawItem.count({ where: { status: 'FAILED', createdAt: { gte: yesterday } } }),
        prisma.newsAuditLog.count({ where: { compliancePassed: false, timestamp: { gte: yesterday } } }),
      ]);

    const triageTotal = await prisma.newsTriage.count({ where: { createdAt: { gte: yesterday } } });
    const triageState = getTriageCircuitState();
    const scoringState = getScoringStats();

    res.json({
      last24h: {
        itemsIngested: ingested,
        triagePassRate: triageTotal > 0 ? `${((triaged / triageTotal) * 100).toFixed(1)}%` : 'N/A',
        itemsScored: scored,
        itemsDelivered: delivered,
        itemsFailed: failed,
        complianceBlocks,
      },
      pipeline: {
        status: isEngineRunning() ? 'running' : 'stopped',
        triageCircuit: triageState.state,
        scoringCircuit: scoringState.circuitState,
        estimatedTodayCostUsd: (
          triageState.estimatedDailyCostUsd + scoringState.dailyCostUsd
        ).toFixed(4),
      },
      sources: getSourceStats(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Failed Items ──────────────────────────────────────────────────────

router.get('/admin/failed', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (_req, res) => {
  const items = await prisma.newsRawItem.findMany({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, source: true, headline: true, failureReason: true, createdAt: true },
  });
  res.json({ items, total: items.length });
});

// ─── Admin: Replay Item ───────────────────────────────────────────────────────

router.post('/admin/replay/:id', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const idSchema = z.string().uuid();
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid UUID' });

  const item = await prisma.newsRawItem.findUnique({ where: { id: parsed.data } });
  if (!item) return res.status(404).json({ error: 'Item not found' });

  await prisma.newsRawItem.update({
    where: { id: parsed.data },
    data: { status: 'PENDING', failureReason: null },
  });

  queue.push(QUEUES.TRIAGE, item.id, {
    rawItemId: item.id,
    headline: item.headline,
    body: item.body || '',
    source: item.source,
    sectors: (item.rawPayload as any).sectors || [],
    publishedAt: item.publishedAt.toISOString(),
  });

  logger.info(`[Admin] Replayed item ${item.id} (replayed by admin)`);
  res.json({ success: true, message: `Item ${item.id} re-queued for triage` });
});

// ─── Admin: Pause/Resume ──────────────────────────────────────────────────────

router.post('/admin/pause', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
  stopNewsEngine();
  logger.warn('[Admin] News engine PAUSED by admin');
  res.json({ success: true, message: 'News engine paused' });
});

router.post('/admin/resume', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), (_req, res) => {
  startNewsEngine();
  logger.info('[Admin] News engine RESUMED by admin');
  res.json({ success: true, message: 'News engine resumed' });
});

// ─── Admin: Review Queue ──────────────────────────────────────────────────────

router.get('/admin/review-queue', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (_req, res) => {
  const items = await prisma.newsImpact.findMany({
    where: { humanReviewRequired: true, humanApproved: null },
    include: { rawItem: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ items, total: items.length });
});

router.patch('/admin/review/:id', authenticate, requireRoles(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  const schema = z.object({ approved: z.boolean(), notes: z.string().optional() });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  const idSchema = z.string().uuid();
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid UUID' });

  await prisma.newsImpact.update({
    where: { id: req.params.id as string },
    data: { humanApproved: body.data.approved, humanNotes: body.data.notes || null },
  });

  res.json({ success: true });
});


// ─── Watchlist Management ─────────────────────────────────────────────────────

router.get('/watchlist', authenticate, async (req: any, res: Response) => {
  const items = await prisma.userWatchlist.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ watchlist: items, availableSectors: Object.keys(SECTOR_KEYWORDS) });
});

router.post('/watchlist', authenticate, async (req: any, res: Response) => {
  const schema = z.object({
    type: z.enum(['sector', 'ticker']),
    value: z.string().min(1).max(100),
  });
  const body = schema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.flatten() });

  try {
    const item = await prisma.userWatchlist.create({
      data: { userId: req.userId, type: body.data.type, value: body.data.value },
    });
    res.json({ success: true, item });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Already in watchlist' });
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.delete('/watchlist/:id', authenticate, async (req: any, res: Response) => {
  const idSchema = z.string().uuid();
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid UUID' });

  await prisma.userWatchlist.deleteMany({
    where: { id: req.params.id, userId: req.userId },
  });
  res.json({ success: true });
});

export default router;
