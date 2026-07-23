import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { addClient, NotificationCategory, NotificationPriority } from '../services/notificationService';
import { authenticate } from '../middleware/auth';

const router = Router();

// 1. SSE Stream Endpoint
router.get('/stream', authenticate, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const userId = (req as any).userId;
  
  // Send an initial connected event so client knows it's alive
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

  addClient(userId, req, res);
});

// 2. Fetch Notifications
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: (req as any).userId },
      orderBy: { createdAt: 'desc' },
      take: 100 // limit to 100 for now
    });
    
    // Map DB names to UI structure
    const mapped = notifications.map(n => ({
      id: n.id,
      title: n.title,
      description: n.description,
      category: n.category as NotificationCategory,
      priority: n.priority as NotificationPriority,
      isRead: n.isRead,
      timestamp: n.createdAt.getTime(),
      actionLabel: n.actionLabel || undefined,
      actionUrl: n.actionUrl || undefined,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 3. Mark As Read
router.patch('/:id/read', authenticate, async (req: any, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.userId },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// 4. Mark All As Read
router.patch('/read-all', authenticate, async (req: any, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// 5. Delete Notification
router.delete('/:id', authenticate, async (req: any, res: Response) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id, userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// 6. Delete All
router.delete('/', authenticate, async (req: any, res: Response) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.userId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete all' });
  }
});

export default router;
