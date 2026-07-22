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
  score: number;
  maxScore: 5;
  label: string;
  color: string;
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
  { score: 5, label: 'Elite',     color: '#00c48c' },
  { score: 4, label: 'Excellent', color: '#10d990' },
  { score: 3, label: 'Good',      color: '#6366f1' },
  { score: 2, label: 'Poor',      color: '#f59e0b' },
  { score: 1, label: 'Critical',  color: '#ff4b6e' },
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
    const info = getDisciplineInfo(data.score);
    if (!info) return null;

    return {
      score: info.score,
      maxScore: 5,
      label: info.label,
      color: info.color,
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
