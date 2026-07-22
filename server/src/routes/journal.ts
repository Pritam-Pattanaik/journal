import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/journal
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await prisma.journalEntry.findMany({
      where: { userId: req.userId! },
      orderBy: { date: 'desc' },
    });
    res.json(result);
  } catch (err: any) {
    console.error('Get journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/journal
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const entry = await prisma.journalEntry.create({
      data: {
        userId: req.userId!,
        date: new Date(body.date),
        marketBias: body.marketBias || null,
        keyLevels: body.keyLevels || null,
        watchlist: body.watchlist || null,
        newsNotes: body.newsNotes || null,
        reflection: body.reflection || null,
        whatWentWell: body.whatWentWell || null,
        whatToImprove: body.whatToImprove || null,
        mood: body.mood || null,
        overallDiscipline: body.overallDiscipline || null,
      },
    });
    res.status(201).json(entry);
  } catch (err: any) {
    console.error('Create journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/journal/:id
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const existing = await prisma.journalEntry.findFirst({
      where: { id, userId: req.userId! },
    });
    if (!existing) { res.status(404).json({ error: 'Journal entry not found' }); return; }

    const updated = await prisma.journalEntry.update({
      where: { id },
      data: {
        marketBias: body.marketBias,
        keyLevels: body.keyLevels,
        watchlist: body.watchlist,
        newsNotes: body.newsNotes,
        reflection: body.reflection,
        whatWentWell: body.whatWentWell,
        whatToImprove: body.whatToImprove,
        mood: body.mood,
        overallDiscipline: body.overallDiscipline,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Update journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/journal/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.journalEntry.deleteMany({
      where: { id, userId: req.userId! },
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete journal error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
