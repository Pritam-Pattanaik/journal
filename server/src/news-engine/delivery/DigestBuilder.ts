/**
 * Digest Builder
 *
 * Compiles the pre-market (7:30 AM IST) digest from all SCORED items
 * since the previous digest. Stores the digest in the NewsDigest table
 * and creates notifications for all watchlist users.
 *
 * Structure of a digest:
 * - Top breaking items (urgency=breaking, sorted by most sectors)
 * - Routine items grouped by sector
 * - Macro context (USD/INR, Brent, S&P)
 * - Mandatory disclaimer
 */

import * as cron from 'node-cron';

import { logger } from '../../lib/logger';
import { prisma } from '../../db';
import { FLAGS, DIGEST_SCHEDULE, EDUCATIONAL_DISCLAIMER } from '../config';
import { getAllWatchlistUsers } from './WatchlistFilter';
import { createNotification } from '../../services/notificationService';

interface DigestItem {
  rawItemId: string;
  headline: string;
  sectors: string[];
  direction: string;
  confidence: string;
  urgency: string;
  rationale: string;
}

async function buildDigest(type: 'PRE_MARKET' | 'EOD'): Promise<void> {
  if (!FLAGS.DELIVERY_ENABLED) return;

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Check if digest already built for today
  const existing = await prisma.newsDigest.findUnique({
    where: { type_date: { type, date: todayDate } },
  });

  if (existing) {
    logger.info(`[DigestBuilder] ${type} digest already built for today — skipping`);
    return;
  }

  // Gather scored items from last 12 hours (pre-market) or last 8 hours (EOD)
  const hoursBack = type === 'PRE_MARKET' ? 12 : 8;
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

  const scoredItems = await prisma.newsImpact.findMany({
    where: {
      createdAt: { gte: since },
      humanApproved: FLAGS.HUMAN_REVIEW_REQUIRED ? true : undefined,
    },
    include: { rawItem: { include: { triage: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  if (scoredItems.length === 0) {
    logger.info(`[DigestBuilder] No scored items for ${type} digest`);
    return;
  }

  // Build digest payload
  const digestItems: DigestItem[] = scoredItems.map(impact => ({
    rawItemId: impact.rawItemId,
    headline: impact.rawItem.headline,
    sectors: impact.sectorImpact,
    direction: impact.direction,
    confidence: impact.confidence,
    urgency: impact.rawItem.triage?.urgency || 'routine',
    rationale: impact.rationale,
  }));

  // Group by sector for display
  const bySector: Record<string, DigestItem[]> = {};
  for (const item of digestItems) {
    for (const sector of item.sectors) {
      if (!bySector[sector]) bySector[sector] = [];
      bySector[sector].push(item);
    }
  }

  const digestPayload = {
    type,
    generatedAt: new Date().toISOString(),
    totalItems: digestItems.length,
    breakingCount: digestItems.filter(i => i.urgency === 'breaking').length,
    sectors: Object.keys(bySector),
    bySector,
    allItems: digestItems,
    disclaimer: EDUCATIONAL_DISCLAIMER,
  };

  // Save digest
  await prisma.newsDigest.create({
    data: {
      type,
      date: todayDate,
      // Cast to any to satisfy Prisma's InputJsonValue — all values are JSON-serialisable
      content: digestPayload as any,
      itemCount: digestItems.length,
    },
  });

  // Notify watchlist users
  const watchlistUsers = await getAllWatchlistUsers();
  const label = type === 'PRE_MARKET' ? 'Pre-Market' : 'End-of-Day';
  const sectorSummary = Object.keys(bySector).slice(0, 3).join(', ');

  for (const userId of watchlistUsers) {
    await createNotification({
      userId,
      title: `📰 ${label} Market Digest Ready`,
      description:
        `${digestItems.length} market events analysed. ` +
        `Key sectors: ${sectorSummary || 'Various'}. ` +
        `${EDUCATIONAL_DISCLAIMER}`,
      category: 'Market',
      priority: 'Information',
      actionLabel: 'View Digest',
      actionUrl: '/app/markets?tab=engine',
    }).catch(() => {}); // Non-critical per user
  }

  logger.info(
    `[DigestBuilder] ${type} digest built: ${digestItems.length} items, ` +
    `${watchlistUsers.length} users notified`
  );
}

const scheduledDigestTasks: cron.ScheduledTask[] = [];


export function startDigestBuilder(): void {
  if (!FLAGS.DELIVERY_ENABLED) return;

  // Pre-market digest: 7:30 AM IST (02:00 UTC Mon–Fri)
  scheduledDigestTasks.push(
    cron.schedule(DIGEST_SCHEDULE.PRE_MARKET_CRON, () => {
      buildDigest('PRE_MARKET').catch(err =>
        logger.error(`[DigestBuilder] PRE_MARKET failed: ${err.message}`)
      );
    })
  );

  // EOD digest: 4:00 PM IST (10:30 UTC Mon–Fri)
  scheduledDigestTasks.push(
    cron.schedule(DIGEST_SCHEDULE.EOD_CRON, () => {
      buildDigest('EOD').catch(err =>
        logger.error(`[DigestBuilder] EOD failed: ${err.message}`)
      );
    })
  );

  logger.info('[DigestBuilder] Scheduled pre-market (7:30 AM IST) + EOD (4:00 PM IST) digests');
}

export function stopDigestBuilder(): void {
  scheduledDigestTasks.forEach(t => t.stop());
  scheduledDigestTasks.length = 0;
}

export { buildDigest };
