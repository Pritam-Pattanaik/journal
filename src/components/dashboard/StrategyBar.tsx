import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactCurrency } from '../../lib/analytics';
import { cn } from '../../lib/cn';

interface StrategyBarProps {
  data: { name: string; pnl: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const dp = payload[0].payload;
  const val: number = dp.pnl;
  const isPos = val >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="glass-float px-3 py-2.5 min-w-[120px]"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1.5 truncate max-w-[120px]">{dp.name}</p>
      <p className={cn('text-sm font-bold font-mono tabular-nums', isPos ? 'text-success' : 'text-danger')}>
        {isPos ? '+' : ''}{formatCurrency(val)}
      </p>
    </motion.div>
  );
};

export default function StrategyBar({ data }: StrategyBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-secondary">
        <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-border flex items-center justify-center">
          <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-medium">No strategies traded yet</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Strategy performance bar chart" style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradientPos" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(var(--color-iris))" stopOpacity={0.8} />
            <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="barGradientNeg" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="rgb(var(--color-danger))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="rgb(var(--color-danger))" stopOpacity={1} />
          </linearGradient>
        </defs>
        <XAxis
          type="number"
          tickFormatter={v => formatCompactCurrency(v)}
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 9, fontFamily: 'DM Mono, Geist Mono, monospace' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          type="category" dataKey="name"
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 11, fontFamily: 'Geist Sans, system-ui' }}
          axisLine={false} tickLine={false} width={88}
        />
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ fill: 'transparent' }} 
          wrapperStyle={{ outline: 'none' }}
        />
        <Bar dataKey="pnl" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? 'url(#barGradientPos)' : 'url(#barGradientNeg)'} />
          ))}
        </Bar>
      </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
