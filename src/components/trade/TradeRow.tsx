import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Activity, Edit2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import DisciplineRater from '../ui/DisciplineRater';
import { TableRow, TableCell } from '../ui/Table';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

interface TradeRowProps {
  trade: Trade;
  onEdit?: (trade: Trade) => void;
}

export default function TradeRow({ trade, onEdit }: TradeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isProfit = trade.netPnl >= 0;

  return (
    <>
      <TableRow
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "cursor-pointer group transition-all duration-300",
          isExpanded ? "bg-surface-2 border-b-transparent" : "hover:bg-surface-2"
        )}
      >
        <TableCell className="text-tertiary">
          {formatDate(trade.date)}
        </TableCell>
        
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary tracking-tight">
              {trade.symbol}
            </span>
            {trade.isCarryForward && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded uppercase">
                CF
              </span>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-secondary">
              {trade.market}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border",
              trade.direction === 'LONG' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
            )}>
              {trade.direction}
            </span>
          </div>
        </TableCell>

        <TableCell className="text-secondary text-sm font-medium max-w-[120px] truncate">
          {trade.strategyName || '-'}
        </TableCell>

        <TableCell className="text-secondary font-mono text-sm">
          {trade.entryPrice.toFixed(2)}
        </TableCell>

        <TableCell className="text-secondary font-mono text-sm">
          {trade.exitPrice.toFixed(2)}
        </TableCell>

        <TableCell className={cn("font-mono text-sm font-bold", isProfit ? 'text-success' : 'text-danger')}>
          {isProfit ? '+' : ''}
          {formatCurrency(trade.netPnl)}
        </TableCell>

        <TableCell>
          {trade.disciplineScore != null ? (
            <DisciplineRater value={trade.disciplineScore} />
          ) : (
            <span className="text-tertiary text-xs uppercase tracking-widest font-bold">Unrated</span>
          )}
        </TableCell>

        <TableCell className="text-right">
          <div className="flex items-center justify-end">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronRight className="h-4 w-4 text-tertiary group-hover:text-primary transition-colors" />
            </motion.div>
          </div>
        </TableCell>
      </TableRow>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <TableRow className="bg-surface-2/50 border-b border-black/5 dark:border-white/5 hover:bg-surface-2/50">
            <TableCell colSpan={9} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-8">
                  
                  {/* Left Column: Metrics & Timeline */}
                  <div className="flex-1 space-y-8">
                    {/* Compact Execution Strip */}
                    <div className="flex flex-wrap gap-4 md:gap-8 items-center p-4 rounded-xl bg-surface-1 border border-black/10 dark:border-white/10 shadow-sm">
                      <div>
                        <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Gross P&L</p>
                        <p className={cn("text-lg font-mono font-bold tracking-tight", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-black/10 dark:bg-white/10 hidden md:block" />
                      <div>
                        <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Charges</p>
                        <p className="text-lg font-mono font-bold text-danger tracking-tight">
                          -{formatCurrency(trade.charges)}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-black/10 dark:bg-white/10 hidden md:block" />
                      <div>
                        <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Quantity</p>
                        <p className="text-lg font-mono font-bold text-primary tracking-tight">
                          {trade.quantity}
                        </p>
                      </div>
                      {onEdit && (
                        <div className="ml-auto">
                          <Button variant="secondary" size="sm" onClick={() => onEdit(trade)} className="h-8">
                            <Edit2 className="w-3.5 h-3.5 mr-2" />
                            Edit Trade
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Tags & Setup */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5" />
                          Setup Notes
                        </h4>
                        <p className="text-sm text-tertiary leading-relaxed">
                          {trade.setupDescription || 'No setup description provided.'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[11px] text-secondary font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Learnings & Mistakes
                        </h4>
                        <p className="text-sm text-tertiary leading-relaxed">
                          {trade.learnings || 'No post-trade learnings recorded.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column: AI / Details */}
                  <div className="xl:w-[350px] shrink-0 space-y-6">
                    <div className="p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-4">
                      <div>
                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1.5">Mental State</p>
                        {trade.mindset ? (
                          <div className="inline-block px-3 py-1 bg-surface-1 rounded-md text-sm text-primary font-medium border border-black/10 dark:border-white/10 shadow-sm">
                            {trade.mindset}
                          </div>
                        ) : (
                          <p className="text-xs text-tertiary italic">Not recorded</p>
                        )}
                      </div>
                      
                      <hr className="border-black/5 dark:border-white/5" />
                      
                      <div>
                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1.5">Decision Logic</p>
                        <p className="text-sm text-secondary leading-relaxed">
                          {trade.decisionNotes || 'No decision logic provided.'}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  );
}
