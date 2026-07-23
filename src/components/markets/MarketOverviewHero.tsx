import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Clock, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { cn } from '../../lib/cn';
import { useLiveMarketData } from '../../hooks/useLiveMarketData';
import { SkeletonLoader } from '../ui/SkeletonLoader';

export default function MarketOverviewHero() {
  const [time, setTime] = useState(new Date());
  const { data: markets, loading, error } = useLiveMarketData(5000); // Poll every 5s

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number, isCurrency = false) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: isCurrency ? 2 : 2,
      maximumFractionDigits: 2 
    });
  };

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
        <div className="flex items-center gap-2 text-xs font-semibold text-tertiary px-3 py-1.5 rounded-lg bg-surface-1 border border-border/50 shadow-sm backdrop-blur-md">
          <Clock className="w-3.5 h-3.5 text-accent" />
          <span className="tabular-nums">{time.toLocaleTimeString()} (IST)</span>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="w-full overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 mask-edges-horizontal">
        <div className="flex gap-4 w-max min-h-[140px]">
          
          {loading && markets.length === 0 ? (
            // Skeleton Loader
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="w-[220px] shrink-0 rounded-xl border border-border bg-surface-0 p-4">
                <div className="flex justify-between mb-4">
                  <SkeletonLoader width={80} height={14} className="rounded" />
                  <SkeletonLoader width={40} height={14} className="rounded" />
                </div>
                <SkeletonLoader width={120} height={24} className="rounded mb-2" />
                <SkeletonLoader width={90} height={14} className="rounded mb-4" />
                <SkeletonLoader width="100%" height={40} className="rounded" />
              </div>
            ))
          ) : error && markets.length === 0 ? (
            // Error State
            <div className="w-full h-[140px] flex items-center justify-center bg-surface-1 border border-danger/20 rounded-xl text-danger/80 text-sm font-semibold gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}. Please check backend connection.
            </div>
          ) : (
            // Live Data
            markets.map((market, i) => {
              const isUp = market.change >= 0;
              const colorClass = isUp ? 'text-success' : 'text-danger';
              const strokeColor = isUp ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))';
              const bgFlashClass = market.flash === 'up' ? 'bg-success/10 border-success/30' : market.flash === 'down' ? 'bg-danger/10 border-danger/30' : 'bg-surface-0 border-border/50 hover:border-border-hover';

              return (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={cn(
                    "w-[220px] shrink-0 rounded-xl border p-4 relative overflow-hidden group transition-all duration-300 shadow-sm backdrop-blur-xl",
                    bgFlashClass
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-secondary group-hover:text-primary transition-colors">{market.name}</span>
                    <div className="flex items-center gap-1.5 bg-surface-elevated/50 px-2 py-0.5 rounded-full border border-border-subtle">
                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", market.status === 'OPEN' || market.status === '24/7' ? 'bg-success' : 'bg-tertiary')} />
                      <span className="text-[9px] font-bold text-tertiary">{market.status}</span>
                    </div>
                  </div>

                  <div className="flex flex-col mb-3">
                    <span className={cn("text-xl font-display font-bold tabular-nums tracking-tight transition-colors duration-300", market.flash ? (market.flash === 'up' ? 'text-success' : 'text-danger') : 'text-primary')}>
                      {market.id === 'btc' ? '$' : ''}{formatNumber(market.value)}
                    </span>
                    <div className={cn("flex items-center gap-1 text-[11px] font-semibold mt-0.5 tabular-nums transition-colors duration-300", colorClass)}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {isUp ? '+' : ''}{formatNumber(market.change)} ({isUp ? '+' : ''}{market.pct.toFixed(2)}%)
                    </div>
                  </div>

                  {/* Mini Sparkline */}
                  <div className="h-10 w-full mt-2 opacity-70 group-hover:opacity-100 transition-opacity relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={market.sparkline.map((val, idx) => ({ value: val, idx }))}>
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
