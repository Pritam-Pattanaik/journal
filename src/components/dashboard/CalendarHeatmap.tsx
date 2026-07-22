import React from 'react';
import type { Trade } from '../../types';
import { getLocalYYYYMMDD } from '../../lib/dateUtils';

interface CalendarHeatmapProps {
  trades: Trade[];
}

export default React.memo(function CalendarHeatmap({ trades }: CalendarHeatmapProps) {
  // Aggregate PnL by day for the last 90 days
  const today = new Date();
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(getLocalYYYYMMDD(d));
  }

  const pnlMap = new Map<string, number>();
  trades.forEach(t => {
    const d = t.isCarryForward && t.exitTime ? new Date(t.exitTime) : new Date(t.date);
    const dateOnly = getLocalYYYYMMDD(d);
    pnlMap.set(dateOnly, (pnlMap.get(dateOnly) || 0) + t.netPnl);
  });

  const getCellColor = (pnl: number | undefined): string => {
    if (pnl === undefined) return 'rgb(var(--color-border) / 0.15)';
    if (pnl > 1000)  return 'rgb(var(--color-success) / 0.9)';
    if (pnl > 0)     return 'rgb(var(--color-success) / 0.4)';
    if (pnl < -1000) return 'rgb(var(--color-danger) / 0.9)';
    if (pnl < 0)     return 'rgb(var(--color-danger) / 0.4)';
    return 'rgb(var(--color-warning) / 0.4)'; // Breakeven
  };

  const legendSquares = [
    { color: 'rgb(var(--color-danger) / 0.9)',  label: 'Big loss' },
    { color: 'rgb(var(--color-danger) / 0.4)',  label: 'Loss' },
    { color: 'rgb(var(--color-border) / 0.15)', label: 'No trades' },
    { color: 'rgb(var(--color-success) / 0.4)', label: 'Profit' },
    { color: 'rgb(var(--color-success) / 0.9)', label: 'Big profit' },
  ];

  return (
    <div
      style={{
        background: 'rgb(var(--color-surface))',
        border: '1px solid rgb(var(--color-border))',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
      }}
      role="img"
      aria-label="Trading Heatmap showing PnL for the last 90 days"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'rgb(var(--color-text-primary))',
          }}
        >
          Trading Heatmap (Last 90 Days)
        </h3>
        {trades.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--text-xs)',
              color: 'rgb(var(--color-text-secondary))',
            }}
          >
            <span>Less</span>
            {legendSquares.map((sq, i) => (
              <div
                key={i}
                title={sq.label}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: sq.color,
                }}
              />
            ))}
            <span>More</span>
          </div>
        )}
      </div>

      {/* Grid with Empty State Overlay */}
      <div style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }}>
        {trades.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(var(--color-surface), 0.6)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            borderRadius: 'var(--radius-md)'
          }}>
            <p style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'rgb(var(--color-text-secondary))',
              background: 'rgb(var(--color-surface))',
              padding: '6px 12px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid rgb(var(--color-border))'
            }}>
              Not enough data to generate heatmap
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, minWidth: 'max-content', opacity: trades.length === 0 ? 0.3 : 1 }}>
          {Array.from({ length: Math.ceil(90 / 7) }).map((_, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const globalIndex = weekIndex * 7 + dayIndex;
                if (globalIndex >= 90) return null;
                const dateString = days[globalIndex];
                const pnl = pnlMap.get(dateString);

                return (
                  <div
                    key={dateString}
                    title={`${dateString}: ${pnl !== undefined ? '₹' + pnl.toLocaleString('en-IN') : 'No trades'}`}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      background: getCellColor(pnl),
                      transition: 'transform var(--duration-fast) var(--ease-out)',
                      cursor: trades.length === 0 ? 'default' : 'pointer',
                    }}
                    onMouseEnter={e => { if (trades.length > 0) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.3)'; }}
                    onMouseLeave={e => { if (trades.length > 0) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
