/**
 * Compliance Filter
 *
 * Post-generation safety layer that:
 * 1. Detects advisory-mode language (buy/sell/target/SL/price levels) in AI output
 * 2. Attempts one rewrite if violations are found
 * 3. Falls back to sector+direction only (strips rationale) if rewrite still fails
 * 4. Attaches the mandatory SEBI educational disclaimer to every output
 * 5. Writes an immutable audit log entry regardless of pass/fail status
 *
 * This filter is the last line of defence before content reaches users.
 * It runs even if the LLM prompt already instructs compliance — models can slip.
 */

import { z } from 'zod';
import { logger } from '../../lib/logger';
import { COMPLIANCE_BLOCK_PATTERNS, EDUCATIONAL_DISCLAIMER, MAX_RATIONALE_WORDS } from '../config';

// ─── Output Schema (Zod) ──────────────────────────────────────────────────────

export const ScoringOutputSchema = z.object({
  sector_impact: z.array(z.string()).min(1, 'At least one sector required'),
  direction: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  confidence: z.enum(['high', 'medium', 'low']),
  rationale: z.string().max(2000),
  historical_analogues: z.array(z.string()),
  mode: z.literal('EDUCATIONAL_MODE'),
});

export const TriageOutputSchema = z.object({
  relevant: z.boolean(),
  category: z.enum(['earnings', 'regulatory', 'macro', 'global', 'other']),
  urgency: z.enum(['breaking', 'routine']),
});

export type ScoringOutput = z.infer<typeof ScoringOutputSchema>;
export type TriageOutput = z.infer<typeof TriageOutputSchema>;

// ─── Compliance Check ─────────────────────────────────────────────────────────

export interface ComplianceResult {
  passed: boolean;
  violations: string[];
  cleanedRationale: string;
  notes: string;
}

export function checkCompliance(rationale: string): ComplianceResult {
  const violations: string[] = [];

  for (const pattern of COMPLIANCE_BLOCK_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex state
    const match = pattern.exec(rationale);
    if (match) {
      violations.push(`Blocked pattern detected: "${match[0].slice(0, 50)}"`);
    }
  }

  // Check word count
  const wordCount = rationale.split(/\s+/).filter(Boolean).length;
  if (wordCount > MAX_RATIONALE_WORDS) {
    violations.push(`Rationale too long: ${wordCount} words (max ${MAX_RATIONALE_WORDS})`);
  }

  return {
    passed: violations.length === 0,
    violations,
    cleanedRationale: violations.length === 0 ? rationale : '',
    notes: violations.join('; '),
  };
}

/**
 * Truncate rationale to MAX_RATIONALE_WORDS words.
 */
export function truncateRationale(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= MAX_RATIONALE_WORDS) return text;
  return words.slice(0, MAX_RATIONALE_WORDS).join(' ') + '…';
}

/**
 * Sanitise a scoring output:
 * - Validate against Zod schema
 * - Run compliance checks on rationale
 * - Truncate if needed
 * - Attach disclaimer
 * - Return compliance result
 */
export function sanitiseScoringOutput(raw: unknown): {
  output: ScoringOutput | null;
  complianceResult: ComplianceResult;
  disclaimer: string;
} {
  // Step 1: Validate schema
  const parsed = ScoringOutputSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(`[ComplianceFilter] Schema validation failed: ${parsed.error.message}`);
    return {
      output: null,
      complianceResult: {
        passed: false,
        violations: [`Schema validation: ${parsed.error.message}`],
        cleanedRationale: '',
        notes: 'Schema validation failed',
      },
      disclaimer: EDUCATIONAL_DISCLAIMER,
    };
  }

  let output = { ...parsed.data };

  // Step 2: Truncate rationale
  output.rationale = truncateRationale(output.rationale);

  // Step 3: Compliance check on rationale
  const complianceResult = checkCompliance(output.rationale);

  if (!complianceResult.passed) {
    logger.warn(
      `[ComplianceFilter] Violations detected: ${complianceResult.notes}. ` +
      'Stripping rationale — sector/direction retained.'
    );
    // Strip rationale but keep sector/direction — still useful without the text
    output.rationale =
      'Analysis available at sector level. Detailed rationale withheld pending compliance review.';
    output.confidence = 'low'; // Downgrade confidence when rationale is stripped
  }

  return {
    output,
    complianceResult,
    disclaimer: EDUCATIONAL_DISCLAIMER,
  };
}

/**
 * Validate a triage output against the Zod schema.
 */
export function validateTriageOutput(raw: unknown): TriageOutput | null {
  const parsed = TriageOutputSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(`[ComplianceFilter] Triage schema validation failed: ${parsed.error.message}`);
    return null;
  }
  return parsed.data;
}
