import React from 'react';
import { Shield, Zap, RefreshCw, Layers, Brain, Lock, CheckCircle, BarChart, Sliders } from 'lucide-react';
import { Reveal, HoverLift } from '../ui/Motion';

export default function BentoGridSection() {
  return (
    <section id="features" className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-20 relative z-20 scroll-mt-24" aria-label="Core Technical Pillars">
      
      {/* Chapter Title Bar */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <Reveal direction="up">
          <p className="text-xs font-mono-stat font-bold uppercase tracking-widest text-iris mb-2.5">
            Institutional Discipline Engine
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
            Engineered to defend your capital against psychological error.
          </h2>
          <p className="text-base sm:text-lg text-secondary leading-relaxed">
            Standard retail tools record what you traded after the fact. TradeVault enforces positive expectancy in real-time before you pull the trigger.
          </p>
        </Reveal>
      </div>

      {/* ── Asymmetric Bento Modular Grid Architecture ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        
        {/* BENTO BOX 1 (Large 2-Col Span): Automated Daily Drawdown Lockout */}
        <div className="md:col-span-2 lg:col-span-2 card p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group border-border hover:border-iris/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-danger/10 rounded-full blur-3xl -z-10 group-hover:bg-danger/15 transition-colors" />
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-danger/15 border border-danger/30 flex items-center justify-center text-danger mb-6 shadow-xs">
              <Lock size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-mono-stat font-extrabold uppercase tracking-wider text-danger px-2.5 py-1 rounded bg-danger/10 border border-danger/20 inline-block mb-3">
              PROP FIRM PROTECTION PROTOCOL
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-3 tracking-tight">
              Automated Daily Drawdown Guardrails
            </h3>
            <p className="text-sm sm:text-base text-secondary leading-relaxed max-w-xl mb-8">
              Set maximum daily loss thresholds modeled directly on FTMO and Apex rules. When your daily stop-out barrier is triggered, TradeVault instantly blocks further API order transmissions to prevent tilt and revenge trading spirals.
            </p>
          </div>

          {/* Visual Interactive Proof Container */}
          <div className="w-full p-4 rounded-xl bg-surface-1 border border-border flex items-center justify-between text-xs sm:text-sm font-mono-stat">
            <span className="flex items-center gap-2 text-danger font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
              DAILY LOSS LIMIT HIT (-$2,000)
            </span>
            <span className="px-3 py-1 rounded-lg bg-surface-0 text-primary font-extrabold border border-border">
              STATUS: TRADING LOCKED (24H)
            </span>
          </div>
        </div>

        {/* BENTO BOX 2 (2-Col Span): Automatic Broker Synchronization */}
        <div className="md:col-span-1 lg:col-span-2 card p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden group border-border hover:border-accent/40 transition-all duration-300">
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10 group-hover:bg-accent/15 transition-colors" />
          
          <div>
            <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mb-6 shadow-xs">
              <RefreshCw size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-mono-stat font-extrabold uppercase tracking-wider text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20 inline-block mb-3">
              ZERO SPREADSHEET FATIGUE
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-3 tracking-tight">
              Sub-second Broker &amp; Prop Account Sync
            </h3>
            <p className="text-sm sm:text-base text-secondary leading-relaxed max-w-xl mb-8">
              Connect your MetaTrader, Interactive Brokers, Apex, or Tradovate credentials in seconds. TradeVault parses every trade fill, slippage delta, and execution fee automatically with zero manual entry required.
            </p>
          </div>

          {/* Integration Status Bar */}
          <div className="w-full grid grid-cols-3 gap-2 text-center text-xs font-mono-stat font-bold text-tertiary">
            <div className="p-2.5 rounded-xl bg-surface-1 border border-border text-primary">MT4 &amp; MT5 SYNC</div>
            <div className="p-2.5 rounded-xl bg-surface-1 border border-border text-primary">APEX TRADERS</div>
            <div className="p-2.5 rounded-xl bg-surface-1 border border-border text-primary">ZERODHA &amp; ANGEL</div>
          </div>
        </div>

        {/* BENTO BOX 3 (1-Col Span): Automated Setup Tagging */}
        <div className="md:col-span-1 lg:col-span-1 card p-7 flex flex-col justify-between border-border hover:border-iris/40 transition-all duration-300">
          <div>
            <div className="w-11 h-11 rounded-xl bg-iris/15 border border-iris/30 flex items-center justify-center text-iris mb-5 shadow-xs">
              <Layers size={22} strokeWidth={2.5} />
            </div>
            <h3 className="font-display text-xl font-bold text-primary mb-2">
              Automated Setup Attribution &amp; Tagging
            </h3>
            <p className="text-sm text-secondary leading-relaxed">
              Our pattern recognition engine automatically categorizes your fills by setup type: Opening Gap Reversal, Breakout, VWAP Bounce, or Order Block Mitigation.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-border/60 text-[11px] font-mono-stat font-semibold text-iris">
            <span className="px-2 py-1 rounded bg-surface-1 border border-border">#OPENING_RANGE</span>
            <span className="px-2 py-1 rounded bg-surface-1 border border-border">#VWAP_REVERSAL</span>
            <span className="px-2 py-1 rounded bg-surface-1 border border-border">#LIQUIDITY_SWEEP</span>
          </div>
        </div>

        {/* BENTO BOX 4 (2-Col Span): R:R Expectancy Mathematics */}
        <div className="md:col-span-2 lg:col-span-2 card p-7 flex flex-col justify-between border-border hover:border-success/40 transition-all duration-300">
          <div>
            <div className="w-11 h-11 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center text-success mb-5 shadow-xs">
              <BarChart size={22} strokeWidth={2.5} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-xl font-bold text-primary">
                Verified R:R Expectancy Calculation
              </h3>
              <span className="text-xs font-mono-stat font-bold text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                EXPECTANCY: +1.8R
              </span>
            </div>
            <p className="text-sm text-secondary leading-relaxed max-w-xl">
              Win rate is a vanity metric; expectancy is what keeps you funded. TradeVault isolates which setups yield positive mathematical edge and which specific time-of-day execution windows are steadily draining your accounts.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-surface-1 border border-border flex items-center justify-between text-xs font-mono-stat text-secondary">
            <span>AVOID 09:30 AM OPEN VOLATILITY (+14% WIN RATE DELTA)</span>
            <span className="font-bold text-primary">VERIFIED ALGORITHMIC EDGE</span>
          </div>
        </div>

        {/* BENTO BOX 5 (1-Col Span): Zero Cloud Data Leakage */}
        <div className="md:col-span-1 lg:col-span-1 card p-7 flex flex-col justify-between border-border hover:border-gold/40 transition-all duration-300">
          <div>
            <div className="w-11 h-11 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold mb-5 shadow-xs">
              <Shield size={22} strokeWidth={2.5} />
            </div>
            <h3 className="font-display text-xl font-bold text-primary mb-2">
              Read-Only Bank-Grade Encryption
            </h3>
            <p className="text-sm text-secondary leading-relaxed">
              We connect exclusively via OAuth and Read-Only API keys. We cannot initiate orders or withdraw capital under any technical circumstance.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-mono-stat font-bold text-gold pt-4 border-t border-border/60">
            <CheckCircle size={14} className="text-gold" />
            <span>SOC-2 TYPE II AUDIT READY</span>
          </div>
        </div>

      </div>

    </section>
  );
}
