import { Request, Response } from 'express';
import { prisma } from '../db';

export type NotificationCategory = 'Trading' | 'Risk' | 'Market' | 'AI' | 'Reports';
export type NotificationPriority = 'Critical' | 'Warning' | 'Success' | 'Information';

interface CreateNotificationDTO {
  userId: string;
  title: string;
  description: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  actionLabel?: string;
  actionUrl?: string;
}

// Store active SSE connections mapped by userId
const clients = new Map<string, Response[]>();

/**
 * Adds a new SSE connection for a user
 */
export function addClient(userId: string, req: Request, res: Response) {
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId)?.push(res);

  req.on('close', () => {
    removeClient(userId, res);
  });
}

function removeClient(userId: string, res: Response) {
  const userClients = clients.get(userId);
  if (userClients) {
    const updated = userClients.filter((client) => client !== res);
    if (updated.length === 0) {
      clients.delete(userId);
    } else {
      clients.set(userId, updated);
    }
  }
}

/**
 * Pushes a real-time event to the user if they are connected via SSE
 */
function emitToUser(userId: string, event: string, data: any) {
  const userClients = clients.get(userId);
  if (userClients) {
    userClients.forEach((client) => {
      client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  }
}

/**
 * Creates a notification in the DB and instantly pushes it to the user via SSE
 */
export async function createNotification(data: CreateNotificationDTO) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        actionLabel: data.actionLabel,
        actionUrl: data.actionUrl,
        isRead: false,
      }
    });

    emitToUser(data.userId, 'new_notification', notification);
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}
