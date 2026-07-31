/**
 * YahooNewsService — Real-Time Market News from Yahoo Finance
 *
 * Fetches market news from Yahoo Finance RSS feeds.
 * Normalizes to the internal NewsArticle model.
 * Caches aggressively to reduce external requests.
 *
 * Sources:
 * - Yahoo Finance India RSS (^NSEI, ^BSESN related news)
 * - Yahoo Finance Markets RSS (global market news)
 */

import { XMLParser } from 'fast-xml-parser';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { NewsArticle } from './types';
import { createHash } from 'crypto';

const NEWS_CACHE_KEY = 'market:news:yahoo:v2';
const NEWS_CACHE_TTL_SEC = 300; // 5 minutes
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ARTICLES = 25;

// Yahoo Finance RSS endpoints for market news
const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5ENSEI,%5ENSEFMCG,%5ENSEIT&region=IN&lang=en-US',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EBSESN,%5ENIFTYMIDCAP,%5EINDIAVIX&region=IN&lang=en-US',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=USDINR%3DX,GC%3DF,CL%3DF&region=US&lang=en-US',
];

// Secondary: Yahoo Finance search API (broader market coverage)
const SEARCH_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=RELIANCE.NS,INFY.NS,TCS.NS&region=IN&lang=en-US',
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
});

function generateId(url: string): string {
  return createHash('md5').update(url).digest('hex').slice(0, 16);
}

function parseRssDate(dateStr: string): number {
  try {
    const parsed = new Date(dateStr).getTime();
    if (!isNaN(parsed)) return Math.floor(parsed / 1000);
  } catch {}
  return Math.floor(Date.now() / 1000);
}

function stripCData(text: string): string {
  if (!text) return '';
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();
}

function extractImageUrl(description: string): string | undefined {
  try {
    const match = description.match(/src="([^"]+\.(jpg|jpeg|png|webp|gif)[^"]*)"/i);
    return match ? match[1] : undefined;
  } catch {
    return undefined;
  }
}

function categorize(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (/rbi|fed|rate|inflation|cpi|gdp|budget|fiscal/.test(text)) return 'economy';
  if (/earnings|result|quarter|profit|revenue|eps/.test(text)) return 'earnings';
  if (/nifty|sensex|index|market|rally|fall|crash/.test(text)) return 'markets';
  return 'general';
}

async function fetchRssText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Referer': 'https://finance.yahoo.com/',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      logger.warn(`[YahooNews] RSS fetch failed: ${url} → HTTP ${res.status}`);
      return null;
    }

    return await res.text();
  } catch (err: any) {
    clearTimeout(timer);
    logger.warn(`[YahooNews] RSS fetch error: ${url} → ${err.message}`);
    return null;
  }
}

function parseRssItems(xmlText: string): NewsArticle[] {
  try {
    const parsed = parser.parse(xmlText);
    const items: any[] = parsed?.rss?.channel?.item ?? [];
    const itemArray = Array.isArray(items) ? items : [items];

    return itemArray.map((item: any): NewsArticle => {
      const title = stripCData(item.title ?? '');
      const link = stripCData(item.link ?? item.guid ?? '');
      const description = stripCData(item.description ?? '');
      const pubDate = item.pubDate ?? '';
      const source = item.source?.['#text'] ?? new URL(link || 'https://finance.yahoo.com').hostname;

      return {
        id: generateId(link || title),
        headline: title,
        summary: description.replace(/<[^>]+>/g, '').slice(0, 300),
        url: link,
        source,
        publishedAt: parseRssDate(pubDate),
        imageUrl: extractImageUrl(description),
        category: categorize(title, description),
      };
    }).filter(a => a.headline && a.url);
  } catch (err: any) {
    logger.warn(`[YahooNews] RSS parse error: ${err.message}`);
    return [];
  }
}

export class YahooNewsService {
  async getMarketNews(limit: number = MAX_ARTICLES): Promise<NewsArticle[]> {
    // Check cache
    try {
      const cached = await redis.get(NEWS_CACHE_KEY);
      if (cached) {
        const articles: NewsArticle[] = JSON.parse(cached);
        if (articles.length > 0) {
          return articles.slice(0, limit);
        }
      }
    } catch {}

    // Fetch all RSS feeds in parallel
    const allFeeds = [...RSS_FEEDS, ...SEARCH_FEEDS];
    const results = await Promise.allSettled(allFeeds.map(fetchRssText));

    const articles: NewsArticle[] = [];
    const seenIds = new Set<string>();

    for (const result of results) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const items = parseRssItems(result.value);

      for (const item of items) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          articles.push(item);
        }
      }
    }

    // Sort by most recent first
    articles.sort((a, b) => b.publishedAt - a.publishedAt);

    logger.info(`[YahooNews] Fetched ${articles.length} articles from ${allFeeds.length} feeds`);

    // Cache the results
    if (articles.length > 0) {
      try {
        await redis.setex(NEWS_CACHE_KEY, NEWS_CACHE_TTL_SEC, JSON.stringify(articles));
      } catch {}
    }

    return articles.slice(0, limit);
  }

  async getSymbolNews(symbols: string[], limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `market:news:symbol:${symbols.sort().join(',')}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {}

    const symbolParam = symbols.map(s => encodeURIComponent(s)).join(',');
    const url = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbolParam}&region=IN&lang=en-US`;

    const xmlText = await fetchRssText(url);
    if (!xmlText) return [];

    const articles = parseRssItems(xmlText)
      .sort((a, b) => b.publishedAt - a.publishedAt)
      .slice(0, limit);

    if (articles.length > 0) {
      try {
        await redis.setex(cacheKey, 180, JSON.stringify(articles));
      } catch {}
    }

    return articles;
  }
}

// Singleton
export const yahooNewsService = new YahooNewsService();
