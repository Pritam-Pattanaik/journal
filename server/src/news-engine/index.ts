/**
 * TradeVault AI News Engine — Pipeline Boot
 *
 * This is the main entry point for the news engine.
 * Called once from server/src/index.ts on startup.
 *
 * Starts in order:
 * 1. Triage worker (queue subscription)
 * 2. Scoring worker (queue subscription)
 * 3. Delivery worker (queue subscription)
 * 4. Digest builder (cron jobs)
 * 5. Source registry (polling cron jobs)
 *
 * Workers must be started before sources so that items ingested immediately
 * on startup are processed.
 *
 * Graceful shutdown is registered on process.exit and SIGTERM.
 */

import { logger } from '../lib/logger';
import { FLAGS } from './config';
import { startTriageWorker } from './processing/TriageWorker';
import { startScoringWorker } from './processing/ScoringWorker';
import { startDeliveryWorker } from './delivery/BreakingAlert';
import { startDigestBuilder, stopDigestBuilder } from './delivery/DigestBuilder';
import { startSourceRegistry, stopSourceRegistry } from './ingestion/SourceRegistry';

let pipelineRunning = false;

export function startNewsEngine(): void {
  if (!FLAGS.NEWS_ENGINE_ENABLED) {
    logger.warn('[NewsEngine] NEWS_ENGINE_ENABLED=false — engine disabled via feature flag.');
    return;
  }

  if (pipelineRunning) {
    logger.warn('[NewsEngine] Engine already running — ignoring duplicate start call.');
    return;
  }

  logger.info('[NewsEngine] ═══════════════════════════════════════════════════');
  logger.info('[NewsEngine] Starting TradeVault AI News Engine v1.0');
  logger.info('[NewsEngine] Mode: EDUCATIONAL_MODE');
  logger.info('[NewsEngine] ═══════════════════════════════════════════════════');

  try {
    // 1. Start workers (must be before sources so items have handlers)
    startTriageWorker();
    startScoringWorker();
    startDeliveryWorker();

    // 2. Start delivery schedulers
    startDigestBuilder();

    // 3. Start data source pollers (this triggers first poll immediately)
    startSourceRegistry();

    pipelineRunning = true;
    logger.info('[NewsEngine] All systems operational.');

  } catch (err: any) {
    logger.error(`[NewsEngine] Failed to start: ${err.message}`);
    // Don't throw — the main Express server must still boot even if the engine fails
  }
}

export function stopNewsEngine(): void {
  if (!pipelineRunning) return;

  logger.info('[NewsEngine] Shutting down gracefully...');
  stopSourceRegistry();
  stopDigestBuilder();
  pipelineRunning = false;
  logger.info('[NewsEngine] Shutdown complete.');
}

export function isEngineRunning(): boolean {
  return pipelineRunning;
}
