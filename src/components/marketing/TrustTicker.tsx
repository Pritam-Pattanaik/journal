import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Shield, Terminal, CheckCircle2, Lock } from 'lucide-react';
import { Reveal } from '../ui/Motion';

const integrations = [
  { name: 'TradingView', badge: 'Webhook / API', color: 'text-blue-400' },
  { name: 'MetaTrader 4 & 5', badge: 'EA Auto-Sync', color: 'text-green-400' },
  { name: 'Interactive Brokers', badge: 'TWS / FIX API', color: 'text-indigo-400' },
  { name: 'Apex Trader Funding', badge: 'Drawdown Guardrail', color: 'text-gold' },
  { name: 'Tradovate', badge: 'Direct OAuth', color: 'text-purple-400' },
  { name: 'NinjaTrader', badge: 'Log Import & API', color: 'text-cyan-400' },
  { name: 'FTMO & Prop Firms', badge: 'Daily Loss Cap Sync', color: 'text-emerald-400' },
  { name: 'Zerodha & AngelOne', badge: 'Connect API', color: 'text-accent' },
];

export default function TrustTicker() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="w-full py-12 border-y border-border bg-surface-1/40 overflow-hidden relative z-20" aria-label="Supported Broker and Platform Integrations">
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <Reveal direction="up" delay={0.05}>
          <p className="text-xs font-mono-stat font-bold uppercase tracking-widest text-tertiary mb-1">
            Institutional Interoperability
          </p>
          <h2 className="text-sm font-semibold text-secondary flex items-center justify-center gap-2">
            <Lock size={14} className="text-success" />
            <span>Encrypted read-only synchronization with leading prime brokers &amp; prop funding platforms</span>
          </h2>
        </Reveal>
      </div>

      {/* ── Accessible Pause-on-Hover Marquee Ticker ── */}
      <div className="relative w-full overflow-hidden flex items-center pt-2 pb-1">
        {/* Left and Right Edge Fade Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-canvas via-canvas/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-canvas via-canvas/80 to-transparent z-10 pointer-events-none" />

        <div 
          className="flex gap-4 sm:gap-6 items-center flex-nowrap hover:[animation-play-state:paused]"
          style={
            shouldReduceMotion 
              ? { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', overflow: 'visible' }
              : { width: 'max-content', animation: 'marquee 40s linear infinite' }
          }
        >
          {/* Duplicate list twice for unbroken looping */}
          {[...integrations, ...integrations, ...(shouldReduceMotion ? [] : integrations)].map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-0 border border-border shadow-xs shrink-0 hover:border-iris/40 hover:bg-surface-1 transition-all group"
            >
              <Terminal size={15} className="text-tertiary group-hover:text-primary transition-colors" />
              <span className="font-display font-bold text-sm text-primary tracking-tight">{item.name}</span>
              <span className="text-[11px] font-mono-stat font-medium px-2 py-0.5 rounded-md bg-surface-2 text-secondary">
                {item.badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Internal stylesheet for GPU accelerated marquee translation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.3333%, 0, 0); }
        }
      `}</style>
    </section>
  );
}
