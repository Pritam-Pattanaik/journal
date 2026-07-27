/**
 * RBI & PIB RSS Feed Adapters
 *
 * RBI (Reserve Bank of India): Monetary policy decisions, rate changes, circulars.
 * PIB (Press Information Bureau): Government policy, budget, regulatory changes.
 *
 * Both publish standard RSS feeds. We use fast-xml-parser to parse them.
 */

import { XMLParser } from 'fast-xml-parser';
import { normalise, NormalisedItem } from '../../processing/Normalizer';

const RBI_RSS_URL = 'https://www.rbi.org.in/scripts/rss.aspx';
const PIB_RSS_URL = 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3';

const RSS_HEADERS = {
  'User-Agent': 'TradeVault-NewsEngine/1.0 (+https://tradevault.in)',
  'Accept': 'application/rss+xml, application/xml, text/xml',
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export interface RawSourceItem extends NormalisedItem {
  source: string;
  externalId?: string;
  rawPayload: Record<string, unknown>;
}

async function fetchRSSFeed(url: string, source: string, timeoutMs = 10_000): Promise<RawSourceItem[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: RSS_HEADERS,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${source} RSS responded with HTTP ${response.status}`);
    }

    const xml = await response.text();
    const parsed = xmlParser.parse(xml);

    // Handle both RSS 2.0 (rss.channel.item) and Atom (feed.entry)
    const channel = parsed?.rss?.channel || parsed?.feed;
    const rawItems: any[] = channel?.item || channel?.entry || [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    return items.slice(0, 30).map((item: any) => {
      const normalised = normalise({
        headline: item.title || `${source} Update`,
        body: item.description || item.summary || item.content || '',
        publishedAt: item.pubDate || item.updated || item.published,
        url: item.link?.['#text'] || item.link || item.id || url,
      });

      return {
        ...normalised,
        source,
        externalId: item.guid?.['#text'] || item.guid || item.id || undefined,
        rawPayload: item as Record<string, unknown>,
      };
    });
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error(`${source} RSS request timed out`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchRBIFeed(timeoutMs = 10_000): Promise<RawSourceItem[]> {
  return fetchRSSFeed(RBI_RSS_URL, 'RBI', timeoutMs);
}

export async function fetchPIBFeed(timeoutMs = 10_000): Promise<RawSourceItem[]> {
  return fetchRSSFeed(PIB_RSS_URL, 'PIB', timeoutMs);
}
