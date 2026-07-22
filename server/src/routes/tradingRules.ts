import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/trading-rules
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const rules = await prisma.tradingRule.findUnique({
      where: { userId: req.userId! },
    });
    res.json(rules || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trading-rules
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const {
      windowStart, windowEnd,
      maxTradesPerDay, maxDailyLoss, maxLossPerTrade,
      allowedInstruments, allowedMarkets,
    } = req.body;

    const payload = {
      windowStart: windowStart || null,
      windowEnd: windowEnd || null,
      maxTradesPerDay: maxTradesPerDay || null,
      maxDailyLoss: maxDailyLoss ? String(maxDailyLoss) : null,
      maxLossPerTrade: maxLossPerTrade ? String(maxLossPerTrade) : null,
      allowedInstruments: allowedInstruments?.length ? allowedInstruments : [],
      allowedMarkets: allowedMarkets?.length ? allowedMarkets : [],
      updatedAt: new Date(),
    };

    const result = await prisma.tradingRule.upsert({
      where: { userId: req.userId! },
      update: payload,
      create: { userId: req.userId!, ...payload },
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
