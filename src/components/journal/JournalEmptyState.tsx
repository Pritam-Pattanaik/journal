import React from 'react';
import { BookOpen, Plus, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { CMD_KEY } from '../../lib/osUtils';

interface JournalEmptyStateProps {
  date: string;
  onCreateEntry: () => void;
}

export default function JournalEmptyState({ date, onCreateEntry }: JournalEmptyStateProps) {
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
          <BookOpen className="w-9 h-9 text-accent" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success/20 border border-success/30 rounded-xl flex items-center justify-center shadow-sm">
          <TrendingUp className="w-4 h-4 text-success" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-primary mb-2 tracking-tight">
        No Entry for {date}
      </h3>
      <p className="text-secondary text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Consistent journaling is the edge separating professional traders from gamblers. Document your pre-market thesis, execution quality, and post-market reflections to compound your learning.
      </p>

      {/* Feature hints row */}
      <div className="flex items-center gap-6 mb-10 text-xs text-tertiary font-medium">
        {['Market Bias', 'Execution Review', 'Psychology Tracking'].map((label, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-accent" />
            {label}
          </div>
        ))}
      </div>

      <Button
        onClick={onCreateEntry}
        className="gap-2 px-8 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        aria-label={`Create journal entry for ${date}`}
      >
        <Plus size={18} />
        Create Journal Entry
      </Button>
      <p className="text-[11px] text-tertiary mt-4 tracking-wide">
        Press <kbd className="bg-surface-2 border border-border rounded px-1.5 py-0.5 font-mono text-[10px] text-secondary">{CMD_KEY}S</kbd> to save at any time
      </p>
    </motion.div>
  );
}
