import React from 'react';
import { getDisciplineInfo } from '../../lib/disciplineUtils';
import DisciplineRater from '../ui/DisciplineRater';
import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';
interface DailySummaryBlockProps {
  summary: any;
}

export default function DailySummaryBlock({ summary }: DailySummaryBlockProps) {
  if (!summary) return null;

  const info = getDisciplineInfo(summary.averageDiscipline);
  if (!info) return null;

  return (
    <div className="flex items-center justify-end gap-2 text-xs">
      {/* Disciplined Trades */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-surface-1 border border-border-subtle shadow-sm">
        <Check size={12} className="text-success" />
        <span className="font-semibold text-secondary">{summary.totalScoredTrades} <span className="hidden sm:inline">Disciplined</span></span>
      </div>

      {/* Revenge Trades */}
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border shadow-sm transition-colors", summary.revengeCount > 0 ? "bg-danger/5 border-danger/20" : "bg-surface-1 border-border-subtle")}>
        {summary.revengeCount > 0 ? <AlertTriangle size={12} className="text-danger" /> : <Check size={12} className="text-success" />}
        <span className={cn("font-semibold", summary.revengeCount > 0 ? "text-danger" : "text-secondary")}>
          {summary.revengeCount} <span className="hidden sm:inline">Revenge</span>
        </span>
      </div>

      {/* Oversized Trades */}
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded border shadow-sm transition-colors", summary.oversizingCount > 0 ? "bg-warning/10 border-warning/20" : "bg-surface-1 border-border-subtle")}>
        {summary.oversizingCount > 0 ? <AlertTriangle size={12} className="text-warning" /> : <Check size={12} className="text-success" />}
        <span className={cn("font-semibold", summary.oversizingCount > 0 ? "text-warning" : "text-secondary")}>
          {summary.oversizingCount} <span className="hidden sm:inline">Oversized</span>
        </span>
      </div>
    </div>
  );
}
