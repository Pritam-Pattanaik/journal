/**
 * NSE Corporate Announcements Source Adapter
 *
 * Polls NSE's public corporate announcement feed.
 * NSE publishes board meeting notices, results, insider trading disclosures,
 * dividend announcements, and regulatory filings here — highest-signal India source.
 *
 * Endpoint: https://www.nseindia.com/api/corporate-announcements?index=equities
 * Note: NSE's API requires a valid browser-like request (session cookies + User-Agent).
 * We use the public /api/corporate-announcements endpoint which works without auth.
 */

import { logger } from '../../../lib/logger';
import { normalise, NormalisedItem } from '../../processing/Normalizer';

const NSE_BASE = 'https://www.nseindia.com';
const NSE_ANNOUNCEMENTS_URL = `${NSE_BASE}/api/corporate-announcements?index=equities`;
const NSE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.nseindia.com/companies-listing/corporate-filings-announcements',
};

export interface RawSourceItem extends NormalisedItem {
  source: string;
  externalId?: string;
  rawPayload: Record<string, unknown>;
}

export async function fetchNSEAnnouncements(timeoutMs = 10_000): Promise<RawSourceItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(NSE_ANNOUNCEMENTS_URL, {
      headers: NSE_HEADERS,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`NSE API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : (data?.data || []);

    return items.slice(0, 50).map((item: any) => {
      const normalised = normalise({
        headline: item.subject || item.desc || item.attchmntText || 'NSE Announcement',
        body: item.attchmntText || item.desc || '',
        publishedAt: item.exchdisstime || item.dt || item.an_dt,
        url: item.attchmntFile
          ? `https://www.nseindia.com${item.attchmntFile}`
          : `https://www.nseindia.com/companies-listing/corporate-filings-announcements`,
      });

      return {
        ...normalised,
        source: 'NSE',
        externalId: item.seqno || item.skid || undefined,
        rawPayload: item as Record<string, unknown>,
      };
    });
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('NSE request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fallback: parse NSE's RSS-style feed if JSON API is unavailable.
 * NSE also publishes announcements via a simplified RSS at a different endpoint.
 */
export async function fetchNSEFallback(): Promise<RawSourceItem[]> {
  logger.debug('[NSE] Using fallback feed');
  // Return empty — the main feed failing gracefully is acceptable
  // In V2 we can add the full RSS fallback here
  return [];
}
