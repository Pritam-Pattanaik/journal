import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const q = (req.query.q as string)?.toLowerCase() || '';
    if (!q) return res.json({ notes: [], trades: [], strategies: [], goals: [], journals: [] });
    
    const [notes, trades, strategies, goals, journals] = await Promise.all([
      prisma.note.findMany({
        where: {
          userId: req.userId,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } }
          ]
        },
        take: 10
      }),
      prisma.trade.findMany({
        where: {
          userId: req.userId,
          OR: [
            { symbol: { contains: q, mode: 'insensitive' } },
            { setupDescription: { contains: q, mode: 'insensitive' } },
            { learnings: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q] } }
          ]
        },
        take: 10
      }),
      prisma.strategy.findMany({
        where: {
          userId: req.userId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.goal.findMany({
        where: {
          userId: req.userId,
          description: { contains: q, mode: 'insensitive' }
        },
        take: 5
      }),
      prisma.journalEntry.findMany({
        where: {
          userId: req.userId,
          OR: [
            { marketBias: { contains: q, mode: 'insensitive' } },
            { keyLevels: { contains: q, mode: 'insensitive' } },
            { reflection: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      })
    ]);

    res.json({ notes, trades, strategies, goals, journals });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
