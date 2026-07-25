import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { TrendingUp, Shield, Lock, Star, CheckCircle2, Zap, Terminal } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const VERIFIED_PROOF = {
  quote: "TradeVault's automated daily loss guardrail saved my funded account twice last month during volatile CPI announcements. It is essential software.",
  author: "Vikram Mehta",
  role: "Funded Futures Speculator ($400k Allocation)",
  metric: "0 Daily Loss Breaches in 180 Days"
};

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen w-full bg-canvas text-primary font-sans selection:bg-iris/25">

      {/* ── Left Panel — Institutional Showcase (Desktop Only) ── */}
      <div className="hidden lg:flex w-[48%] max-w-[620px] flex-col justify-between relative overflow-hidden bg-surface-1 border-r border-border p-12 lg:p-14">
        {/* Zero-CPU Ambient CSS Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-iris/15 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(242,246,254,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(242,246,254,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 outline-none focus-ring w-fit rounded-xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-iris flex items-center justify-center shadow-md text-white font-bold">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-extrabold tracking-tight text-primary">TradeVault</span>
              <span className="text-[10px] font-mono-stat font-bold px-2 py-0.5 rounded bg-iris/15 text-iris border border-iris/25 uppercase tracking-wider">
                v2.0 PRO
              </span>
            </div>
          </Link>
        </div>

        {/* Middle Core Value Prop & Audited Quote */}
        <div className="relative z-10 my-auto py-10 space-y-8">
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border text-xs font-mono-stat font-bold text-success">
              <Zap size={13} className="text-success" />
              <span>SUB-SECOND BROKER INTEGRATION READY</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-primary tracking-tight leading-[1.08]">
              Discipline over dopamine.
            </h1>
            <p className="text-base text-secondary leading-relaxed font-normal">
              Join quantitative speculators and funded prop firm traders utilizing mathematically verified R:R expectancy and real-time behavioral guardrails.
            </p>
          </div>

          {/* Institutional Testimonial Card */}
          <div className="p-6 rounded-2xl bg-surface-0 border border-border shadow-card relative overflow-hidden group hover:border-iris/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" strokeWidth={0} />)}
              </div>
              <span className="text-[11px] font-mono-stat font-extrabold px-2 py-0.5 rounded bg-success/15 text-success border border-success/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> AUDIT VERIFIED
              </span>
            </div>
            
            <p className="text-sm font-medium text-primary leading-relaxed italic mb-5">
              "{VERIFIED_PROOF.quote}"
            </p>

            <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-display font-bold text-sm text-primary">{VERIFIED_PROOF.author}</p>
                <p className="text-xs text-tertiary">{VERIFIED_PROOF.role}</p>
              </div>
              <span className="text-xs font-mono-stat font-extrabold text-iris bg-surface-2 px-2.5 py-1 rounded border border-border">
                {VERIFIED_PROOF.metric}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 pt-6 border-t border-border/60 flex items-center justify-between text-xs font-mono-stat text-tertiary">
          <span className="flex items-center gap-1.5"><Lock size={13} className="text-success" /> 256-BIT SOC-2 VAULT</span>
          <span className="flex items-center gap-1.5"><Terminal size={13} className="text-iris" /> READ-ONLY BROKER OAUTH</span>
        </div>
      </div>

      {/* ── Right Panel — Interactive Auth Form ── */}
      <div className="flex-1 flex flex-col relative bg-canvas items-center justify-center p-6 sm:p-12 min-h-screen">
        
        {/* Mobile Header Logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center justify-between w-[calc(100%-3rem)]">
          <Link to="/" className="flex items-center gap-2.5 outline-none focus-ring rounded-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-iris flex items-center justify-center text-white font-bold shadow-sm">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-extrabold tracking-tight text-primary">TradeVault</span>
          </Link>
        </div>

        <div className="w-full max-w-[420px] relative z-10 py-12 lg:py-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-8 text-center sm:text-left">
                <h2 className="font-display text-3xl font-extrabold text-primary tracking-tight mb-2">{title}</h2>
                <p className="text-base text-secondary">{subtitle}</p>
              </div>
              
              {children}

              {/* Trust & Legal Footer */}
              <div className="mt-12 pt-6 border-t border-border flex items-center justify-between text-[12px] font-semibold text-tertiary">
                <span className="flex items-center gap-1.5">
                  <Lock size={14} className="text-success" />
                  <span>256-Bit TLS Encryption</span>
                </span>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms of Execution ↗</Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
