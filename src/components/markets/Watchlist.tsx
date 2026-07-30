import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, MoreHorizontal, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const INITIAL_WATCHLIST: WatchlistItem[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 173.50, change: 1.25, changePercent: 0.72 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 338.11, change: -2.15, changePercent: -0.63 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 460.18, change: 15.30, changePercent: 3.44 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 215.49, change: -5.40, changePercent: -2.44 },
  { symbol: 'META', name: 'Meta Platforms', price: 311.71, change: 4.50, changePercent: 1.47 },
];

export default function Watchlist() {
  const [items] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-primary">Watchlist</h3>
        </div>
        <button className="p-1.5 hover:bg-surface-2 rounded-md transition-colors text-tertiary hover:text-primary">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {items.map((item, index) => {
          const isPositive = item.change >= 0;
          return (
            <motion.div
              key={item.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-1 transition-colors group cursor-pointer"
            >
              <div className="flex flex-col">
                <span className="font-bold text-sm text-primary tracking-tight">{item.symbol}</span>
                <span className="text-[11px] text-tertiary truncate max-w-[120px]">{item.name}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="font-mono-stat text-sm font-semibold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-[11px] font-bold",
                    isPositive ? "text-success" : "text-danger"
                  )}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%</span>
                  </div>
                </div>
                <button className="text-tertiary opacity-0 group-hover:opacity-100 hover:text-primary transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
