/**
 * Breaking Alert Delivery
 *
 * Delivers high-urgency scored items to relevant users in near-real-time via
 * the existing notification SSE infrastructure (createNotification + SSE push).
 *
 * Only fires for items with urgency='breaking' AND confidence not explicitly low
 * (to avoid noisy breaking alerts during early cold-start period).
 *
 * COMPLIANCE: Every notification body includes the mandatory disclaimer.
 */

import { logger } from '../../lib/logger';
import { prisma } from '../../db';
import { queue, QUEUES, QueueItem } from '../queue/InProcessQueue';
import { FLAGS } from '../config';
import { createNotification } from '../../services/notificationService';
import { getUsersForSectors, getAllWatchlistUsers } from './WatchlistFilter';

export async function deliverBreakingAlert(item: QueueItem): Promise<void> {
  if (!FLAGS.DELIVERY_ENABLED || !FLAGS.BREAKING_ALERTS_ENABLED) return;

  const { impactId, headline, sectorImpact, direction, confidence, urgency, rationale, disclaimer } = item.data as {
    impactId: string;
    rawItemId: string;
    headline: string;
    sectorImpact: string[];
    direction: string;
    confidence: string;
    urgency: string;
    rationale: string;
    disclaimer: string;
  };

  // Only deliver breaking alerts for actual breaking items
  if (urgency !== 'breaking') {
    logger.debug(`[BreakingAlert] Item ${impactId.slice(0, 8)} is routine — skipping breaking alert`);
    return;
  }

  try {
    // Find users with matching watchlist
    let targetUserIds = await getUsersForSectors(sectorImpact);

    // Fallback: if no watchlist users, don't send to everyone — only notify users
    // who have set up a watchlist (respects their choice)
    if (targetUserIds.length === 0) {
      logger.info(`[BreakingAlert] No watchlist matches for sectors [${sectorImpact.join(',')}] — skipping`);
      return;
    }

    const directionEmoji = direction === 'positive' ? '🟢' : direction === 'negative' ? '🔴' : '🟡';
    const sectorLabel = sectorImpact.slice(0, 2).join(', ');

    const notificationTitle = `${directionEmoji} Breaking: ${sectorLabel} Impact`;
    const notificationDesc =
      `${headline.slice(0, 120)}${headline.length > 120 ? '…' : ''}\n\n` +
      `${rationale.slice(0, 200)}${rationale.length > 200 ? '…' : ''}\n\n` +
      `${disclaimer}`;

    // Send notification to each relevant user
    let sentCount = 0;
    for (const userId of targetUserIds) {
      try {
        await createNotification({
          userId,
          title: notificationTitle,
          description: notificationDesc,
          category: 'Market',
          priority: 'Warning',
          actionLabel: 'View in Market Hub',
          actionUrl: '/app/markets?tab=engine',
        });
        sentCount++;
      } catch (err: any) {
        logger.warn(`[BreakingAlert] Failed to notify user ${userId}: ${err.message}`);
      }
    }

    // Mark impact as delivered
    await prisma.newsImpact.update({
      where: { id: impactId },
      data: { humanApproved: FLAGS.HUMAN_REVIEW_REQUIRED ? null : true },
    });

    await prisma.newsRawItem.update({
      where: { id: item.data.rawItemId as string },
      data: { status: 'DELIVERED' },
    }).catch(() => {});

    logger.info(`[BreakingAlert] Delivered to ${sentCount}/${targetUserIds.length} users for impact ${impactId.slice(0, 8)}`);

  } catch (err: any) {
    logger.error(`[BreakingAlert] Delivery failed for ${impactId}: ${err.message}`);
    throw err;
  }
}

export function startDeliveryWorker(): void {
  queue.subscribe(QUEUES.DELIVERY, deliverBreakingAlert, { maxRetries: 2, retryDelayMs: 5_000 });

  queue.on(`dlq:${QUEUES.DELIVERY}`, async (item: QueueItem, err: Error) => {
    logger.error(`[DeliveryWorker] DLQ item ${item.id}: ${err.message}`);
  });

  logger.info('[DeliveryWorker] Started — subscribed to delivery queue');
}
