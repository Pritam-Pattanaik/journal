import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { computeDailyDisciplineSummaries } from '../lib/discipline/disciplineSummary';
import { createNotification } from '../services/notificationService';

const router = Router();

// GET /api/trades/summary/daily
router.get('/summary/daily', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.userId! },
      select: {
        date: true,
        exitTime: true,
        disciplineScore: true,
        disciplineSignals: true,
        disciplineReasons: true,
      },
      orderBy: { date: 'asc' }
    });
    const summaries = computeDailyDisciplineSummaries(trades);
    res.json(summaries);
  } catch (err: any) {
    console.error('Get daily summaries error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trades
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.trade.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get trades error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trades
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const trade = await prisma.trade.create({
      data: {
        userId: req.userId!,
        broker: body.broker || 'manual',
        brokerTradeId: body.brokerTradeId || null,
        date: new Date(body.date),
        symbol: body.symbol,
        market: body.market,
        instrumentType: body.instrumentType,
        direction: body.direction || null,
        entryPrice: body.entryPrice?.toString() || null,
        exitPrice: body.exitPrice?.toString() || null,
        quantity: body.quantity?.toString() || null,
        pnl: body.pnl?.toString() || null,
        charges: body.charges?.toString() || null,
        netPnl: body.netPnl?.toString() || null,
        status: body.status || null,
        strategyId: body.strategyId || null,
        setupDescription: body.setupDescription || null,
        mindset: body.mindset || null,
        decisionNotes: body.decisionNotes || null,
        learnings: body.learnings || null,
        disciplineScore: body.disciplineScore || null,
        disciplineReasons: body.disciplineReasons || null,
        disciplineSignals: body.disciplineSignals || null,
        disciplineVersion: body.disciplineVersion || 1,
        isManualOverride: body.isManualOverride || false,
        manualScore: body.manualScore || null,
        computedAt: body.computedAt ? new Date(body.computedAt) : null,
        tags: body.tags || [],
        stopLoss: body.stopLoss?.toString() || null,
        mistakes: body.mistakes || [],
        checklist: body.checklist || null,
        source: body.source || 'manual',
      },
    });

    await createNotification({
      userId: req.userId!,
      title: 'New Trade Logged',
      description: `Logged a ${body.direction || 'new'} trade for ${body.symbol}`,
      category: 'Trading',
      priority: 'Information',
      actionLabel: 'View Trade',
      actionUrl: '/app/journal'
    });

    res.status(201).json(trade);
  } catch (err: any) {
    console.error('Create trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/trades/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const updates: any = { updatedAt: new Date() };
    if (body.date !== undefined) updates.date = new Date(body.date);
    if (body.symbol !== undefined) updates.symbol = body.symbol;
    if (body.market !== undefined) updates.market = body.market;
    if (body.instrumentType !== undefined) updates.instrumentType = body.instrumentType;
    if (body.direction !== undefined) updates.direction = body.direction;
    if (body.entryPrice !== undefined) updates.entryPrice = body.entryPrice?.toString();
    if (body.exitPrice !== undefined) updates.exitPrice = body.exitPrice?.toString();
    if (body.quantity !== undefined) updates.quantity = body.quantity?.toString();
    if (body.pnl !== undefined) updates.pnl = body.pnl?.toString();
    if (body.charges !== undefined) updates.charges = body.charges?.toString();
    if (body.netPnl !== undefined) updates.netPnl = body.netPnl?.toString();
    if (body.status !== undefined) updates.status = body.status;
    if (body.strategyId !== undefined) updates.strategyId = body.strategyId;
    if (body.setupDescription !== undefined) updates.setupDescription = body.setupDescription;
    if (body.mindset !== undefined) updates.mindset = body.mindset;
    if (body.decisionNotes !== undefined) updates.decisionNotes = body.decisionNotes;
    if (body.learnings !== undefined) updates.learnings = body.learnings;
    if (body.disciplineScore !== undefined) updates.disciplineScore = body.disciplineScore;
    if (body.disciplineReasons !== undefined) updates.disciplineReasons = body.disciplineReasons;
    if (body.disciplineSignals !== undefined) updates.disciplineSignals = body.disciplineSignals;
    if (body.disciplineVersion !== undefined) updates.disciplineVersion = body.disciplineVersion;
    if (body.isManualOverride !== undefined) updates.isManualOverride = body.isManualOverride;
    if (body.manualScore !== undefined) updates.manualScore = body.manualScore;
    if (body.computedAt !== undefined) updates.computedAt = body.computedAt ? new Date(body.computedAt) : null;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.stopLoss !== undefined) updates.stopLoss = body.stopLoss?.toString();
    if (body.mistakes !== undefined) updates.mistakes = body.mistakes;
    if (body.checklist !== undefined) updates.checklist = body.checklist;

    const existing = await prisma.trade.findFirst({
      where: { id, userId: req.userId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    const updated = await prisma.trade.update({
      where: { id },
      data: updates,
    });

    // Check specific changes for notifications
    if (body.strategyId && existing.strategyId !== body.strategyId) {
      await createNotification({
        userId: req.userId!,
        title: 'Strategy Assigned',
        description: `Strategy applied to trade ${existing.symbol}`,
        category: 'Trading',
        priority: 'Information',
      });
    }

    if (body.isManualOverride && !existing.isManualOverride) {
      await createNotification({
        userId: req.userId!,
        title: 'Manual Discipline Override',
        description: `Discipline score manually overridden for ${existing.symbol}`,
        category: 'Risk',
        priority: 'Warning',
      });
    }

    // Generic edit notification
    if (Object.keys(updates).length > 1 && !body.strategyId && !body.isManualOverride) {
      await createNotification({
        userId: req.userId!,
        title: 'Trade Edited',
        description: `Updated details for trade ${existing.symbol}`,
        category: 'Trading',
        priority: 'Information',
      });
    }

    res.json(updated);
  } catch (err: any) {
    console.error('Update trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/trades/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.trade.findFirst({
      where: { id, userId: req.userId! },
    });
    
    await prisma.trade.deleteMany({
      where: { id, userId: req.userId! },
    });

    if (existing) {
      await createNotification({
        userId: req.userId!,
        title: 'Trade Deleted',
        description: `Deleted trade ${existing.symbol}`,
        category: 'Trading',
        priority: 'Warning',
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete trade error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
