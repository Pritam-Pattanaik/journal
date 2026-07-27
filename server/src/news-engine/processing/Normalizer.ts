/**
 * Normalizer
 *
 * Cleans raw ingested content before deduplication and processing:
 * - Strips HTML tags and entities
 * - Normalises whitespace
 * - Converts all timestamps to IST (Asia/Kolkata)
 * - Extracts clean headline and body text
 */

import { logger } from '../../lib/logger';

const HTML_TAG_REGEX = /<[^>]+>/g;
const ENTITY_REGEX = /&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi;
const WHITESPACE_REGEX = /\s+/g;

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(str: string): string {
  return str.replace(ENTITY_REGEX, (match, entity) => {
    if (ENTITY_MAP[entity.toLowerCase()]) return ENTITY_MAP[entity.toLowerCase()];
    if (entity.startsWith('#x')) return String.fromCharCode(parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCharCode(parseInt(entity.slice(1), 10));
    return match;
  });
}

export function stripHtml(raw: string): string {
  return decodeEntities(raw.replace(HTML_TAG_REGEX, ' ')).replace(WHITESPACE_REGEX, ' ').trim();
}

/**
 * Normalise a timestamp to a JS Date object in IST context.
 * Accepts: Unix timestamp (seconds), ISO string, RFC 2822 string.
 */
export function normaliseTimestamp(raw: string | number | Date | undefined | null): Date {
  if (!raw) return new Date();

  try {
    if (raw instanceof Date) return raw;
    if (typeof raw === 'number') {
      // Detect seconds vs milliseconds
      const ts = raw < 1e10 ? raw * 1000 : raw;
      return new Date(ts);
    }
    return new Date(raw);
  } catch {
    logger.warn(`[Normalizer] Failed to parse timestamp: ${raw}`);
    return new Date();
  }
}

export interface NormalisedItem {
  headline: string;
  body: string;
  publishedAt: Date;
  url: string;
}

export function normalise(input: {
  headline: string;
  body?: string;
  summary?: string;
  content?: string;
  publishedAt?: string | number | Date | null;
  pubDate?: string;
  url?: string;
  link?: string;
}): NormalisedItem {
  const headline = stripHtml(input.headline || '').slice(0, 500);
  const rawBody = input.body || input.summary || input.content || '';
  const body = stripHtml(rawBody).slice(0, 5000);
  const publishedAt = normaliseTimestamp(input.publishedAt || input.pubDate);
  const url = (input.url || input.link || '').trim();

  return { headline, body, publishedAt, url };
}
