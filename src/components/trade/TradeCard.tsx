import React, { useState } from 'react';
import { ChevronDown, Activity, Edit2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import DisciplineRater from '../ui/DisciplineRater';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

interface TradeCardProps {
  trade: Trade;
  onEdit?: (trade: Trade) => void;
}

export default function TradeCard({ trade, onEdit }: TradeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProfit = trade.netPnl >= 0;

  return (
    <div className="glass-panel bg-surface-1 rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/5 mb-4">
      {/* Card Header / Summary */}
      <div 
        className="p-5 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-lg text-primary tracking-tight">{trade.symbol}</span>
              {trade.isCarryForward && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider text-warning bg-warning/10 border border-warning/20 uppercase">
                  CF
                </span>
              )}
            </div>
            <p className="text-xs text-tertiary">{formatDate(trade.date)}</p>
          </div>
          <div className="text-right">
            <span className={cn("font-mono text-lg font-bold tracking-tight", isProfit ? 'text-success' : 'text-danger')}>
              {isProfit ? '+' : ''}{formatCurrency(trade.netPnl)}
            </span>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-secondary">
                {trade.market}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Entry</p>
              <p className="font-mono text-secondary">{trade.entryPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Exit</p>
              <p className="font-mono text-secondary">{trade.exitPrice.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trade.disciplineScore != null && (
              <DisciplineRater value={trade.disciplineScore} />
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronDown className="w-4 h-4 text-tertiary" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden bg-surface-2/50 border-t border-black/5 dark:border-white/5"
          >
            <div className="p-5 space-y-6">
              {/* Execution Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-1 rounded-xl border border-black/10 dark:border-white/10">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Gross P&L</p>
                  <p className={cn("text-base font-mono font-bold tracking-tight", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                  </p>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-black/10 dark:border-white/10">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Charges</p>
                  <p className="text-base font-mono font-bold text-danger tracking-tight">
                    -{formatCurrency(trade.charges)}
                  </p>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-black/10 dark:border-white/10">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Strategy</p>
                  <p className="text-sm font-medium text-primary truncate">
                    {trade.strategyName || '-'}
                  </p>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-black/10 dark:border-white/10">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Direction</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border inline-block mt-0.5",
                    trade.direction === 'LONG' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                  )}>
                    {trade.direction}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Setup Notes
                  </h4>
                  <p className="text-sm text-tertiary leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                    {trade.setupDescription || 'No setup description provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Learnings & Mistakes
                  </h4>
                  <p className="text-sm text-tertiary leading-relaxed bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-black/5 dark:border-white/5">
                    {trade.learnings || 'No post-trade learnings recorded.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {onEdit && (
                <div className="pt-2">
                  <Button variant="secondary" className="w-full justify-center" onClick={() => onEdit(trade)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Trade
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
