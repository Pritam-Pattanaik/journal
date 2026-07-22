import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Shield, Lock, Star } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const TESTIMONIAL = {
  quote: "TradeVault has completely transformed my execution. The AI coach catches my emotional mistakes before they happen.",
  author: "Sarah J.",
  role: "Prop Trader"
};

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen w-full bg-surface-0 text-primary">

      {/* ── Left Panel — Brand Story (Desktop Only) ── */}
      <div className="hidden lg:flex w-[48%] flex-col relative overflow-hidden bg-surface-1 border-r border-border">
        {/* Subtle mesh background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div
            className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[140px]"
            style={{ background: 'radial-gradient(ellipse, rgba(var(--color-accent), 0.15) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, rgba(var(--color-iris), 0.12) 0%, transparent 70%)' }}
          />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
        </div>

        {/* Header / Logo */}
        <div className="relative z-10 p-12">
          <Link to="/" className="flex items-center gap-3 outline-none group w-fit">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
              <TrendingUp className="h-5 w-5 text-surface-0" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-primary">TradeVault</span>
          </Link>
        </div>

        {/* Main visual / Value Prop */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 lg:px-16 xl:px-20 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-semibold text-secondary mb-8">
              <SparklesIcon className="w-3.5 h-3.5 text-accent" />
              Next-generation trading journal
            </div>
            
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-primary tracking-tight leading-[1.1] mb-6">
              Master your trading psychology.
            </h1>
            
            <p className="text-lg text-secondary leading-relaxed mb-12">
              Log every trade, analyze your performance, and let our AI coach help you build unbreakable discipline. 
              Designed for serious traders.
            </p>

            {/* Testimonial Card */}
            <div className="p-6 rounded-2xl bg-surface-0/50 border border-border backdrop-blur-sm shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-accent to-iris rounded-l-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex gap-1 text-gold mb-3">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-[15px] font-medium text-primary leading-relaxed mb-4">
                "{TESTIMONIAL.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center font-bold text-xs text-primary">
                  {TESTIMONIAL.author.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">{TESTIMONIAL.author}</div>
                  <div className="text-[12px] text-tertiary">{TESTIMONIAL.role}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right Panel — Auth Form ── */}
      <div className="flex-1 flex flex-col relative bg-surface-0 items-center justify-center min-h-screen">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-3 outline-none">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <TrendingUp className="h-4 w-4 text-surface-0" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-primary">TradeVault</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] px-6 sm:px-8 py-12 lg:py-0 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-8 text-center sm:text-left">
                <h2 className="font-display text-[28px] font-bold text-primary tracking-tight mb-2">{title}</h2>
                <p className="text-[15px] text-secondary">{subtitle}</p>
              </div>
              
              {children}

              {/* Trust Indicators */}
              <div className="mt-10 pt-6 border-t border-border flex items-center justify-center gap-6 text-tertiary">
                <div className="flex items-center gap-2 text-[12px] font-medium">
                  <Lock size={14} className="text-secondary" />
                  Secure Auth
                </div>
                <div className="flex items-center gap-2 text-[12px] font-medium">
                  <Shield size={14} className="text-secondary" />
                  Encrypted Data
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

