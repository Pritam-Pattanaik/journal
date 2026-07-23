import React, { useState } from 'react';
import { getDisciplineInfo, DisciplineBreakdown } from '../../lib/disciplineUtils';
import { cn } from '../../lib/cn';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface DisciplineRaterProps {
  value?: number | null; // 1 to 5
  rawScore?: number | null;
  confidence?: number | null;
  tradingStyle?: string | null;
  onChange?: (val: number) => void;
  interactive?: boolean;
  breakdown?: any;
  signals?: any;
  reasons?: string[];
  compact?: boolean;
}

const BREAKDOWN_LABELS: { key: string; label: string }[] = [
  { key: 'entryTiming',       label: 'Entry Timing' },
  { key: 'holdTime',          label: 'Hold Time' },
  { key: 'sizing',            label: 'Position Size' },
  { key: 'revenge',           label: 'Revenge Avoidance' },
  { key: 'consistency',       label: 'Risk Consistency' },
  { key: 'personalRules',     label: 'Rule Compliance' },
];

export interface DisciplineSignals {
  entryTiming?: number;
  holdTime?: number;
  sizing?: number;
  revenge?: number;
  stopLoss?: number;
  consistency?: number;
  personalRules?: number;
}

export default function DisciplineRater({
  value,
  rawScore,
  confidence,
  tradingStyle,
  onChange,
  interactive = false,
  breakdown,
  signals,
  reasons,
  compact = false,
}: DisciplineRaterProps) {
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

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
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="relative inline-flex items-center gap-4 select-none group/disc cursor-help hover:bg-white/5 transition-colors duration-200 rounded-lg p-1.5 -m-1.5 whitespace-nowrap flex-nowrap shrink-0">
            {/* Filled + Empty Circles */}
            <div className="flex items-center gap-0.5 shrink-0 whitespace-nowrap">
              {Array.from({ length: 5 }, (_, i) => {
                const isFilled = i < displayInfo.filledCount;
                return (
                  <svg
                    key={i}
                    className={cn("transition-all duration-300 shrink-0", compact ? "w-4 h-4" : "w-5 h-5")}
                    viewBox="0 0 24 24"
                    fill={isFilled ? displayInfo.color : 'transparent'}
                    stroke={isFilled ? displayInfo.color : 'rgba(255, 255, 255, 0.15)'}
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                );
              })}
            </div>

            {/* Flat Horizontal Labels */}
            <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
              {/* Score Group */}
              <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                <span className="text-xs font-mono font-bold text-primary shrink-0">
                  {rawScore ?? displayInfo.score} / {displayInfo.maxScore}
                </span>
                <span
                  className="text-[10px] font-bold tracking-widest uppercase shrink-0"
                  style={{ color: displayInfo.color }}
                >
                  {displayInfo.label}
                </span>
              </div>
              
              {/* Confidence Badge */}
              {confidence != null && (
                <span className="inline-flex items-center justify-center h-[20px] px-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest font-bold text-tertiary/90 shadow-sm shrink-0 whitespace-nowrap">
                  {Math.round(confidence)}% CONF
                </span>
              )}
            </div>
          </div>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            className="z-[100] w-[260px] p-3 bg-surface-elevated/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
                Discipline Breakdown
              </span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: displayInfo.color }}
              >
                {displayInfo.score}/{displayInfo.maxScore}
              </span>
            </div>

            {/* Breakdown rows */}
            {tradingStyle && (
              <div className="flex items-center justify-between text-xs mb-1.5 pb-1.5 border-b border-white/5">
                 <span className="text-secondary font-medium">Style</span>
                 <span className="font-bold text-primary">{tradingStyle}</span>
              </div>
            )}
            {breakdown && Object.keys(breakdown).length > 0 ? (
              <div className="space-y-1.5">
                {Object.entries(breakdown).map(([key, val]) => {
                  const passed = (val as number) >= 0;
                  return (
                    <div key={key} className="flex items-center justify-between text-[11px]">
                      <span className="text-secondary capitalize">{key}</span>
                      <span className={cn(
                        "flex items-center font-bold",
                        passed ? "text-success" : "text-warning"
                      )}>
                        {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  );
                })}
                {reasons && reasons.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                     <ul className="text-[10px] list-none space-y-1.5">
                      {reasons.map((r, idx) => {
                        const isGood = r.startsWith('✓');
                        const isBad = r.startsWith('⚠');
                        return (
                          <li key={idx} className={cn("flex items-start gap-1.5 leading-snug", isGood ? "text-success/90" : isBad ? "text-warning/90" : "text-tertiary")}>
                             <span className="shrink-0 mt-0.5">
                               {isGood ? <CheckCircle2 className="w-3 h-3" /> : isBad ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                             </span>
                             <span className="text-secondary">{isGood || isBad ? r.slice(1).trim() : r}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ) : signals ? (
              <div className="space-y-1.5">
                {[
                  { key: 'entryPlan',       label: 'Entry Plan' },
                  { key: 'riskManagement',  label: 'Risk Management' },
                  { key: 'exitExecution',   label: 'Exit Execution' },
                  { key: 'emotionControl',  label: 'Emotion Control' },
                  { key: 'ruleCompliance',  label: 'Rule Compliance' },
                ].map(({ key, label }) => {
                  const passed = (breakdown as any)[key];
                  return (
                    <div key={key} className="flex items-center justify-between text-[11px]">
                      <span className="text-secondary">{label}</span>
                      <span className={cn(
                        "flex items-center font-bold",
                        passed ? "text-success" : "text-warning"
                      )}>
                        {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-tertiary text-center italic py-1">
                No breakdown available
              </div>
            )}

            {/* Footer Label */}
            <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] text-tertiary font-bold uppercase tracking-widest">Overall</span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: displayInfo.color }}
              >
                {displayInfo.label}
              </span>
            </div>

            <Tooltip.Arrow className="fill-surface-elevated/95" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
