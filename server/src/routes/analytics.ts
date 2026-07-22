import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/mistakes — Database aggregation
router.get('/mistakes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.userId! },
      select: { mistakes: true, pnl: true }
    });

    const mistakeCounts: Record<string, number> = {};
    const mistakePnl: Record<string, number> = {};

    for (const trade of trades) {
      const pnlVal = Number(trade.pnl || 0);
      for (const mistake of trade.mistakes) {
        mistakeCounts[mistake] = (mistakeCounts[mistake] || 0) + 1;
        mistakePnl[mistake] = (mistakePnl[mistake] || 0) + pnlVal;
      }
    }

    const result = Object.keys(mistakeCounts).map(mistake => ({
      mistake,
      count: mistakeCounts[mistake],
      pnlImpact: mistakePnl[mistake]
    })).sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mistake analytics' });
  }
});

// GET /api/analytics/session — Optimized DB projections
router.get('/session', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { userId: req.userId! },
      select: { date: true, pnl: true }
    });

    const byWeekday: Record<number, { count: number; pnl: number }> = {};
    const byHour: Record<number, { count: number; pnl: number }> = {};

    for (const t of trades) {
      const d = new Date(t.date);
      const day = d.getDay();
      const hour = d.getHours();
      const pnlVal = Number(t.pnl || 0);

      if (!byWeekday[day]) byWeekday[day] = { count: 0, pnl: 0 };
      byWeekday[day].count += 1;
      byWeekday[day].pnl += pnlVal;

      if (!byHour[hour]) byHour[hour] = { count: 0, pnl: 0 };
      byHour[hour].count += 1;
      byHour[hour].pnl += pnlVal;
    }

    res.json({ byWeekday, byHour });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session analytics' });
  }
});

// GET /api/analytics/risk — Prisma Database Aggregations (O(1) Memory footprint)
router.get('/risk', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [totalAgg, winAgg, lossAgg] = await Promise.all([
      prisma.trade.aggregate({
        where: { userId },
        _count: { id: true },
      }),
      prisma.trade.aggregate({
        where: { userId, status: 'WIN' },
        _count: { id: true },
        _sum: { pnl: true },
        _avg: { pnl: true },
      }),
      prisma.trade.aggregate({
        where: { userId, status: 'LOSS' },
        _count: { id: true },
        _sum: { pnl: true },
        _avg: { pnl: true },
      }),
    ]);

    const totalTrades = totalAgg._count.id;
    const winCount = winAgg._count.id;
    const lossCount = lossAgg._count.id;

    const totalWin = winAgg._sum.pnl ? Number(winAgg._sum.pnl) : 0;
    const totalLoss = lossAgg._sum.pnl ? Math.abs(Number(lossAgg._sum.pnl)) : 0;

    const avgWin = winCount > 0 ? (winAgg._avg.pnl ? Number(winAgg._avg.pnl) : totalWin / winCount) : 0;
    const avgLoss = lossCount > 0 ? (lossAgg._avg.pnl ? Math.abs(Number(lossAgg._avg.pnl)) : totalLoss / lossCount) : 0;
    const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
    const profitFactor = totalLoss > 0 ? totalWin / totalLoss : totalWin > 0 ? 999 : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    res.json({
      avgWin,
      avgLoss,
      winRate,
      profitFactor,
      expectancy,
      totalTrades
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch risk analytics' });
  }
});

export default router;
