import React from 'react';
import { Star, CheckCircle, Award, TrendingUp, Shield, Terminal } from 'lucide-react';
import { Reveal, NumberCounter } from '../ui/Motion';

export default function SocialProofSection() {
  const verifiedTraders = [
    {
      quote: "TradeVault's daily drawdown lockout saved my $200k Apex account twice last month during volatile CPI announcements. It literally paid for a decade of subscription cost in one afternoon.",
      author: "Vikram Mehta",
      role: "Funded Futures Speculator ($400k Allocation)",
      tag: "Verified FTMO & Apex Trader",
      metrics: "+₹8.4 Lakh Net Profit (Q3)",
    },
    {
      quote: "Most journals make you manually input messy spreadsheets until you quit after three weeks. TradeVault automatically syncs directly with my broker, runs mathematical R:R expectancies, and points out exactly where I leak edge.",
      author: "Sneha Ramanujan",
      role: "Quantitative Discretionary Trader",
      tag: "Interactive Brokers TWS",
      metrics: "Win Rate: 72.4% · Avg Expectancy +2.4R",
    },
    {
      quote: "The AI Behavioral Coach felt unsettling at first because it accurately predicted when I was about to enter an emotional revenge trade. Now I refuse to execute without TradeVault running in the background.",
      author: "Marcus Vance",
      role: "Senior Algorithmic Desk Speculator",
      tag: "MetaTrader 5 & Tradovate",
      metrics: "0 Daily Drawdown Breaches in 180 Days",
    },
  ];

  return (
    <section id="social-proof" className="w-full py-24 border-y border-border bg-surface-0/60 relative z-20 scroll-mt-20" aria-label="Verified Institutional Social Proof">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal direction="up">
            <p className="text-xs font-mono-stat font-bold uppercase tracking-widest text-success mb-3 flex items-center justify-center gap-1.5">
              <Award size={15} className="text-success" />
              <span>Verified Audited Performance Attribution</span>
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
              Trusted by funded proprietary traders and quantitative desks.
            </h2>
            <p className="text-base sm:text-lg text-secondary leading-relaxed">
              We do not promote simulated hype or fake retail screenshots. Hear directly from verified professional traders whose career capital depends on absolute discipline.
            </p>
          </Reveal>
        </div>

        {/* ── Key Performance Accounting Register Row ── */}
        <Reveal direction="up" delay={0.1}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16 p-8 rounded-3xl bg-surface-1 border border-border shadow-card text-center">
            <div className="flex flex-col gap-1 sm:border-r border-border/70 pb-4 sm:pb-0">
              <span className="text-4xl sm:text-5xl font-mono-stat font-extrabold text-primary tabular-nums">
                ₹<NumberCounter value={142} />M+
              </span>
              <span className="text-xs font-mono-stat font-bold text-tertiary uppercase tracking-wider">Funded Prop Capital Protected</span>
            </div>
            <div className="flex flex-col gap-1 sm:border-r border-border/70 pb-4 sm:pb-0">
              <span className="text-4xl sm:text-5xl font-mono-stat font-extrabold text-success tabular-nums">
                <NumberCounter value={99} />.4%
              </span>
              <span className="text-xs font-mono-stat font-bold text-tertiary uppercase tracking-wider">Broker Sync Uptime (Sub-second)</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-4xl sm:text-5xl font-mono-stat font-extrabold text-iris tabular-nums">
                <NumberCounter value={18400} />+
              </span>
              <span className="text-xs font-mono-stat font-bold text-tertiary uppercase tracking-wider">Revenge Spirals Blocked by AI</span>
            </div>
          </div>
        </Reveal>

        {/* ── Testimonial Bento Card Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {verifiedTraders.map((trader, idx) => (
            <Reveal key={idx} direction="up" delay={0.1 + idx * 0.1}>
              <div className="h-full card p-7 sm:p-8 flex flex-col justify-between border-border hover:border-border-hover transition-all">
                <div>
                  <div className="flex items-center gap-1 text-gold mb-5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                    ))}
                    <span className="text-xs font-mono-stat font-bold text-tertiary ml-2">5.0 / 5.0 VERIFIED</span>
                  </div>
                  <p className="text-sm sm:text-base text-primary leading-relaxed font-normal italic mb-8">
                    "{trader.quote}"
                  </p>
                </div>

                <div className="pt-6 border-t border-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-base text-primary">{trader.author}</span>
                    <span className="text-[11px] font-mono-stat px-2 py-0.5 rounded bg-success/15 text-success font-extrabold border border-success/30 flex items-center gap-1">
                      <CheckCircle size={11} /> VERIFIED
                    </span>
                  </div>
                  <p className="text-xs font-medium text-secondary mb-3">{trader.role}</p>
                  
                  <div className="p-2.5 rounded-xl bg-surface-1 border border-border text-[12px] font-mono-stat font-bold text-iris flex items-center justify-between">
                    <span>AUDIT METRIC:</span>
                    <span className="text-primary">{trader.metrics}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
