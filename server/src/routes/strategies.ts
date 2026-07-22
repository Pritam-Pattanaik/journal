import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/strategies
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.strategy.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get strategies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/strategies
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, rules, market, timeframe } = req.body;
    const strategy = await prisma.strategy.create({
      data: {
        userId: req.userId!,
        name,
        description: description || null,
        rules: rules || null,
        market: market || [],
        timeframe: timeframe || null,
      },
    });
    res.status(201).json(strategy);
  } catch (err: any) {
    console.error('Create strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/strategies/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, rules, market, timeframe, isActive } = req.body;

    const existing = await prisma.strategy.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) { res.status(404).json({ error: 'Strategy not found' }); return; }

    const updated = await prisma.strategy.update({
      where: { id },
      data: { name, description, rules, market, timeframe, isActive },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Update strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/strategies/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.strategy.deleteMany({
      where: { id, userId: req.userId! },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete strategy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
