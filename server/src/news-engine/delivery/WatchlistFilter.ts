/**
 * Watchlist Filter
 *
 * Determines which users should receive a notification for a given news item
 * based on their watchlist sector/ticker preferences.
 *
 * COMPLIANCE NOTE: Filtering by watchlist is NOT personalised advice.
 * It is relevance filtering — showing users news about sectors they've said
 * they care about, not telling them what to do about it.
 * This distinction must be preserved in all product copy.
 */

import { prisma } from '../../db';
import { logger } from '../../lib/logger';

/**
 * Returns user IDs who have at least one watchlist entry matching
 * the sectors in the given impact record.
 */
export async function getUsersForSectors(sectorImpact: string[]): Promise<string[]> {
  if (!sectorImpact || sectorImpact.length === 0) return [];

  try {
    const matches = await prisma.userWatchlist.findMany({
      where: {
        type: 'sector',
        value: { in: sectorImpact },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return matches.map(m => m.userId);
  } catch (err: any) {
    logger.warn(`[WatchlistFilter] DB query failed: ${err.message}`);
    return [];
  }
}

/**
 * Returns all user IDs who have set up a watchlist (any entry).
 * Used for broad digest delivery.
 */
export async function getAllWatchlistUsers(): Promise<string[]> {
  try {
    const users = await prisma.userWatchlist.findMany({
      select: { userId: true },
      distinct: ['userId'],
    });
    return users.map(u => u.userId);
  } catch (err: any) {
    logger.warn(`[WatchlistFilter] getAllWatchlistUsers failed: ${err.message}`);
    return [];
  }
}
