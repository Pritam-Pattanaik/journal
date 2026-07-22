import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency, formatCompactCurrency, formatDate } from '../../lib/analytics';
import { cn } from '../../lib/cn';

interface PnLCurveProps {
  data: { date: string; pnl: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const dp = payload[0].payload;
  const val: number = dp.pnl;
  const isPos = val >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="glass-float px-3 py-2.5 min-w-[130px]"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1.5">{formatDate(dp.date)}</p>
      <p className={cn('text-sm font-bold font-mono tabular-nums', isPos ? 'text-success' : 'text-danger')}>
        {isPos ? '+' : ''}{formatCurrency(val)}
      </p>
    </motion.div>
  );
};

export default function PnLCurve({ data }: PnLCurveProps) {
  const lastVal = data.length > 0 ? data[data.length - 1].pnl : 0;
  const isPositive = lastVal >= 0;
  const strokeColor = isPositive ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))';
  const gradientId = isPositive ? 'pnlPos' : 'pnlNeg';

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-secondary">
        <div className="w-12 h-12 rounded-2xl bg-surface-1 border border-border flex items-center justify-center">
          <svg className="w-5 h-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-sm font-medium">No P&L data for this period</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label="Cumulative Profit and Loss curve chart" style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={strokeColor} stopOpacity={0.7} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="rgb(var(--color-border) / 0.1)" verticalFill={['rgba(255,255,255,0.01)', 'transparent']} />
        <XAxis
          dataKey="date"
          tickFormatter={d => formatDate(d)}
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 9, fontFamily: 'DM Mono, Geist Mono, monospace' }}
          axisLine={false} tickLine={false} dy={12}
        />
        <YAxis
          tickFormatter={v => formatCompactCurrency(v)}
          tick={{ fill: 'rgb(var(--color-text-secondary))', fontSize: 9, fontFamily: 'DM Mono, Geist Mono, monospace' }}
          axisLine={false} tickLine={false} dx={-4}
        />
        <ReferenceLine y={0} stroke="rgb(var(--color-border) / 0.2)" strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(var(--color-iris) / 0.5)', strokeWidth: 1.5, strokeDasharray: '4 4' }} wrapperStyle={{ outline: 'none' }} isAnimationActive={true} animationDuration={250} />
        <Area
          type="monotone" dataKey="pnl"
          stroke={strokeColor} strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: strokeColor, strokeWidth: 3, stroke: 'rgb(var(--color-canvas))' }}
          fillOpacity={1} fill={`url(#${gradientId})`}
        />
      </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
