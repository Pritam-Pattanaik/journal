import React from 'react';
import { Target, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { CMD_KEY } from '../../lib/osUtils';

interface TradeEmptyStateProps {
  onAddTrade: () => void;
}

export default function TradeEmptyState({ onAddTrade }: TradeEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6"
      role="status"
    >
      {/* Icon cluster with layered depth */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-surface-2 to-surface-1 rounded-3xl flex items-center justify-center shadow-xl border border-white/5">
          <Target className="w-9 h-9 text-iris" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-warning/20 border border-warning/30 rounded-xl flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-4 h-4 text-warning" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-primary mb-2 tracking-tight">
        No Trades Logged
      </h3>
      <p className="text-secondary text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Start building your institutional execution ledger. Log your entries, exits, and psychological state to uncover your quantitative trading edge over time.
      </p>

      {/* Feature hints row */}
      <div className="flex items-center gap-6 mb-10 text-xs text-tertiary font-medium">
        {['Entry & Exit Data', 'Discipline Scoring', 'Strategy Tagging'].map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-iris" />
            {label}
          </div>
        ))}
      </div>

      <Button
        onClick={onAddTrade}
        variant="iris"
        className="gap-2 px-8 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        aria-label="Log a new trade"
      >
        <Plus size={18} />
        Log Execution
      </Button>
      <p className="text-[11px] text-tertiary mt-4 tracking-wide">
        Press <kbd className="bg-surface-2 border border-border rounded px-1.5 py-0.5 font-mono text-[10px] text-secondary">{CMD_KEY}T</kbd> to log from anywhere
      </p>
    </motion.div>
  );
}
