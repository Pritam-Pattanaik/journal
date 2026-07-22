import React from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Users, TrendingUp } from 'lucide-react';

const BREADTH_DATA = {
  advances: 1250,
  declines: 840,
  unchanged: 120,
  newHighs: 45,
  newLows: 12,
  fiiNet: '+1,245.50',
  diiNet: '-450.20',
};

export default function MarketBreadth() {
  const total = BREADTH_DATA.advances + BREADTH_DATA.declines;
  const advancePct = (BREADTH_DATA.advances / total) * 100;
  const declinePct = (BREADTH_DATA.declines / total) * 100;
  const ratio = (BREADTH_DATA.advances / BREADTH_DATA.declines).toFixed(2);

  return (
    <div className="card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-accent" />
        <h3 className="font-display font-bold text-primary">Market Breadth</h3>
      </div>

      {/* A/D Ratio */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-semibold text-secondary">A/D Ratio: <span className="text-primary font-bold">{ratio}</span></span>
          <span className="text-xs text-tertiary">Total Traded: {total}</span>
        </div>
        
        {/* Breadth Bar */}
        <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden flex">
          <div className="h-full bg-success transition-all duration-1000" style={{ width: `${advancePct}%` }} />
          <div className="h-full bg-danger transition-all duration-1000" style={{ width: `${declinePct}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs font-bold">
          <div className="flex items-center gap-1 text-success">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {BREADTH_DATA.advances} Advancing
          </div>
          <div className="flex items-center gap-1 text-danger">
            {BREADTH_DATA.declines} Declining
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-surface-1 rounded-xl border border-border">
          <span className="text-[10px] uppercase font-bold tracking-widest text-tertiary block mb-1">52W Highs</span>
          <span className="text-lg font-bold text-success flex items-center gap-1">
            <TrendingUp className="w-4 h-4" /> {BREADTH_DATA.newHighs}
          </span>
        </div>
        <div className="p-3 bg-surface-1 rounded-xl border border-border">
          <span className="text-[10px] uppercase font-bold tracking-widest text-tertiary block mb-1">52W Lows</span>
          <span className="text-lg font-bold text-danger flex items-center gap-1">
            <TrendingUp className="w-4 h-4 rotate-180" /> {BREADTH_DATA.newLows}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-tertiary" />
          <span className="text-xs font-bold uppercase tracking-widest text-secondary">Institutional Flow (Cr)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-between items-center p-2.5 bg-success/5 border border-success/20 rounded-lg">
            <span className="text-xs font-bold text-success">FII</span>
            <span className="text-sm font-mono font-bold text-success">{BREADTH_DATA.fiiNet}</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-danger/5 border border-danger/20 rounded-lg">
            <span className="text-xs font-bold text-danger">DII</span>
            <span className="text-sm font-mono font-bold text-danger">{BREADTH_DATA.diiNet}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
