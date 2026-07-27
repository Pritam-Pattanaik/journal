/**
 * Deduplicator
 *
 * Prevents the same news item from being processed multiple times.
 * Strategy: SHA-256 hash of (normalised_headline + source + date_string).
 * Same story from 5 outlets on the same day → single record.
 *
 * The hash is stored in the `dedupeHash` column with a @unique constraint,
 * so duplicate inserts are caught at the DB level as a safety net.
 */

import { createHash } from 'crypto';
import { prisma } from '../../db';
import { logger } from '../../lib/logger';

/**
 * Generate a deterministic deduplication hash for a news item.
 */
export function buildDedupeHash(headline: string, source: string, publishedAt: Date): string {
  const datePart = publishedAt.toISOString().split('T')[0]; // YYYY-MM-DD
  const normalised = headline
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();

  const key = `${normalised}|${source.toUpperCase()}|${datePart}`;
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Check if an item with this hash already exists.
 * Returns true if it's a duplicate (should be discarded).
 */
export async function isDuplicate(hash: string): Promise<boolean> {
  try {
    const existing = await prisma.newsRawItem.findUnique({
      where: { dedupeHash: hash },
      select: { id: true },
    });
    return existing !== null;
  } catch (err: any) {
    // On DB error, allow the item through (fail open — better to have duplicates than lose items)
    logger.warn(`[Deduper] DB check failed for hash ${hash.slice(0, 8)}…: ${err.message}. Allowing through.`);
    return false;
  }
}
