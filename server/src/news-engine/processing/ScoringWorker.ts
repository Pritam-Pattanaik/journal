/**
 * Scoring Worker
 *
 * Uses Claude Sonnet to produce sector-level impact analysis for triaged items.
 * All output passes through the ComplianceFilter before being written to DB.
 * An immutable NewsAuditLog is written for EVERY item — pass or fail.
 *
 * During early operation (first 30 days), all confidence values are capped at "low"
 * to reflect the thin historical analogue store and prevent overconfidence.
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../lib/logger';
import { prisma } from '../../db';
import { queue, QUEUES, QueueItem } from '../queue/InProcessQueue';
import { FLAGS, AI_MODELS, CIRCUIT_BREAKER, COST, EDUCATIONAL_DISCLAIMER } from '../config';
import { SCORING_V1 } from '../ai/PromptRegistry';
import { sanitiseScoringOutput, ScoringOutput } from './ComplianceFilter';
import { generateGroqJSON } from '../../lib/ai/provider';
import { createNotification } from '../../services/notificationService';

// ─── Anthropic Client (shared with TriageWorker via module singleton) ─────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

// ─── Circuit Breaker ──────────────────────────────────────────────────────────

const cb = {
  failures: 0,
  openedAt: 0,
  state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF-OPEN',
};

function isCbOpen(): boolean {
  if (cb.state === 'CLOSED') return false;
  if (cb.state === 'OPEN') {
    if (Date.now() - cb.openedAt >= CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS) {
      cb.state = 'HALF-OPEN';
      return false;
    }
    return true;
  }
  return false;
}

function cbSuccess() { cb.failures = 0; if (cb.state !== 'CLOSED') { cb.state = 'CLOSED'; logger.info('[ScoringWorker] Circuit CLOSED'); } }
function cbFail() { cb.failures++; if (cb.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD || cb.state === 'HALF-OPEN') { cb.state = 'OPEN'; cb.openedAt = Date.now(); logger.error(`[ScoringWorker] Circuit OPENED`); } }

// ─── Cost Tracking ────────────────────────────────────────────────────────────

let dailyCostUsd = 0;
let costDate = new Date().toISOString().split('T')[0];

function trackCost(tokensIn: number, tokensOut: number): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (today !== costDate) { dailyCostUsd = 0; costDate = today; }
  dailyCostUsd +=
    (tokensIn / 1_000_000) * COST.SONNET_COST_PER_M_IN +
    (tokensOut / 1_000_000) * COST.SONNET_COST_PER_M_OUT;

  if (dailyCostUsd > COST.MAX_DAILY_SCORING_USD) {
    logger.warn(`[ScoringWorker] Daily cost cap $${COST.MAX_DAILY_SCORING_USD} reached. Pausing scoring.`);
    return false; // Signal to stop processing
  }
  return true;
}

// ─── Cold-start Confidence Cap ────────────────────────────────────────────────

const PIPELINE_START_DATE = new Date();
const COLD_START_DAYS = 30;

function capConfidenceForColdStart(confidence: string): string {
  const daysSinceStart = (Date.now() - PIPELINE_START_DATE.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceStart < COLD_START_DAYS) return 'low';
  return confidence;
}

// ─── Core Scoring Function ───────────────────────────────────────────────────

export async function scoreItem(item: QueueItem): Promise<void> {
  if (!FLAGS.SCORING_ENABLED) return;

  const { rawItemId, headline, body, source, sectors, category, urgency } = item.data as {
    rawItemId: string; headline: string; body: string; source: string;
    sectors: string[]; category: string; urgency: string;
  };

  const startTime = Date.now();
  let rawModelOutput: unknown = null;
  let tokensIn = 0;
  let tokensOut = 0;
  let modelId: string = AI_MODELS.SCORING_MODEL;

  let isFallback = false;

  try {
    if (isCbOpen()) {
      logger.warn(`[ScoringWorker] Circuit OPEN — skipping scoring for ${rawItemId}`);
      await prisma.newsRawItem.update({
        where: { id: rawItemId },
        data: { status: 'FAILED', failureReason: 'Scoring circuit breaker OPEN' },
      });
      return;
    }

    const prompt = SCORING_V1.buildPrompt({ headline, body, source, sectors, category, urgency });

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Groq Default Mode
      try {
        rawModelOutput = await generateGroqJSON([{ role: 'user', content: prompt }]);
        modelId = `${AI_MODELS.FALLBACK_MODEL}/groq-default`;
        isFallback = false; // Groq is the primary model in this mode
      } catch (groqErr: any) {
        logger.error(`[ScoringWorker] Groq default failed for ${rawItemId}. Marking as FAILED.`);
        cbFail();
        await writeAuditLog(rawItemId, prompt, null, modelId, SCORING_V1.version, false, 'Groq provider failed');
        await prisma.newsRawItem.update({
          where: { id: rawItemId },
          data: { status: 'FAILED', failureReason: 'Groq provider failed' },
        });
        throw groqErr;
      }
    } else {
      // Anthropic Mode with Groq Fallback
      try {
        const client = getAnthropicClient();
        const response = await client.messages.create({
          model: AI_MODELS.SCORING_MODEL,
          max_tokens: AI_MODELS.SCORING_MAX_TOKENS,
          messages: [{ role: 'user', content: prompt }],
        });

        tokensIn = response.usage.input_tokens;
        tokensOut = response.usage.output_tokens;
        const withinBudget = trackCost(tokensIn, tokensOut);
        if (!withinBudget) return; // Cost cap hit — don't process

        const content = response.content[0];
        if (content.type !== 'text') throw new Error('Unexpected response type');
        rawModelOutput = JSON.parse(content.text);
        cbSuccess();

      } catch (anthropicErr: any) {
        logger.warn(`[ScoringWorker] Anthropic failed: ${anthropicErr.message}. Trying Groq.`);
        // Do NOT fail circuit breaker yet if Groq might succeed

        try {
          rawModelOutput = await generateGroqJSON([{ role: 'user', content: prompt }]);
          modelId = `${AI_MODELS.FALLBACK_MODEL}/groq-fallback`;
          isFallback = true;
          // Groq succeeded, don't penalise circuit breaker
        } catch (groqErr: any) {
          logger.error(`[ScoringWorker] Both models failed for ${rawItemId}. Marking as FAILED.`);
          cbFail(); // Now we fail circuit breaker
          // Write audit log even for hard failures
          await writeAuditLog(rawItemId, prompt, null, modelId, SCORING_V1.version, false, 'Both AI providers failed');
          await prisma.newsRawItem.update({
            where: { id: rawItemId },
            data: { status: 'FAILED', failureReason: 'All AI providers failed' },
          });
          throw groqErr;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Sanitise through compliance filter
    const { output, complianceResult, disclaimer } = sanitiseScoringOutput(rawModelOutput);

    // Write immutable audit log (always, regardless of compliance pass/fail)
    const auditLog = await writeAuditLog(
      rawItemId, prompt, rawModelOutput, modelId, SCORING_V1.version,
      complianceResult.passed, complianceResult.notes
    );

    if (!output) {
      logger.error(`[ScoringWorker] Compliance or schema failure for ${rawItemId}. Marked FAILED.`);
      await prisma.newsRawItem.update({
        where: { id: rawItemId },
        data: { status: 'FAILED', failureReason: `Compliance failure: ${complianceResult.notes}` },
      });
      return;
    }

    // Cap confidence during cold-start period
    const finalConfidence = capConfidenceForColdStart(output.confidence);

    // Write impact to DB
    const impact = await prisma.newsImpact.create({
      data: {
        rawItemId,
        sectorImpact: output.sector_impact,
        direction: output.direction,
        confidence: finalConfidence,
        rationale: output.rationale,
        historicalAnalogues: output.historical_analogues,
        mode: 'EDUCATIONAL_MODE',
        disclaimer,
        modelVersion: `${SCORING_V1.version}/${modelId}`,
        latencyMs,
        tokensIn: tokensIn || null,
        tokensOut: tokensOut || null,
        humanReviewRequired: FLAGS.HUMAN_REVIEW_REQUIRED,
        complianceAuditId: auditLog.id,
      },
    });

    // Update raw item status
    await prisma.newsRawItem.update({
      where: { id: rawItemId },
      data: { status: 'SCORED' },
    });

    logger.info(
      `[ScoringWorker] ${rawItemId.slice(0, 8)} scored — sectors: [${output.sector_impact.join(',')}], ` +
      `direction: ${output.direction}, confidence: ${finalConfidence}, ` +
      `latency: ${latencyMs}ms${isFallback ? ' [FALLBACK]' : ''}`
    );

    // Queue for delivery
    if (FLAGS.DELIVERY_ENABLED) {
      queue.push(QUEUES.DELIVERY, impact.id, {
        impactId: impact.id,
        rawItemId,
        headline,
        sectorImpact: output.sector_impact,
        direction: output.direction,
        confidence: finalConfidence,
        urgency,
        rationale: output.rationale,
        disclaimer,
      });
    }

  } catch (err: any) {
    logger.error(`[ScoringWorker] Fatal error for ${rawItemId}: ${err.message}`);
    throw err;
  }
}

async function writeAuditLog(
  rawItemId: string,
  prompt: string,
  output: unknown,
  modelId: string,
  promptVersion: string,
  compliancePassed: boolean,
  complianceNotes: string
) {
  return prisma.newsAuditLog.create({
    data: {
      rawItemId,
      inputSnapshot: { prompt },
      outputSnapshot: output ? { output } : { error: 'no output' },
      modelId,
      promptVersion,
      mode: 'EDUCATIONAL_MODE',
      compliancePassed,
      complianceNotes: complianceNotes || null,
      disclaimer: EDUCATIONAL_DISCLAIMER,
    },
  });
}

// ─── Queue Subscription ───────────────────────────────────────────────────────

export function startScoringWorker(): void {
  queue.subscribe(QUEUES.SCORING, scoreItem, { maxRetries: 2, retryDelayMs: 5_000 });

  queue.on(`dlq:${QUEUES.SCORING}`, async (item: QueueItem, err: Error) => {
    logger.error(`[ScoringWorker] DLQ item ${item.id}: ${err.message}`);
    await prisma.newsRawItem.update({
      where: { id: item.id },
      data: { status: 'FAILED', failureReason: `Scoring DLQ: ${err.message}` },
    }).catch(() => {});
  });

  logger.info('[ScoringWorker] Started — subscribed to scoring queue');
}

export function getScoringStats() {
  return { circuitState: cb.state, dailyCostUsd };
}
