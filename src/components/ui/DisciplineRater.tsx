import React, { useState } from 'react';
import { getDisciplineInfo, DisciplineBreakdown } from '../../lib/disciplineUtils';
import { cn } from '../../lib/cn';

interface DisciplineRaterProps {
  value?: number | null; // 1 to 5
  onChange?: (val: number) => void;
  interactive?: boolean;
  /** Optional breakdown for the tooltip */
  breakdown?: DisciplineBreakdown;
  /** Compact mode for tight table cells */
  compact?: boolean;
}

const BREAKDOWN_LABELS: { key: keyof DisciplineBreakdown; label: string }[] = [
  { key: 'entryPlan',       label: 'Entry Plan' },
  { key: 'riskManagement',  label: 'Risk Management' },
  { key: 'exitExecution',   label: 'Exit Execution' },
  { key: 'emotionControl',  label: 'Emotion Control' },
  { key: 'ruleCompliance',  label: 'Rule Compliance' },
];

export default function DisciplineRater({
  value,
  onChange,
  interactive = false,
  breakdown,
  compact = false,
}: DisciplineRaterProps) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const info = getDisciplineInfo(interactive ? (hoveredScore ?? value) : value);
  const displayInfo = getDisciplineInfo(value);

  if (!displayInfo) {
    return (
      <span className="text-tertiary text-xs uppercase tracking-widest font-bold">
        Unrated
      </span>
    );
  }

  // ─── Interactive Mode (Journal) ───────────────────────────────────────────
  if (interactive) {
    const activeInfo = info || displayInfo;
    return (
      <div className="flex items-center gap-3 select-none">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((num) => {
            const isFilled = num <= (hoveredScore ?? value);
            const circleColor = activeInfo.color;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onChange?.(num)}
                onMouseEnter={() => setHoveredScore(num)}
                onMouseLeave={() => setHoveredScore(null)}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                style={{
                  borderColor: isFilled ? circleColor : 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: isFilled ? circleColor : 'transparent',
                }}
                aria-label={`Rate ${num} out of 5`}
              >
                {isFilled && (
                  <div className="w-2 h-2 rounded-full bg-white/90" />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-primary">
            {hoveredScore ?? value}/{activeInfo.maxScore}
          </span>
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: activeInfo.color }}
          >
            {activeInfo.label}
          </span>
        </div>
      </div>
    );
  }

  // ─── Display Mode (Trade Table, Cards, Modals) ────────────────────────────
  return (
    <div
      className="relative inline-flex items-center gap-2 select-none group/disc"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Filled + Empty Circles */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const isFilled = i < displayInfo.filledCount;
          return (
            <div
              key={i}
              className={cn(
                "rounded-full transition-all duration-200",
                compact ? "w-2.5 h-2.5" : "w-3 h-3"
              )}
              style={{
                backgroundColor: isFilled ? displayInfo.color : 'transparent',
                border: `1.5px solid ${isFilled ? displayInfo.color : 'rgba(255, 255, 255, 0.15)'}`,
              }}
            />
          );
        })}
      </div>

      {/* Score + Label */}
      {!compact && (
        <span
          className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ color: displayInfo.color }}
        >
          {displayInfo.label}
        </span>
      )}

      {/* Hover Tooltip */}
      {showTooltip && (
        <div className="absolute z-[100] left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 p-4 bg-surface-elevated border border-border rounded-xl shadow-floating animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Discipline Breakdown
            </span>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: displayInfo.color }}
            >
              {displayInfo.score}/{displayInfo.maxScore}
            </span>
          </div>

          {/* Breakdown rows */}
          {breakdown ? (
            <div className="space-y-2">
              {BREAKDOWN_LABELS.map(({ key, label }) => {
                const passed = breakdown[key];
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-secondary font-medium">{label}</span>
                    <span className={cn(
                      "font-bold",
                      passed ? "text-success" : "text-warning"
                    )}>
                      {passed ? '✓' : '△'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {BREAKDOWN_LABELS.map(({ key, label }) => {
                // Infer from score when no breakdown data available
                const passed = displayInfo.score >= (key === 'exitExecution' ? 4 : key === 'emotionControl' ? 3 : 2);
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-secondary font-medium">{label}</span>
                    <span className={cn(
                      "font-bold",
                      passed ? "text-success" : "text-warning"
                    )}>
                      {passed ? '✓' : '△'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Label */}
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-tertiary font-bold uppercase tracking-widest">Overall</span>
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: displayInfo.color }}
            >
              {displayInfo.label}
            </span>
          </div>

          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-2.5 h-2.5 bg-surface-elevated border-r border-b border-border rotate-45 -mt-1.5" />
        </div>
      )}
    </div>
  );
}
