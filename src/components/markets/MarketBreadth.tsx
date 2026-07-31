/**
 * MarketBreadth — A/D ratio, 52W highs/lows, institutional flows
 * Note: Real NSE breadth data requires SEBI API subscription.
 * Values shown are illustrative estimates based on current market conditions.
 */
import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Users, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useLiveMarketData } from '../../hooks/useLiveMarketData';

const BREADTH_DATA = {
  advances: 1250,
  declines: 840,
  unchanged: 120,
  newHighs: 45,
  newLows: 12,
  fiiNet: '+1,245.50',
  diiNet: '-450.20',
};

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div
      className="h-full rounded-full transition-all duration-1000 ease-out"
      style={{ width: `${width}%`, background: color }}
    />
  );
}

export default function MarketBreadth() {
  const { data: quotes } = useLiveMarketData();

  const total = BREADTH_DATA.advances + BREADTH_DATA.declines;
  const advancePct = (BREADTH_DATA.advances / total) * 100;
  const declinePct = (BREADTH_DATA.declines / total) * 100;
  const ratio = (BREADTH_DATA.advances / BREADTH_DATA.declines).toFixed(2);

  // Determine market mood from live quotes
  const bullishQuotes = quotes.filter(q => q.pct > 0).length;
  const moodLabel = bullishQuotes >= quotes.length * 0.6 ? 'Bullish' : bullishQuotes <= quotes.length * 0.4 ? 'Bearish' : 'Mixed';
  const moodColor = moodLabel === 'Bullish' ? '#10b981' : moodLabel === 'Bearish' ? '#ef4444' : '#f59e0b';

  return (
    <div className="flex flex-col h-fit bg-surface-1/50 rounded-2xl border border-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-400" />
          <h3 className="text-[14px] font-bold text-white/90">Market Breadth</h3>
        </div>
        {/* Live mood from our quotes */}
        {quotes.length > 0 && (
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
            style={{ background: `${moodColor}18`, color: moodColor, border: `1px solid ${moodColor}30` }}
          >
            {moodLabel}
          </span>
        )}
      </div>

      {/* A/D Ratio */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-0.5">A/D Ratio</p>
            <p className="text-[22px] font-bold tabular-nums text-white/85">{ratio}</p>
          </div>
          <p className="text-[11px] text-white/30 mb-1">Total: {total.toLocaleString()}</p>
        </div>

        {/* Segmented bar */}
        <div className="h-2 w-full rounded-full overflow-hidden flex gap-1 bg-surface-2 mb-3">
          <AnimatedBar pct={advancePct} color="linear-gradient(90deg, #059669, #10b981)" />
          <AnimatedBar pct={declinePct} color="linear-gradient(90deg, #ef4444, #dc2626)" />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-success">
            <ArrowUpRight size={14} />
            {BREADTH_DATA.advances.toLocaleString()} Adv
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-danger">
            {BREADTH_DATA.declines.toLocaleString()} Dec
            <ArrowDownRight size={14} />
          </div>
        </div>
      </div>

      {/* 52W Highs / Lows */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-success/10 rounded-xl border border-success/20">
          <p className="text-[9px] uppercase font-bold tracking-wider text-success mb-1 opacity-80">52W Highs</p>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-success" />
            <span className="text-[20px] font-bold text-success tabular-nums">{BREADTH_DATA.newHighs}</span>
          </div>
        </div>
        <div className="p-3 bg-danger/10 rounded-xl border border-danger/20">
          <p className="text-[9px] uppercase font-bold tracking-wider text-danger mb-1 opacity-80">52W Lows</p>
          <div className="flex items-center gap-1.5">
            <TrendingDown size={14} className="text-danger" />
            <span className="text-[20px] font-bold text-danger tabular-nums">{BREADTH_DATA.newLows}</span>
          </div>
        </div>
      </div>

      {/* Institutional Flow */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users size={12} className="text-white/30" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Institutional Flow (₹ Cr)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col p-3 bg-success/10 rounded-xl border border-success/20">
            <span className="text-[10px] font-bold text-success mb-1 opacity-90">FII Net</span>
            <span className="text-[15px] font-mono font-bold text-success tabular-nums">{BREADTH_DATA.fiiNet}</span>
          </div>
          <div className="flex flex-col p-3 bg-danger/10 rounded-xl border border-danger/20">
            <span className="text-[10px] font-bold text-danger mb-1 opacity-90">DII Net</span>
            <span className="text-[15px] font-mono font-bold text-danger tabular-nums">{BREADTH_DATA.diiNet}</span>
          </div>
        </div>
      </div>

      {/* Data note */}
      <div className="flex items-start gap-1.5 mt-4 opacity-50">
        <Info size={10} className="text-white/40 flex-shrink-0 mt-0.5" />
        <p className="text-[9px] text-white/30 leading-relaxed">
          Breadth data is illustrative. Live NSE A/D data requires SEBI data subscription.
        </p>
      </div>
    </div>
  );
}
