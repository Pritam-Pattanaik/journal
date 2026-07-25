import React from 'react';
import { Globe, AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';
import { Reveal } from '../ui/Motion';

export default function MarketNewsSection() {
  const volatileEvents = [
    { 
      time: '08:30 AM EST', 
      event: 'US Consumer Price Index (CPI)', 
      impact: 'High Volatility', 
      badgeClass: 'bg-red-500/15 text-red-400 border border-red-500/30', 
      observation: 'Historical slippage observed on equity indices: 14 to 22 ticks average.' 
    },
    { 
      time: '02:00 PM EST', 
      event: 'FOMC Rate Decision & Press Conference', 
      impact: 'Critical Volatility', 
      badgeClass: 'bg-red-600 text-white font-bold', 
      observation: 'Automated recommendation: Flatten open short-term futures 15 minutes prior.' 
    },
    { 
      time: '10:00 AM EST', 
      event: 'US Consumer Sentiment & Sentiment Index', 
      impact: 'Moderate Volatility', 
      badgeClass: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30', 
      observation: 'Potential liquidity sweeps around New York morning session midpoint.' 
    },
  ];

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-24 relative z-20 scroll-mt-20" aria-label="Market and News Intelligence">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        
        {/* Narrative Column */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <Reveal direction="left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-1 border border-border text-xs font-semibold text-primary mb-6 w-fit shadow-xs">
              <Globe size={14} className="text-iris" />
              <span>Macroeconomic Volatility Correlation</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
              Protect your equity during macro volatility spikes.
            </h2>
            <p className="text-secondary text-base sm:text-lg leading-relaxed mb-8 font-normal">
              Most proprietary trading account losses occur within five minutes of unexpected macroeconomic announcements. TradeVault aligns live economic event schedules with your historical executions to reveal how news spikes impact your actual fill execution.
            </p>
            
            <div className="p-5 rounded-2xl bg-surface-1/70 border border-border flex items-start gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0 mt-0.5">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-primary mb-1">Automated Pre-News Guardrails</h4>
                <p className="text-xs sm:text-sm text-secondary leading-relaxed font-normal">
                  Configure intelligent rules to halt order transmissions automatically prior to high-impact economic events like FOMC, CPI, and Non-Farm Payrolls.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Live Calendar Structured Card */}
        <div className="lg:col-span-7">
          <Reveal direction="right" delay={0.1}>
            <div className="rounded-3xl bg-surface-1/90 border border-border p-6 sm:p-8 shadow-card">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-border gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center text-iris">
                    <Calendar size={18} />
                  </div>
                  <span className="font-display font-bold text-base text-primary">Live Economic Event Schedule</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-2 border border-border/80 text-xs font-semibold text-secondary">
                  Filter: High Impact Events
                </span>
              </div>

              <div className="space-y-4">
                {volatileEvents.map((evt, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-surface-0/80 border border-border hover:border-border-hover transition-all flex flex-col gap-3">
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                      <span className="text-xs font-semibold text-secondary">{evt.time}</span>
                      <span className={`text-xs px-3 py-0.5 rounded-full font-medium ${evt.badgeClass}`}>
                        {evt.impact}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-lg text-primary">{evt.event}</h4>
                      <p className="text-xs sm:text-sm font-normal text-secondary flex items-start sm:items-center gap-2 pt-1">
                        <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                        <span>{evt.observation}</span>
                      </p>
                    </div>

                  </div>
                ))}
              </div>

              <div className="mt-8 pt-5 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium text-tertiary">
                <span>Economic schedules sync automatically at 00:00 UTC daily.</span>
                <span className="text-secondary font-semibold">Real-Time Volatility Engine</span>
              </div>

            </div>
          </Reveal>
        </div>

      </div>

    </section>
  );
}
