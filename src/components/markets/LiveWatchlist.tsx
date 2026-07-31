/**
 * LiveWatchlist — Real Watchlist with Live Prices
 *
 * Powered by useLiveMarketData — shows all tracked market indices as the watchlist.
 * Includes live price flash animations, trend indicators, sparkline mini-charts.
 * No hardcoded data — all from SSE stream.
 */

import React from 'react';
import { Star, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { useLiveMarketData, type MarketQuote } from '../../hooks/useMarketData';

function SparklineMini({ data, isUp }: { data: number[]; isUp: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;

  const points = data
    .slice(-20)
    .map((v, i, arr) => {
      const x = (i / (arr.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const color = isUp ? '#10b981' : '#ef4444';
  const fillColor = isUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WatchlistRow({ item, index }: { item: MarketQuote; index: number }) {
  const isUp = item.changePercent >= 0;
  const hasFlash = item.flash != null;
  const flashUp = item.flash === 'up';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg transition-all duration-150 group cursor-pointer relative overflow-hidden',
        hasFlash && (flashUp ? 'flash-up' : 'flash-down'),
        'hover:bg-surface-1',
      )}
    >
      {/* Flash overlay */}
      {hasFlash && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: flashUp ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Left: Symbol + name */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-bold text-sm text-primary tracking-tight truncate">
          {item.name}
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-mono text-tertiary">{item.id.toUpperCase()}</span>
          <span
            className="text-[9px] font-bold px-1 py-0.5 rounded"
            style={{
              background: item.status === 'OPEN' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
              color: item.status === 'OPEN' ? '#10b981' : item.status === '24/7' ? '#6b7280' : '#ef4444',
            }}
          >
            {item.status}
          </span>
        </div>
      </div>

      {/* Middle: Sparkline */}
      <div className="hidden sm:flex items-center justify-center px-2">
        <SparklineMini data={item.sparkline ?? []} isUp={isUp} />
      </div>

      {/* Right: Price + change */}
      <div className="flex flex-col items-end shrink-0">
        <span className="font-mono text-sm font-bold text-primary tabular-nums">
          {item.price >= 1000
            ? item.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })
            : item.price.toFixed(2)}
        </span>
        <div className={cn(
          'flex items-center gap-0.5 text-[11px] font-bold',
          isUp ? 'text-success' : 'text-danger',
        )}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isUp ? '+' : ''}{item.changePercent.toFixed(2)}%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveWatchlist() {
  const { data: quotes, loading, error } = useLiveMarketData();

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-primary">Market Watchlist</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {!loading && quotes.length > 0 && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-bold text-success">LIVE</span>
            </>
          )}
          {loading && (
            <Activity className="w-3.5 h-3.5 text-tertiary animate-pulse" />
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {loading && quotes.length === 0 && (
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-12 bg-surface-1 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Activity className="w-6 h-6 text-tertiary opacity-40" />
            <p className="text-xs text-tertiary">Live data unavailable</p>
          </div>
        )}

        {quotes.map((item, index) => (
          <WatchlistRow key={item.id} item={item} index={index} />
        ))}
      </div>

      {/* Footer */}
      {quotes.length > 0 && (
        <div className="px-4 py-2 border-t border-border/40 shrink-0">
          <p className="text-[9px] text-tertiary">
            {quotes.length} instruments · Provider: {quotes[0]?.provider ?? 'yahoo'} ·
            Updated {new Date(quotes[0]?.updatedAt ?? Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
          </p>
        </div>
      )}
    </div>
  );
}
