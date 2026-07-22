import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: any, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const note = await prisma.note.create({
      data: { userId: req.userId, title, content, category, tags }
    });
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.patch('/:id', authenticate, async (req: any, res) => {
  try {
    const { title, content, category, tags, isFavorite, isPinned, isArchived } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: { title, content, category, tags, isFavorite, isPinned, isArchived, updatedAt: new Date() }
    });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
