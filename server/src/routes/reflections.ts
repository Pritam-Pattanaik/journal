import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';
import { streamGroqChat } from '../lib/ai/provider';

const router = Router();

// POST /api/reflections/weekly/generate
router.post('/weekly/generate', authenticate, async (req: any, res) => {
  try {
    const { weekOf } = req.body; // YYYY-MM-DD
    const startOfWeek = new Date(weekOf);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const trades = await prisma.trade.findMany({
      where: {
        userId: req.userId,
        date: { gte: startOfWeek, lt: endOfWeek }
      }
    });

    const prompt = `Analyze the following trading week for ${trades.length} trades. Identify strengths, weaknesses, repeated mistakes, most/least profitable setups, consistency, and improvement suggestions. Do not predict future prices or give trade recommendations. Just summarize and analyze based on the provided data. Trades: ${JSON.stringify(trades)}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    let aiFullResponse = '';
    
    await streamGroqChat([{ role: 'user', content: prompt }], (chunk) => {
      aiFullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });
    
    // Save to DB
    if (aiFullResponse) {
      await prisma.weeklyReview.create({
        data: {
          userId: req.userId,
          weekOf: startOfWeek,
          content: { summary: aiFullResponse }
        }
      });
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Weekly review error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate review' });
    else res.end();
  }
});

// GET /api/reflections/weekly
router.get('/weekly', authenticate, async (req: any, res) => {
  try {
    const reviews = await prisma.weeklyReview.findMany({
      where: { userId: req.userId },
      orderBy: { weekOf: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly reviews' });
  }
});

// POST /api/reflections/monthly
router.post('/monthly', authenticate, async (req: any, res) => {
  try {
    const { month, answers } = req.body;
    const reflection = await prisma.monthlyReflection.create({
      data: { userId: req.userId, month, answers }
    });
    res.status(201).json(reflection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save monthly reflection' });
  }
});

// GET /api/reflections/monthly
router.get('/monthly', authenticate, async (req: any, res) => {
  try {
    const reflections = await prisma.monthlyReflection.findMany({
      where: { userId: req.userId },
      orderBy: { month: 'desc' }
    });
    res.json(reflections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch monthly reflections' });
  }
});

export default router;
