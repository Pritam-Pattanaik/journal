import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, formatCompactCurrency } from '../../lib/analytics';

interface StrategyBarProps {
  data: { name: string; pnl: number }[];
}

export default function StrategyBar({ data }: StrategyBarProps) {
  return (
    <div
      style={{
        background: 'rgb(var(--color-surface))',
        border: '1px solid rgb(var(--color-border))',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 280,
      }}
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
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'rgb(var(--color-text-tertiary))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          P&L by Strategy
        </span>
      </div>

      <div style={{ height: 150, width: '100%' }}>
        {data.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--text-sm)',
              color: 'rgb(var(--color-text-tertiary))',
            }}
          >
            No strategies traded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={val => formatCompactCurrency(val)}
                tick={{ fill: 'rgb(113,113,122)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'rgb(113,113,122)', fontSize: 11, fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    const val = dataPoint.pnl;
                    return (
                      <div
                        style={{
                          background: 'rgb(var(--color-surface-elevated))',
                          border: '1px solid rgb(var(--color-border))',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 10px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          boxShadow: 'var(--shadow-md)',
                          userSelect: 'none',
                        }}
                      >
                        <p style={{ color: 'rgb(var(--color-text-secondary))', marginBottom: 4 }}>
                          {dataPoint.name}
                        </p>
                        <p
                          style={{
                            fontWeight: 500,
                            color: val >= 0 ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))',
                          }}
                        >
                          {val >= 0 ? '+' : ''}{formatCurrency(val)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={10}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
