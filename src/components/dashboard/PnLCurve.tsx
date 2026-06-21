import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatDate } from '../../lib/analytics';

interface PnLCurveProps {
  data: { date: string; pnl: number }[];
}

export default function PnLCurve({ data }: PnLCurveProps) {
  const lastVal = data.length > 0 ? data[data.length - 1].pnl : 0;
  const isPositive = lastVal >= 0;
  const mainColor = isPositive ? '#10d990' : '#ff4b6e';
  const gradientId = isPositive ? 'greenGradient' : 'redGradient';

  return (
    <div className="card flex-1 min-w-[320px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="label-section">Equity Curve</span>
        <span className={`text-tv-sm font-mono font-semibold ${isPositive ? 'text-profit' : 'text-loss'}`}>
          {lastVal >= 0 ? '+' : ''}
          {formatCurrency(lastVal)}
        </span>
      </div>

      <div className="h-[170px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted font-ui text-tv-sm">
            No P&L data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={mainColor} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={mainColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tickFormatter={(date) => formatDate(date)}
                tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(val) => formatCurrency(val)}
                tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />

              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" strokeOpacity={0.5} />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    const val = dataPoint.pnl;
                    return (
                      <div className="bg-[#0a1030] border border-tv-border-bright rounded-tv-lg p-2 font-mono text-tv-xs select-none">
                        <p className="text-secondary mb-1">{formatDate(dataPoint.date)}</p>
                        <p className={val >= 0 ? 'text-profit font-semibold' : 'text-loss font-semibold'}>
                          {val >= 0 ? '+' : ''}
                          {formatCurrency(val)}
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
