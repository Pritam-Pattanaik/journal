import React, { useState } from 'react';
import { ChevronDown, Activity, Edit2, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import DisciplineRater from '../ui/DisciplineRater';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

interface TradeCardProps {
  trade: Trade;
  onEdit?: (trade: Trade) => void;
  onDelete?: (id: string) => void;
}

export default function TradeCard({ trade, onEdit, onDelete }: TradeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProfit = trade.netPnl >= 0;

  return (
    <motion.div 
      layout
      className={cn(
        "mb-4 overflow-hidden rounded-2xl border transition-all duration-300",
        isExpanded 
          ? "bg-surface shadow-xl shadow-black/5 dark:shadow-black/20 border-border" 
          : "bg-surface-1/50 backdrop-blur-sm border-border-subtle hover:border-border hover:shadow-md"
      )}
    >
      {/* Card Header / Summary */}
      <div 
        className="p-5 cursor-pointer relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Subtle gradient accent line on the left based on profit/loss */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          isProfit ? "bg-gradient-to-b from-success/50 to-success/10" : "bg-gradient-to-b from-danger/50 to-danger/10"
        )} />

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
            <span className={cn(
              "font-mono text-xl font-bold tracking-tight drop-shadow-sm", 
              isProfit ? 'text-success' : 'text-danger'
            )}>
              {isProfit ? '+' : ''}{formatCurrency(trade.netPnl)}
            </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
                trade.direction === 'LONG' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
              )}>
                {trade.direction}
              </span>
              {trade.mistakes && trade.mistakes.length > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-warning/10 text-warning border-warning/20">
                  {trade.mistakes.length} Mistake{trade.mistakes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Status</p>
              <p className="font-mono text-secondary uppercase text-[10px]">{trade.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DisciplineRater 
              value={trade.disciplineScore} 
              rawScore={trade.disciplineRawScore}
              confidence={trade.confidence}
              tradingStyle={trade.tradingStyle}
              breakdown={trade.disciplineBreakdown}
              signals={trade.disciplineSignals}
              reasons={trade.disciplineReasons}
              compact 
            />
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
            className="overflow-hidden bg-surface-2/30 border-t border-border-subtle backdrop-blur-md"
          >
            <div className="p-5 space-y-6">
              {/* Execution Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-surface-1 rounded-xl border border-border-subtle">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Gross P&L</p>
                  <p className={cn("text-base font-mono font-bold tracking-tight", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                  </p>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-border-subtle">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Charges</p>
                  <p className="text-base font-mono font-bold text-danger tracking-tight">
                    -{formatCurrency(trade.charges)}
                  </p>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-border-subtle">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Strategy</p>
                  <p className="text-sm font-medium text-primary truncate">
                    {trade.strategyName || '-'}
                  </p>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-border-subtle">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Direction</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border inline-block mt-0.5",
                    trade.direction === 'LONG' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                  )}>
                    {trade.direction}
                  </span>
                </div>
                <div className="p-3 bg-surface-1 rounded-xl border border-border-subtle">
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Stop Loss</p>
                  <p className="text-sm font-medium text-primary truncate">
                    {trade.stopLoss ? formatCurrency(trade.stopLoss) : '-'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Setup Notes
                  </h4>
                  <p className="text-sm text-tertiary leading-relaxed bg-surface-2 p-3 rounded-xl border border-border-subtle">
                    {trade.setupDescription || 'No setup description provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Learnings
                  </h4>
                  <p className="text-sm text-tertiary leading-relaxed bg-surface-2 p-3 rounded-xl border border-border-subtle">
                    {trade.learnings || 'No post-trade learnings recorded.'}
                  </p>
                </div>
                {trade.mistakes && trade.mistakes.length > 0 && (
                  <div>
                    <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-warning" />
                      Mistakes
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {trade.mistakes.map(m => (
                        <span key={m} className="px-2 py-1 rounded-md text-[11px] bg-warning/10 text-warning font-medium border border-warning/20">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                {onEdit && (
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => onEdit(trade)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button variant="danger" className="flex-1 justify-center bg-danger/10 text-danger hover:bg-danger/20 border-danger/20" onClick={() => onDelete(trade.id)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
