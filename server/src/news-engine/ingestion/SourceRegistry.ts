/**
 * Source Registry
 *
 * Manages all polling sources as scheduled jobs.
 * Handles start/stop, market-hours gating, error isolation per source,
 * and feeds normalised items into the pipeline queue.
 *
 * Each source runs independently — one source failing does not affect others.
 */

import * as cron from 'node-cron';
import { logger } from '../../lib/logger';
import { FLAGS, SOURCE_CONFIG, MARKET_HOURS } from '../config';
import { RateLimiter } from './RateLimiter';
import { normalise } from '../processing/Normalizer';
import { buildDedupeHash, isDuplicate } from '../processing/Deduper';
import { tagSectors, isIndiaRelevant } from '../processing/EntityTagger';
import { prisma } from '../../db';
import { queue, QUEUES } from '../queue/InProcessQueue';

import { fetchMarketAux } from './sources/marketaux';
import { yahooNewsService } from '../../market/YahooNewsService';

const rateLimiter = new RateLimiter(SOURCE_CONFIG);

// Track scheduled tasks for graceful shutdown
const scheduledTasks: cron.ScheduledTask[] = [];

// ─── Market Hours Check ───────────────────────────────────────────────────────

function isMarketHours(): boolean {
  // Use Intl.DateTimeFormat to correctly handle IST (UTC+5:30) without DST issues
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find(p => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);

  // Skip weekends (Sat, Sun)
  if (weekday === 'Sat' || weekday === 'Sun') return false;

  const timeInMinutes = hour * 60 + minute;
  const openMinutes = MARKET_HOURS.OPEN_HOUR * 60 + MARKET_HOURS.OPEN_MINUTE;
  const closeMinutes = MARKET_HOURS.CLOSE_HOUR * 60 + MARKET_HOURS.CLOSE_MINUTE;

  return timeInMinutes >= openMinutes && timeInMinutes <= closeMinutes;
}

// ─── Core Ingestion Logic ─────────────────────────────────────────────────────

async function ingestFromSource(
  sourceName: string,
  fetcher: () => Promise<Array<{ headline: string; body?: string; publishedAt: Date; url?: string; externalId?: string; rawPayload: Record<string, unknown> }>>
): Promise<void> {
  if (!rateLimiter.canPoll(sourceName)) return;

  try {
    const rawItems = await fetcher();
    rateLimiter.recordSuccess(sourceName);

    let ingested = 0;
    let duplicates = 0;
    let skipped = 0;

    for (const item of rawItems) {
      // Pre-triage: skip items with no India relevance (free early gate)
      if (!isIndiaRelevant(item.headline, sourceName)) {
        skipped++;
        continue;
      }

      const dedupeHash = buildDedupeHash(item.headline, sourceName, item.publishedAt);

      if (await isDuplicate(dedupeHash)) {
        duplicates++;
        continue;
      }

      const sectors = tagSectors(item.headline, item.body);

      try {
        const rawItem = await prisma.newsRawItem.create({
          data: {
            source: sourceName,
            externalId: item.externalId || null,
            dedupeHash,
            headline: item.headline.slice(0, 500),
            body: item.body?.slice(0, 5000) || null,
            url: item.url || null,
            publishedAt: item.publishedAt,
            rawPayload: { ...item.rawPayload, sectors },
            status: 'PENDING',
          },
        });

        // Enqueue for triage
        queue.push(QUEUES.TRIAGE, rawItem.id, {
          rawItemId: rawItem.id,
          headline: rawItem.headline,
          body: rawItem.body || '',
          source: sourceName,
          sectors,
          publishedAt: rawItem.publishedAt.toISOString(),
        });

        ingested++;
      } catch (dbErr: any) {
        // Unique constraint violation means race condition — item was just inserted by concurrent poll
        if (dbErr.code === 'P2002') {
          duplicates++;
        } else {
          logger.error(`[SourceRegistry:${sourceName}] DB write failed: ${dbErr.message}`);
        }
      }
    }

    if (ingested > 0 || duplicates > 0) {
      logger.info(
        `[SourceRegistry:${sourceName}] Ingested: ${ingested}, Duplicates: ${duplicates}, Skipped: ${skipped}`
      );
    }

    // Write pipeline metric
    await prisma.pipelineMetric.create({
      data: {
        metricName: 'items_ingested',
        value: ingested,
        source: sourceName,
      },
    }).catch(() => {}); // non-critical

  } catch (err: any) {
    rateLimiter.recordFailure(sourceName, err);
    logger.error(`[SourceRegistry:${sourceName}] Poll failed: ${err.message}`);
  }
}

// ─── Individual Source Poll Functions ────────────────────────────────────────

async function pollMarketAux() {
  if (!FLAGS.MARKETAUX_POLLER_ENABLED) return;
  await ingestFromSource('MARKETAUX', fetchMarketAux);
}

async function pollYahooNews() {
  await ingestFromSource('YAHOO_FINANCE', async () => {
    const articles = await yahooNewsService.getMarketNews(50);
    return articles.map(a => ({
      headline: a.headline,
      body: a.summary,
      publishedAt: new Date(a.publishedAt * 1000), // convert epoch seconds to Date
      url: a.url,
      externalId: a.id,
      rawPayload: { ...a }
    }));
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startSourceRegistry(): void {
  if (!FLAGS.NEWS_ENGINE_ENABLED) {
    logger.warn('[SourceRegistry] NEWS_ENGINE_ENABLED=false — pipeline disabled.');
    return;
  }

  logger.info('[SourceRegistry] Starting all pollers...');

  // MarketAux: every 15 minutes
  scheduledTasks.push(cron.schedule('*/15 * * * *', pollMarketAux));
  
  // Yahoo: every 10 minutes
  scheduledTasks.push(cron.schedule('*/10 * * * *', pollYahooNews));

  // Run immediately on startup to populate initial data
  Promise.allSettled([pollMarketAux(), pollYahooNews()])
    .then(() => logger.info('[SourceRegistry] Initial poll completed.'));

  logger.info('[SourceRegistry] All pollers scheduled.');
}

export function stopSourceRegistry(): void {
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks.length = 0;
  logger.info('[SourceRegistry] All pollers stopped.');
}

export function getSourceStats() {
  return rateLimiter.getStats();
}
