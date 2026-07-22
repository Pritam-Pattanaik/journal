import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId: req.userId, active: true },
      include: { completions: true }
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { description, type, target } = req.body;
    const goal = await prisma.goal.create({
      data: { userId: req.userId, description, type, target }
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.post('/:id/complete', authenticate, async (req: any, res) => {
  try {
    const { date, completed } = req.body;
    const completion = await prisma.goalCompletion.create({
      data: { goalId: req.params.id, date: new Date(date), completed }
    });
    res.json(completion);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete goal' });
  }
});

export default router;
