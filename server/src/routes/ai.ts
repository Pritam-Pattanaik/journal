import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';
import { buildConversationContext } from '../lib/ai/promptBuilder';
import { streamGroqChat, generateGroqJSON } from '../lib/ai/provider';
import { validateDisciplineEvaluation } from '../lib/ai/disciplineSchema';
import { createNotification } from '../services/notificationService';

const router = Router();

// Get coach memory
router.get('/coach-memory', authenticate, async (req: any, res) => {
  try {
    const memories = await prisma.coachMemory.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coach memory' });
  }
});

// Get all conversations for a user
router.get('/conversations', authenticate, async (req: any, res) => {
  try {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Create a new conversation
router.post('/conversations', authenticate, async (req: any, res) => {
  try {
    const { title } = req.body;
    const conversation = await prisma.aiConversation.create({
      data: {
        userId: req.userId,
        title: title || 'New Conversation'
      }
    });
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticate, async (req: any, res) => {
  try {
    const messages = await prisma.aiMessage.findMany({
      where: {
        conversationId: req.params.id,
        conversation: { userId: req.userId } // Security check
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete a conversation
router.delete('/conversations/:id', authenticate, async (req: any, res) => {
  try {
    await prisma.aiConversation.delete({
      where: {
        id: req.params.id,
        userId: req.userId // Ensure user owns it
      }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Rename a conversation
router.put('/conversations/:id', authenticate, async (req: any, res) => {
  try {
    const { title } = req.body;
    const conv = await prisma.aiConversation.update({
      where: {
        id: req.params.id,
        userId: req.userId
      },
      data: { title }
    });
    res.json(conv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to rename conversation' });
  }
});

// Toggle Pin conversation
router.patch('/conversations/:id/pin', authenticate, async (req: any, res) => {
  try {
    const { isPinned } = req.body;
    const conv = await prisma.aiConversation.update({
      where: { id: req.params.id, userId: req.userId },
      data: { isPinned }
    });
    res.json(conv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin conversation' });
  }
});

// Auto-generate a smart title for the conversation based on the first message
router.patch('/conversations/:id/generate-title', authenticate, async (req: any, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId, userId: req.userId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 2 } }
    });

    if (!conversation || conversation.messages.length === 0) {
      return res.status(404).json({ error: 'Conversation or messages not found' });
    }

    // Extract the user's first raw prompt
    const firstMsg = conversation.messages[0].content;
    const cleanMsg = firstMsg.replace(/^\[.*?\]\s*/, '').trim(); // strip [MODE:xyz]
    
    // Ensure title is derived strictly from the first message
    const cleanAiTitle = cleanMsg.length > 60 ? cleanMsg.substring(0, 60) + '...' : cleanMsg;

    const updated = await prisma.aiConversation.update({
      where: { id: conversationId },
      data: { title: cleanAiTitle || 'New Conversation' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to generate title:', error);
    res.status(500).json({ error: 'Failed to generate title' });
  }
});

// Toggle Archive conversation
router.patch('/conversations/:id/archive', authenticate, async (req: any, res) => {
  try {
    const { isArchived } = req.body;
    const conv = await prisma.aiConversation.update({
      where: { id: req.params.id, userId: req.userId },
      data: { isArchived }
    });
    res.json(conv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Streaming Chat Endpoint
router.post('/chat', authenticate, async (req: any, res) => {
  console.log('[AI-DEBUG-1] POST /chat hit. userId:', req.userId);
  const { conversationId, message } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: 'conversationId and message are required' });
  }

  try {
    const conversation = await prisma.aiConversation.findUnique({
      where: { id: conversationId, userId: req.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const userMessage = await prisma.aiMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: message
      }
    });

    // Parse Mode
    let actualMessage = message;
    let mode = 'general';
    if (message.startsWith('[MODE:')) {
      const endBracket = message.indexOf(']');
      if (endBracket !== -1) {
        mode = message.substring(6, endBracket);
        actualMessage = message.substring(endBracket + 1).trim();
      }
    }

    const trades = await prisma.trade.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 100
    });

    const journals = await prisma.journalEntry.findMany({
      where: { userId: req.userId },
      orderBy: { date: 'desc' },
      take: 30
    });

    const recentMessages = conversation.messages.map(m => ({ role: m.role, content: m.content }));
    const messagesContext = buildConversationContext(trades, journals, recentMessages, actualMessage, mode);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let aiFullResponse = '';
    let isAborted = false;
    const abortController = new AbortController();

    req.on('close', () => {
      isAborted = true;
      abortController.abort();
    });

    try {
      await streamGroqChat(messagesContext, (chunk) => {
        aiFullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }, abortController.signal);

      // Save assistant message when done
      if (aiFullResponse && !isAborted) {
        await prisma.aiMessage.create({
          data: {
            conversationId,
            role: 'assistant',
            content: aiFullResponse
          }
        });
        
        // Update conversation updated_at for sorting
        await prisma.aiConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: any) {
      if (error.name === 'AbortError' || isAborted) {
        console.log('Stream aborted by client.');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  }
});

// ─── POST /api/ai/evaluate-trade ────────────────────────────────────────────
// Structured discipline evaluation endpoint
router.post('/evaluate-trade', authenticate, async (req: any, res) => {
  try {
    const { symbol, date, direction, entryPrice, exitPrice, netPnl, quantity, strategyName, mindset, decisionNotes, setupDescription, learnings, mistakes } = req.body;

    const prompt = `You are an elite trading discipline evaluator. Analyze this trade and return a structured discipline evaluation.

TRADE DATA:
Symbol: ${symbol}
Date: ${date}
Direction: ${direction}
Entry: ${entryPrice} | Exit: ${exitPrice}
Net P&L: ₹${netPnl}
Quantity: ${quantity}
Strategy: ${strategyName || 'None'}
Mindset: ${mindset || 'Not logged'}
Decision Notes: ${decisionNotes || 'None'}
Setup: ${setupDescription || 'None'}
Learnings: ${learnings || 'None'}
Mistakes: ${Array.isArray(mistakes) ? mistakes.join(', ') : 'None'}

SCALE:
5/5 Elite — Perfect execution, no emotional mistakes, risk respected, plan followed.
4/5 Excellent — Minor execution mistakes only.
3/5 Good — Acceptable execution, some emotional leakage.
2/5 Poor — Repeated mistakes, weak discipline.
1/5 Critical — Major behavioral failures, immediate review required.

Return JSON matching this schema exactly:
{
  "confidence": 0.92,
  "reasons": ["Entry followed plan", "Risk respected"],
  "mistakes": ["Exited before target"],
  "strengths": ["No revenge trading", "Position sizing respected"],
  "breakdown": {
    "entryPlan": true,
    "riskManagement": true,
    "exitExecution": false,
    "emotionControl": true,
    "ruleCompliance": true
  }
}`;

    const aiData = await generateGroqJSON([{ role: 'user', content: prompt }]);
    const validated = validateDisciplineEvaluation(aiData);

    if (!validated) {
      await createNotification({
        userId: req.userId,
        title: 'AI Analysis Failed',
        description: 'The AI returned an invalid response for trade evaluation.',
        category: 'AI',
        priority: 'Warning',
      });
      return res.status(422).json({ error: 'AI returned invalid discipline evaluation' });
    }

    // Since this is a user-initiated synchronous request, creating a notification for success 
    // every time might be too noisy. But the user explicitly requested it in Phase 2: "AI analysis completed".
    await createNotification({
      userId: req.userId,
      title: 'AI Analysis Completed',
      description: `Discipline score computed for trade ${symbol}`,
      category: 'AI',
      priority: 'Success',
      actionLabel: 'View Details',
      actionUrl: '/app/journal'
    });

    res.json({
      confidence: validated.confidence,
      reason: validated.reasons.join('. '),
      reasons: validated.reasons,
      mistakes: validated.mistakes,
      strengths: validated.strengths,
      breakdown: validated.breakdown,
    });
  } catch (error) {
    console.error('Evaluate trade error:', error);
    res.status(500).json({ error: 'Failed to evaluate trade discipline' });
  }
});

export default router;
