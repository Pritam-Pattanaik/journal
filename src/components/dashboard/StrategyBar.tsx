import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatCurrency } from '../../lib/analytics';

interface StrategyBarProps {
  data: { name: string; pnl: number }[];
}

export default function StrategyBar({ data }: StrategyBarProps) {
  return (
    <div className="card flex-1 min-w-[300px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="label-section">P&L by Strategy</span>
      </div>

      <div className="h-[150px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted font-ui text-tv-sm">
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
                tickFormatter={(val) => formatCurrency(val)}
                tick={{ fill: '#475569', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Outfit' }}
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
                      <div className="bg-[#0a1030] border border-tv-border-bright rounded-tv-lg p-2 font-mono text-tv-xs select-none">
                        <p className="text-secondary mb-1">{dataPoint.name}</p>
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
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={9}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? '#10d990' : '#ff4b6e'}
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
