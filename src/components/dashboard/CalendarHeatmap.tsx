import React from 'react';
import type { Trade } from '../../types';
import { getLocalYYYYMMDD } from '../../lib/dateUtils';

interface CalendarHeatmapProps {
  trades: Trade[];
}

export default function CalendarHeatmap({ trades }: CalendarHeatmapProps) {
  // Aggregate PnL by day for the last 90 days
  const today = new Date();
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(getLocalYYYYMMDD(d));
  }

  const pnlMap = new Map<string, number>();
  trades.forEach(t => {
    const d = new Date(t.date);
    const dateOnly = getLocalYYYYMMDD(d);
    pnlMap.set(dateOnly, (pnlMap.get(dateOnly) || 0) + t.netPnl);
  });

  const getColorClass = (pnl: number | undefined) => {
    if (pnl === undefined) return 'bg-tv-border/30';
    if (pnl > 1000) return 'bg-profit';
    if (pnl > 0) return 'bg-profit/50';
    if (pnl < -1000) return 'bg-loss';
    if (pnl < 0) return 'bg-loss/50';
    return 'bg-gold/50'; // Breakeven
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-tv-base text-primary">Trading Heatmap (Last 90 Days)</h3>
        <div className="flex items-center gap-2 text-[10px] text-secondary">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px] bg-loss"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-loss/50"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-tv-border/30"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-profit/50"></div>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-profit"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-max">
          {/* Group days by weeks. 90 days is approx 13 weeks. */}
          {Array.from({ length: Math.ceil(90 / 7) }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const globalIndex = weekIndex * 7 + dayIndex;
                if (globalIndex >= 90) return null;
                const dateString = days[globalIndex];
                const pnl = pnlMap.get(dateString);
                
                return (
                  <div
                    key={dateString}
                    className={`w-3.5 h-3.5 rounded-sm ${getColorClass(pnl)} transition-colors duration-200 hover:ring-2 hover:ring-white/20`}
                    title={`${dateString}: ${pnl !== undefined ? '₹' + pnl.toLocaleString() : 'No Trades'}`}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
