import React from 'react';
import { Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '../../lib/cn';

const SECTORS = [
  { name: 'NIFTY IT', change: 1.85, topGainer: 'TCS', topLoser: 'WIPRO', volume: '12.4M' },
  { name: 'NIFTY BANK', change: 1.25, topGainer: 'HDFCBANK', topLoser: 'INDUSINDBK', volume: '45.2M' },
  { name: 'NIFTY AUTO', change: 0.85, topGainer: 'M&M', topLoser: 'TATAMOTORS', volume: '18.1M' },
  { name: 'NIFTY PHARMA', change: -0.45, topGainer: 'SUNPHARMA', topLoser: 'CIPLA', volume: '9.2M' },
  { name: 'NIFTY METAL', change: -1.20, topGainer: 'TATASTEEL', topLoser: 'HINDALCO', volume: '22.5M' },
  { name: 'NIFTY FMCG', change: 0.15, topGainer: 'ITC', topLoser: 'HUL', volume: '15.8M' },
  { name: 'NIFTY ENERGY', change: 0.65, topGainer: 'RELIANCE', topLoser: 'ONGC', volume: '28.4M' },
  { name: 'NIFTY REALTY', change: 2.10, topGainer: 'DLF', topLoser: 'LODHA', volume: '14.5M' },
];

export default function SectorHeatmap() {
  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-accent" />
        <h3 className="font-display font-bold text-primary">Sector Performance</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SECTORS.map((sector) => {
          const isUp = sector.change >= 0;
          return (
            <div 
              key={sector.name}
              className={cn(
                "p-3 rounded-xl border relative overflow-hidden group cursor-pointer transition-all",
                isUp ? "bg-success/5 border-success/20 hover:border-success/40 hover:bg-success/10" : "bg-danger/5 border-danger/20 hover:border-danger/40 hover:bg-danger/10"
              )}
            >
              <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-xs font-bold text-primary">{sector.name}</span>
                <span className={cn("text-xs font-bold flex items-center gap-0.5", isUp ? "text-success" : "text-danger")}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(sector.change).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-tertiary">Top Gainer: <span className="text-success font-semibold">{sector.topGainer}</span></span>
                  <span className="text-[10px] text-tertiary">Top Loser: <span className="text-danger font-semibold">{sector.topLoser}</span></span>
                </div>
                <div className="text-[10px] font-mono text-tertiary">Vol: {sector.volume}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
