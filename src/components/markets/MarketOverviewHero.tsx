import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Clock, Activity } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { cn } from '../../lib/cn';

// Realistic mock data generator for sparklines
const generateSparklineData = (trend: 'up' | 'down', volatility: number = 10) => {
  let value = 100;
  const data = [];
  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - (trend === 'up' ? 0.3 : 0.7)) * volatility;
    value += change;
    data.push({ value });
  }
  return data;
};

const MARKETS = [
  { id: 'nifty', name: 'NIFTY 50', value: '24,120.50', change: '+185.30', pct: '+0.77%', trend: 'up', status: 'OPEN' },
  { id: 'banknifty', name: 'BANK NIFTY', value: '51,300.25', change: '+650.15', pct: '+1.28%', trend: 'up', status: 'OPEN' },
  { id: 'sensex', name: 'SENSEX', value: '79,200.10', change: '+520.40', pct: '+0.66%', trend: 'up', status: 'OPEN' },
  { id: 'finnifty', name: 'FINNIFTY', value: '23,100.80', change: '+120.90', pct: '+0.52%', trend: 'up', status: 'OPEN' },
  { id: 'vix', name: 'INDIA VIX', value: '13.52', change: '-0.45', pct: '-3.22%', trend: 'down', status: 'OPEN' },
  { id: 'usdinr', name: 'USD / INR', value: '83.52', change: '+0.05', pct: '+0.06%', trend: 'up', status: 'OPEN' },
  { id: 'gold', name: 'Gold', value: '72,450', change: '-120', pct: '-0.16%', trend: 'down', status: 'OPEN' },
  { id: 'btc', name: 'Bitcoin', value: '$64,200', change: '+1,200', pct: '+1.90%', trend: 'up', status: '24/7' },
];

export default function MarketOverviewHero() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Memoize sparkline data so it doesn't jump on re-renders
  const sparklines = useMemo(() => {
    const map: Record<string, any[]> = {};
    MARKETS.forEach(m => {
      map[m.id] = generateSparklineData(m.trend as 'up'|'down', m.id === 'vix' ? 2 : 15);
    });
    return map;
  }, []);

  return (
    <div className="w-full mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" />
            Live Market Overview
          </h2>
          <p className="text-sm text-secondary mt-1">Real-time indices and macroeconomic indicators</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-tertiary px-3 py-1.5 rounded-lg bg-surface-1 border border-border">
          <Clock className="w-3.5 h-3.5" />
          {time.toLocaleTimeString()} (IST)
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 w-max">
          {MARKETS.map((market, i) => {
            const isUp = market.trend === 'up';
            const colorClass = isUp ? 'text-success' : 'text-danger';
            const strokeColor = isUp ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))';

            return (
              <motion.div
                key={market.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="w-[220px] shrink-0 card p-4 relative overflow-hidden group hover:border-border-hover transition-colors"
              >
                {/* Background Gradient subtle hint */}
                <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] -z-10 opacity-20 group-hover:opacity-30 transition-opacity", isUp ? "bg-success" : "bg-danger")} />

                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-secondary">{market.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[9px] font-bold text-tertiary">{market.status}</span>
                  </div>
                </div>

                <div className="flex flex-col mb-3">
                  <span className="text-xl font-display font-bold text-primary tabular-nums tracking-tight">
                    {market.value}
                  </span>
                  <div className={cn("flex items-center gap-1 text-xs font-semibold mt-0.5", colorClass)}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {market.change} ({market.pct})
                  </div>
                </div>

                {/* Mini Sparkline */}
                <div className="h-10 w-full mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklines[market.id]}>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={strokeColor} 
                        strokeWidth={1.5} 
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
