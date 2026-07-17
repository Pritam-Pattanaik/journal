import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatCompactCurrency, formatDate } from '../../lib/analytics';

interface PnLCurveProps {
  data: { date: string; pnl: number }[];
}

export default function PnLCurve({ data }: PnLCurveProps) {
  const lastVal = data.length > 0 ? data[data.length - 1].pnl : 0;
  const isPositive = lastVal >= 0;
  const mainColor = isPositive ? '#10B981' : '#EF4444';
  const gradientId = isPositive ? 'greenGradient' : 'redGradient';

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
          Equity Curve
        </span>
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 500,
            color: isPositive ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))',
          }}
        >
          {lastVal >= 0 ? '+' : ''}
          {formatCurrency(lastVal)}
        </span>
      </div>

      <div style={{ height: 170, width: '100%' }}>
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
            No P&L data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={mainColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={mainColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tickFormatter={date => formatDate(date)}
                tick={{ fill: 'rgb(113,113,122)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={val => formatCompactCurrency(val)}
                tick={{ fill: 'rgb(113,113,122)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />

              <ReferenceLine y={0} stroke="rgb(55,55,60)" strokeDasharray="3 3" strokeOpacity={0.8} />

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
                          {formatDate(dataPoint.date)}
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

              <Area
                type="monotone"
                dataKey="pnl"
                stroke={mainColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
