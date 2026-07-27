/**
 * Prompt Registry
 *
 * Centralised version-controlled storage for all AI prompts used in the pipeline.
 * Every prompt change increments the version string.
 * Version strings are persisted in NewsTriage and NewsImpact records,
 * enabling quality comparison between prompt versions.
 *
 * COMPLIANCE: All prompts are in EDUCATIONAL_MODE by default.
 * ADVISORY_MODE prompts must never be built until SEBI RA registration is complete.
 */

import { EDUCATIONAL_DISCLAIMER } from '../config';

export interface PromptDefinition {
  version: string;
  model: string;
  buildPrompt: (input: Record<string, unknown>) => string;
}

// ─── Triage Prompt ────────────────────────────────────────────────────────────

export const TRIAGE_V1: PromptDefinition = {
  version: 'triage-v1.0',
  model: 'claude-haiku-4-5',
  buildPrompt: ({ headline, source, sectors }) => `You are an Indian financial market news classifier.

Your task is to classify this news item into three properties:
1. relevant: Is this news potentially impactful to Indian stock market sectors? (true/false)
2. category: The primary category of this news.
3. urgency: How quickly should traders be made aware?

CLASSIFICATION RULES:
- Mark relevant=true for: RBI decisions, SEBI actions, quarterly results, government policy, major corporate events, significant FII/DII flows, commodity shocks, currency moves
- Mark relevant=false for: celebrity news, sports, crime (not corporate), general technology (non-Indian), political news without market impact
- Category options: earnings | regulatory | macro | global | other
- Urgency options: breaking | routine
  - breaking: RBI rate change, unexpected result, circuit breaker, major FII selloff, emergency announcement
  - routine: scheduled results, routine filings, minor policy updates

NEWS ITEM:
Headline: "${headline}"
Source: ${source}
Pre-identified sectors: ${Array.isArray(sectors) && sectors.length > 0 ? sectors.join(', ') : 'none identified'}

Return ONLY valid JSON with no additional text:
{"relevant": true/false, "category": "one_of_the_categories", "urgency": "breaking_or_routine"}`,
};

// ─── Scoring Prompt ───────────────────────────────────────────────────────────

export const SCORING_V1: PromptDefinition = {
  version: 'scoring-v1.0',
  model: 'claude-sonnet-4-5',
  buildPrompt: ({ headline, body, source, sectors, category, urgency }) => `You are an educational Indian market intelligence analyst operating in EDUCATIONAL_MODE.

Your task is to analyze this news item and produce a sector-level educational impact assessment.

ABSOLUTE RULES — NEVER VIOLATE:
1. Do NOT mention specific buy/sell/hold recommendations for any stock
2. Do NOT mention price targets, entry levels, or stop-loss levels
3. Do NOT predict specific percentage returns or movements
4. Do NOT name the same 2-3 companies repeatedly in every analysis (coded reference risk)
5. Rationale must be ≤200 words, sector-level commentary only
6. Mode must always be "EDUCATIONAL_MODE"
7. Confidence must be "low" for any new or unprecedented event type

NEWS ITEM:
Headline: "${headline}"
Body: "${typeof body === 'string' ? body.slice(0, 800) : ''}"
Source: ${source}
Category: ${category}
Urgency: ${urgency}
Pre-identified sectors: ${Array.isArray(sectors) ? sectors.join(', ') : 'none'}

HISTORICAL CONTEXT: This pipeline is in early operation. The historical analogue store is thin.
Unless this is a clearly well-precedented event (e.g., an RBI rate decision), use confidence="low".

Return ONLY valid JSON matching this exact schema:
{
  "sector_impact": ["Nifty Bank"],
  "direction": "positive|negative|neutral|mixed",
  "confidence": "low|medium|high",
  "rationale": "≤200 words of sector-level educational commentary. No stock picks, no price targets.",
  "historical_analogues": ["Brief description of similar past event 1", "Brief description of similar past event 2"],
  "mode": "EDUCATIONAL_MODE"
}`,
};

// ─── Registry Export ──────────────────────────────────────────────────────────

export const PROMPT_REGISTRY = {
  TRIAGE_V1,
  SCORING_V1,
} as const;

export { EDUCATIONAL_DISCLAIMER };
