import React from 'react';
import { BrainCircuit, Sparkles, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AICoach() {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-surface-0 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg px-6"
      >
        {/* Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-20 animate-pulse" />
          <div className="w-20 h-20 bg-surface-1 border border-border rounded-2xl flex items-center justify-center relative z-10 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <BrainCircuit className="w-10 h-10 text-primary" />
            <Sparkles className="w-4 h-4 text-accent absolute top-4 right-4 animate-pulse" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl md:text-4xl font-display font-bold text-primary tracking-tight mb-4">
          Lunar AI v2.0
        </h1>
        <p className="text-[15px] md:text-[17px] text-secondary leading-relaxed mb-10 max-w-md">
          We are upgrading our institutional AI advisory models to provide deeper quantitative analysis, behavioral pattern recognition, and precise risk management coaching.
        </p>

        {/* Status Badge */}
        <div className="flex items-center gap-3 px-6 py-3 bg-surface-1 border border-border rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] font-semibold tracking-wider text-primary uppercase">
            Training in progress
          </span>
          <Clock className="w-4 h-4 text-tertiary ml-1" />
        </div>
      </motion.div>
    </div>
  );
}
