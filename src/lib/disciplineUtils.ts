// src/lib/disciplineUtils.ts
// ─── Frontend Discipline Utilities — Single Source of Truth ─────────────────

export interface DisciplineInfo {
  score: number;
  maxScore: 5;
  label: string;
  color: string;
  filledCount: number;
  emptyCount: number;
}

export interface DisciplineBreakdown {
  entryPlan: boolean;
  riskManagement: boolean;
  exitExecution: boolean;
  emotionControl: boolean;
  ruleCompliance: boolean;
}

export interface DisciplineEvaluation {
  confidence: number;
  reasons: string[];
  mistakes: string[];
  strengths: string[];
  breakdown: DisciplineBreakdown;
}

interface DisciplineLevel {
  score: number;
  label: string;
  color: string;
}

const DISCIPLINE_SCALE: DisciplineLevel[] = [
  { score: 5, label: 'Flawless', color: '#10b981' }, // Green
  { score: 4, label: 'Good',     color: '#34d399' }, // Light Green
  { score: 3, label: 'Average',  color: '#f59e0b' }, // Amber
  { score: 2, label: 'Poor',     color: '#f97316' }, // Orange
  { score: 1, label: 'Reckless', color: '#ef4444' }, // Red
];

/**
 * The ONE function every component calls.
 * Takes a raw discipline score (1-5) and returns all display information.
 */
export function getDisciplineInfo(score: number | null | undefined): DisciplineInfo | null {
  if (score == null || score < 1 || score > 5) return null;

  const clamped = Math.max(1, Math.min(5, Math.round(score)));
  const level = DISCIPLINE_SCALE.find(l => l.score === clamped) || DISCIPLINE_SCALE[4];

  return {
    score: clamped,
    maxScore: 5,
    label: level.label,
    color: level.color,
    filledCount: clamped,
    emptyCount: 5 - clamped,
  };
}

/**
 * Parse a DISCIPLINE_JSON block from an AI streamed response.
 */
export function parseDisciplineFromAIResponse(text: string): DisciplineEvaluation | null {
  const startTag = '<!--DISCIPLINE_JSON-->';
  const endTag = '<!--/DISCIPLINE_JSON-->';
  const startIdx = text.indexOf(startTag);
  const endIdx = text.indexOf(endTag);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  const jsonStr = text.substring(startIdx + startTag.length, endIdx).trim();

  try {
    const data = JSON.parse(jsonStr);

    return {
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.8,
      reasons: Array.isArray(data.reasons) ? data.reasons : [],
      mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      breakdown: {
        entryPlan: data.breakdown?.entryPlan ?? true,
        riskManagement: data.breakdown?.riskManagement ?? true,
        exitExecution: data.breakdown?.exitExecution ?? true,
        emotionControl: data.breakdown?.emotionControl ?? true,
        ruleCompliance: data.breakdown?.ruleCompliance ?? true,
      },
    };
  } catch {
    return null;
  }
}
