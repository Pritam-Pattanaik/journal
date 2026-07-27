/**
 * Triage Worker
 *
 * Uses Claude Haiku 4.5 to classify news items as:
 * - relevant/irrelevant
 * - category (earnings | regulatory | macro | global | other)
 * - urgency (breaking | routine)
 *
 * Circuit breaker: on 3 consecutive failures, falls back to keyword heuristic.
 * Groq fallback: if Anthropic is unavailable, falls back to Groq llama-3.3-70b.
 *
 * Cost control: this is the main cost gate — only relevant items proceed to scoring.
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../../lib/logger';
import { prisma } from '../../db';
import { queue, QUEUES, QueueItem } from '../queue/InProcessQueue';
import { FLAGS, AI_MODELS, CIRCUIT_BREAKER, COST } from '../config';
import { TRIAGE_V1 } from '../ai/PromptRegistry';
import { validateTriageOutput } from './ComplianceFilter';
import { tagSectors, isIndiaRelevant } from './EntityTagger';
import { generateGroqJSON } from '../../lib/ai/provider'; // Groq fallback (already installed)

// ─── Anthropic Client ─────────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

// ─── Circuit Breaker State ────────────────────────────────────────────────────

const circuitBreaker = {
  failures: 0,
  openedAt: 0,
  state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF-OPEN',
};

function isCircuitOpen(): boolean {
  if (circuitBreaker.state === 'CLOSED') return false;
  if (circuitBreaker.state === 'OPEN') {
    const elapsed = Date.now() - circuitBreaker.openedAt;
    if (elapsed >= CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS) {
      circuitBreaker.state = 'HALF-OPEN';
      logger.info('[TriageWorker] Circuit breaker moving to HALF-OPEN');
      return false;
    }
    return true;
  }
  return false; // HALF-OPEN: allow one attempt
}

function recordSuccess() {
  if (circuitBreaker.state === 'HALF-OPEN') {
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failures = 0;
    logger.info('[TriageWorker] Circuit breaker CLOSED (recovered)');
  } else {
    circuitBreaker.failures = 0;
  }
}

function recordFailure() {
  circuitBreaker.failures++;
  if (circuitBreaker.state === 'HALF-OPEN' || circuitBreaker.failures >= CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
    circuitBreaker.state = 'OPEN';
    circuitBreaker.openedAt = Date.now();
    logger.error(`[TriageWorker] Circuit OPENED after ${circuitBreaker.failures} failures`);
  }
}

// ─── Keyword Heuristic Fallback ───────────────────────────────────────────────

function keywordTriage(headline: string, source: string, sectors: string[]) {
  const relevant = sectors.length > 0 || isIndiaRelevant(headline, source);
  const urgency = /policy|rate|result|circuit|halt|ban|sebi|rbi action/i.test(headline)
    ? 'breaking'
    : 'routine';
  const category = /result|revenue|profit|loss|ebitda|quarter/i.test(headline)
    ? 'earnings'
    : /rbi|sebi|nse|bse|regulation|circular|policy/i.test(headline)
    ? 'regulatory'
    : /crude|oil|usd|inr|fed|us market|global/i.test(headline)
    ? 'macro'
    : 'other';

  return { relevant, category: category as any, urgency: urgency as any, isFallback: true };
}

// ─── Estimated cost tracking ──────────────────────────────────────────────────

let estimatedDailyCostUsd = 0;
let costResetDate = new Date().toISOString().split('T')[0];

function trackCost(tokensIn: number, tokensOut: number): void {
  const today = new Date().toISOString().split('T')[0];
  if (today !== costResetDate) {
    estimatedDailyCostUsd = 0;
    costResetDate = today;
  }
  const cost =
    (tokensIn / 1_000_000) * COST.HAIKU_COST_PER_M_IN +
    (tokensOut / 1_000_000) * COST.HAIKU_COST_PER_M_OUT;
  estimatedDailyCostUsd += cost;
}

// ─── Main Triage Function ─────────────────────────────────────────────────────

export async function triageItem(item: QueueItem): Promise<void> {
  if (!FLAGS.TRIAGE_ENABLED) return;

  const { rawItemId, headline, body, source, sectors } = item.data as {
    rawItemId: string;
    headline: string;
    body: string;
    source: string;
    sectors: string[];
    publishedAt: string;
  };

  let result: { relevant: boolean; category: any; urgency: any };
  let modelVersion = TRIAGE_V1.version;
  let tokensIn = 0;
  let tokensOut = 0;
  let isFallback = false;

  const startTime = Date.now();

  try {
    if (isCircuitOpen()) {
      // Fallback to keyword heuristic
      result = keywordTriage(headline, source, sectors);
      isFallback = true;
      modelVersion = 'keyword-heuristic-v1';
      logger.debug(`[TriageWorker] Circuit OPEN — using keyword fallback for ${rawItemId}`);
    } else {
      const prompt = TRIAGE_V1.buildPrompt({ headline, source, sectors });

      let rawOutput: unknown;
      const apiKey = process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Groq Default Mode
        try {
          rawOutput = await generateGroqJSON([{ role: 'user', content: prompt }]);
          modelVersion = `${TRIAGE_V1.version}/groq-default`;
          isFallback = false; // Groq is the primary model in this mode
        } catch (groqErr: any) {
          logger.error(`[TriageWorker] Groq default failed. Using keyword heuristic.`);
          recordFailure();
          result = keywordTriage(headline, source, sectors);
          isFallback = true;
          modelVersion = 'keyword-heuristic-v1';
          rawOutput = null;
        }
      } else {
        // Anthropic Mode with Groq Fallback
        try {
          const client = getAnthropicClient();
          const response = await client.messages.create({
            model: AI_MODELS.TRIAGE_MODEL,
            max_tokens: AI_MODELS.TRIAGE_MAX_TOKENS,
            messages: [{ role: 'user', content: prompt }],
          });

          tokensIn = response.usage.input_tokens;
          tokensOut = response.usage.output_tokens;
          trackCost(tokensIn, tokensOut);

          const content = response.content[0];
          if (content.type !== 'text') throw new Error('Unexpected Anthropic response type');
          rawOutput = JSON.parse(content.text);
          recordSuccess();
        } catch (anthropicErr: any) {
          logger.warn(`[TriageWorker] Anthropic failed: ${anthropicErr.message}. Trying Groq fallback.`);
          
          try {
            rawOutput = await generateGroqJSON([{ role: 'user', content: prompt }]);
            modelVersion = `${TRIAGE_V1.version}/groq-fallback`;
            isFallback = true;
          } catch (groqErr: any) {
            logger.error(`[TriageWorker] Both Anthropic and Groq failed. Using keyword heuristic.`);
            recordFailure();
            result = keywordTriage(headline, source, sectors);
            isFallback = true;
            modelVersion = 'keyword-heuristic-v1';
            rawOutput = null;
          }
        }
      }


      if (rawOutput) {
        const validated = validateTriageOutput(rawOutput);
        if (!validated) {
          logger.warn(`[TriageWorker] Invalid triage output for ${rawItemId}. Using keyword fallback.`);
          result = keywordTriage(headline, source, sectors);
          isFallback = true;
        } else {
          result = validated;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Persist triage result
    await prisma.newsTriage.create({
      data: {
        rawItemId,
        relevant: result!.relevant,
        category: result!.category,
        urgency: result!.urgency,
        modelVersion,
        latencyMs,
        tokensIn: tokensIn || null,
        tokensOut: tokensOut || null,
      },
    });

    // Update raw item status
    const newStatus = result!.relevant ? 'TRIAGED' : 'TRIAGED';
    await prisma.newsRawItem.update({
      where: { id: rawItemId },
      data: { status: newStatus },
    });

    logger.info(
      `[TriageWorker] ${rawItemId.slice(0, 8)} — relevant: ${result!.relevant}, ` +
      `category: ${result!.category}, urgency: ${result!.urgency}, ` +
      `latency: ${latencyMs}ms${isFallback ? ' [FALLBACK]' : ''}`
    );

    // If relevant, enqueue for scoring
    if (result!.relevant && FLAGS.SCORING_ENABLED) {
      queue.push(QUEUES.SCORING, rawItemId, {
        rawItemId,
        headline,
        body,
        source,
        sectors,
        category: result!.category,
        urgency: result!.urgency,
      });
    }

  } catch (err: any) {
    logger.error(`[TriageWorker] Fatal error processing ${rawItemId}: ${err.message}`);
    await prisma.newsRawItem.update({
      where: { id: rawItemId },
      data: { status: 'FAILED', failureReason: `Triage failed: ${err.message}` },
    }).catch(() => {});
    throw err; // Re-throw so the queue's retry logic kicks in
  }
}

export function getTriageCircuitState() {
  return { ...circuitBreaker, estimatedDailyCostUsd };
}

// ─── Queue Subscription ───────────────────────────────────────────────────────

export function startTriageWorker(): void {
  queue.subscribe(QUEUES.TRIAGE, triageItem, { maxRetries: 2, retryDelayMs: 3_000 });

  // Dead-letter handler
  queue.on(`dlq:${QUEUES.TRIAGE}`, async (item: QueueItem, err: Error) => {
    logger.error(`[TriageWorker] DLQ item ${item.id}: ${err.message}`);
    await prisma.newsRawItem.update({
      where: { id: item.id },
      data: { status: 'FAILED', failureReason: `DLQ: ${err.message}` },
    }).catch(() => {});
  });

  logger.info('[TriageWorker] Started — subscribed to triage queue');
}
