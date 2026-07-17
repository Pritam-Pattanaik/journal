import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { GlareCard } from '../ui/GlareCard';
import { HoverLift, NumberCounter } from '../ui/Motion';

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: LucideIcon;
  colorType: 'pnl' | 'winrate' | 'rr' | 'discipline' | 'default';
  rawValue: number;
}

export default function StatCard({ label, value, subLabel, icon: Icon, colorType, rawValue }: StatCardProps) {
  const dotColor = (() => {
    switch (colorType) {
      case 'pnl':        return rawValue >= 0 ? 'bg-success' : 'bg-danger';
      case 'winrate':    return 'bg-accent';
      case 'rr':         return 'bg-warning';
      case 'discipline': return rawValue >= 4 ? 'bg-success' : rawValue >= 3 ? 'bg-warning' : 'bg-danger';
      default:           return 'bg-primary';
    }
  })();

  // We only animate the number if it's pnl, winrate, rr, discipline that can be extracted to a float easily
  // If we can't extract, we fallback to the static value.
  const isNumber = typeof rawValue === 'number' && !isNaN(rawValue);
  
  // Custom formatters for the number counter based on the colorType
  const formatNumber = (val: number) => {
    if (colorType === 'pnl') return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    if (colorType === 'winrate') return `${val.toFixed(1)}%`;
    if (colorType === 'rr') return `1:${val.toFixed(2)}`;
    if (colorType === 'discipline') return `${val.toFixed(1)}/5.0`;
    return val.toString();
  };

  return (
    <HoverLift className="h-full">
      <GlareCard className="flex flex-col justify-between p-6 min-h-[140px] h-full cursor-default select-none border-black/5 dark:border-white/5 bg-surface-1">
        <div className="flex items-center justify-between text-secondary mb-4">
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", dotColor)} />
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">{label}</span>
          </div>
          <Icon size={16} strokeWidth={1.5} className="flex-shrink-0 opacity-40 text-primary" />
        </div>
        <div className="font-mono text-3xl tabular-nums font-bold tracking-tight text-primary">
          {isNumber ? (
            <NumberCounter value={rawValue} format={formatNumber} duration={1.2} />
          ) : (
            value
          )}
        </div>
        <div className="mt-2 text-xs text-tertiary truncate font-medium">
          {subLabel}
        </div>
      </GlareCard>
    </HoverLift>
  );
}
