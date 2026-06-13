import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subLabel: string;
  icon: LucideIcon;
  colorType: 'pnl' | 'winrate' | 'rr' | 'discipline';
  rawValue: number;
}

export default function StatCard({
  label,
  value,
  subLabel,
  icon: Icon,
  colorType,
  rawValue
}: StatCardProps) {
  
  // Color coding based on type and score
  const getValueColor = () => {
    switch (colorType) {
      case 'pnl':
        return rawValue >= 0 ? 'text-gradient-profit' : 'text-gradient-loss';
      case 'winrate':
        return 'text-gradient-accent';
      case 'rr':
        return 'text-gold';
      case 'discipline':
        if (rawValue >= 4) return 'text-gradient-profit';
        if (rawValue >= 3) return 'text-gold';
        return 'text-gradient-loss';
      default:
        return 'text-primary';
    }
  };

  const getGlowClass = () => {
    switch (colorType) {
      case 'pnl':
        return rawValue >= 0 ? '!shadow-glow-profit' : '!shadow-glow-loss';
      case 'discipline':
        if (rawValue >= 4) return '!shadow-glow-profit';
        if (rawValue < 3) return '!shadow-glow-loss';
        return '';
      default:
        return '';
    }
  };

  return (
    <div className={`card flex-1 min-w-[160px] flex flex-col justify-between h-[100px] select-none ${getGlowClass()}`}>
      {/* Row 1: Label & Icon */}
      <div className="flex items-center justify-between text-muted">
        <span className="label-section">{label}</span>
        <Icon className="h-[13px] w-[13px]" />
      </div>

      {/* Row 2: Value */}
      <div className={`text-tv-xl font-mono font-semibold ${getValueColor()} my-1`}>
        {value}
      </div>

      {/* Row 3: Sub-label */}
      <div className="text-tv-xs text-secondary truncate">
        {subLabel}
      </div>
    </div>
  );
}
