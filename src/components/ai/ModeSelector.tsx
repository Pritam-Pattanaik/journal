import React from 'react';
import { cn } from '../../lib/cn';

export type AIMode = 'Risk Analysis' | 'Psychology' | 'Performance Review';

export const AI_MODES: AIMode[] = ['Risk Analysis', 'Psychology', 'Performance Review'];

export function ModeSelector({ selected, onSelect }: { selected: AIMode, onSelect: (m: AIMode) => void }) {
  return (
    <div className="flex items-center gap-2 bg-surface-1 p-1.5 rounded-xl w-fit border border-border overflow-x-auto custom-scrollbar">
      {AI_MODES.map(mode => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
            selected === mode 
              ? "bg-surface-elevated text-primary shadow-sm border border-border" 
              : "text-tertiary hover:text-secondary hover:bg-surface-2 border border-transparent"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
