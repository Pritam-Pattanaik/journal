// server/src/lib/ai/disciplineSchema.ts
// ─── Single Source of Truth: Discipline Scoring System ──────────────────────

export interface DisciplineBreakdown {
  entryPlan: boolean;
  riskManagement: boolean;
  exitExecution: boolean;
  emotionControl: boolean;
  ruleCompliance: boolean;
}

export interface DisciplineEvaluation {
  score: number;        // 1-5
  maxScore: 5;
  label: string;
  color: string;
  confidence: number;   // 0-1
  reasons: string[];
  mistakes: string[];
  strengths: string[];
  breakdown: DisciplineBreakdown;
}

export interface DisciplineLevel {
  score: number;
  label: string;
  color: string;
  criteria: string;
}

// ─── The Canonical Scale ────────────────────────────────────────────────────
export const DISCIPLINE_SCALE: DisciplineLevel[] = [
  { score: 5, label: 'Elite',     color: '#00c48c', criteria: 'Perfect execution. No emotional mistakes. Risk respected. Plan followed.' },
  { score: 4, label: 'Excellent', color: '#10d990', criteria: 'Minor execution mistakes only.' },
  { score: 3, label: 'Good',      color: '#6366f1', criteria: 'Acceptable execution. Some emotional leakage.' },
  { score: 2, label: 'Poor',      color: '#f59e0b', criteria: 'Repeated mistakes. Weak discipline.' },
  { score: 1, label: 'Critical',  color: '#ff4b6e', criteria: 'Major behavioral failures. Immediate review required.' },
];

// ─── Lookup Helpers ─────────────────────────────────────────────────────────
export function getDisciplineLevel(score: number): DisciplineLevel {
  const clamped = Math.max(1, Math.min(5, Math.round(score)));
  return DISCIPLINE_SCALE.find(l => l.score === clamped) || DISCIPLINE_SCALE[4]; // fallback to Critical
}

export function getDisciplineLabel(score: number): string {
  return getDisciplineLevel(score).label;
}

export function getDisciplineColor(score: number): string {
  return getDisciplineLevel(score).color;
}

// ─── Validation ─────────────────────────────────────────────────────────────
export function validateDisciplineEvaluation(data: any): DisciplineEvaluation | null {
  if (!data || typeof data !== 'object') return null;

  const score = typeof data.score === 'number' ? Math.max(1, Math.min(5, Math.round(data.score))) : null;
  if (score === null) return null;

  const level = getDisciplineLevel(score);

  return {
    score,
    maxScore: 5,
    label: level.label,
    color: level.color,
    confidence: typeof data.confidence === 'number' ? Math.max(0, Math.min(1, data.confidence)) : 0.8,
    reasons: Array.isArray(data.reasons) ? data.reasons.filter((r: any) => typeof r === 'string') : [],
    mistakes: Array.isArray(data.mistakes) ? data.mistakes.filter((r: any) => typeof r === 'string') : [],
    strengths: Array.isArray(data.strengths) ? data.strengths.filter((r: any) => typeof r === 'string') : [],
    breakdown: {
      entryPlan: data.breakdown?.entryPlan ?? true,
      riskManagement: data.breakdown?.riskManagement ?? true,
      exitExecution: data.breakdown?.exitExecution ?? true,
      emotionControl: data.breakdown?.emotionControl ?? true,
      ruleCompliance: data.breakdown?.ruleCompliance ?? true,
    },
  };
}

// ─── Prompt Fragment (injected into the AI system prompt) ───────────────────
export const DISCIPLINE_PROMPT_SCHEMA = `
DISCIPLINE SCORING SYSTEM:
When evaluating trades or trade sessions, you MUST include a structured discipline evaluation.

SCALE:
5/5 Elite (Dark Green) — Perfect execution, no emotional mistakes, risk respected, plan followed.
4/5 Excellent (Green) — Minor execution mistakes only.
3/5 Good (Blue) — Acceptable execution, some emotional leakage.
2/5 Poor (Orange) — Repeated mistakes, weak discipline.
1/5 Critical (Red) — Major behavioral failures, immediate review required.

When you evaluate discipline, output this JSON block wrapped in HTML comments:
<!--DISCIPLINE_JSON-->
{
  "score": 4,
  "confidence": 0.92,
  "reasons": ["Entry followed plan", "Risk respected", "Exit slightly early"],
  "mistakes": ["Exited before target"],
  "strengths": ["No revenge trading", "Position sizing respected"],
  "breakdown": {
    "entryPlan": true,
    "riskManagement": true,
    "exitExecution": false,
    "emotionControl": true,
    "ruleCompliance": true
  }
}
<!--/DISCIPLINE_JSON-->

RULES:
- Always base the score on the PRE-COMPUTED DATA, never guess.
- Include this block whenever discussing a specific trade or trade session.
- The breakdown booleans indicate pass/fail for each discipline dimension.
`;
