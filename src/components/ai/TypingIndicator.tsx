import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

export function TypingIndicator() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-4 md:gap-6"
    >
      <div className="w-8 h-8 shrink-0 rounded-full bg-surface-2 border border-border flex items-center justify-center">
        <BrainCircuit className="w-4 h-4 text-secondary" />
      </div>
      <div className="flex-1 space-y-2 min-w-0 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary">Lunar AI</span>
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Computing…</span>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-2 rounded-2xl rounded-tl-sm w-fit border border-border shadow-sm">
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-tertiary" />
        </div>
      </div>
    </motion.div>
  );
}
