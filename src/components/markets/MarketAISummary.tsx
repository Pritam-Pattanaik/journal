import React from 'react';
import { Brain, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';

interface MarketAISummaryProps {
  type: 'daily-brief' | 'market-summary';
}

export default function MarketAISummary({ type }: MarketAISummaryProps) {
  const isBrief = type === 'daily-brief';

  return (
    <div className="relative p-1 rounded-2xl bg-gradient-to-br from-accent/20 via-surface-1 to-surface-1">
      <div className="bg-surface-0 rounded-xl p-6 h-full border border-accent/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
            <Brain className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-primary flex items-center gap-2">
              {isBrief ? 'AI Morning Briefing' : "Today's Market Summary"}
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            </h3>
            <p className="text-xs text-tertiary mt-0.5">Contextual intelligence processed in real-time</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm md:text-[15px] leading-relaxed text-secondary font-medium">
            {isBrief ? (
              "Markets are opening with cautious optimism following the US inflation data release. IT sector shows resilience despite global headwinds, while Banking remains under pressure due to margin concerns."
            ) : (
              "The broader market exhibited strong bullish momentum, led primarily by the IT and Energy sectors. Small and Mid-cap indices outperformed the benchmark, indicating strong retail participation."
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-3 bg-surface-1 rounded-xl border border-border">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-success mb-2">
                <TrendingUp className="w-3.5 h-3.5" /> Strong Sectors
              </span>
              <p className="text-sm font-semibold text-primary">Information Technology, Energy, Automobiles</p>
            </div>
            
            <div className="p-3 bg-surface-1 rounded-xl border border-border">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning mb-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Weak Sectors
              </span>
              <p className="text-sm font-semibold text-primary">Financial Services, FMCG, Pharma</p>
            </div>
          </div>

          {!isBrief && (
            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex flex-wrap gap-4 text-xs font-semibold">
                <div className="flex flex-col">
                  <span className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Market Breadth</span>
                  <span className="text-success">Positive (1.5:1)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Volatility</span>
                  <span className="text-primary">Decreasing (VIX -3.2%)</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-tertiary uppercase tracking-widest mb-0.5">Liquidity</span>
                  <span className="text-primary">Above Average</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
