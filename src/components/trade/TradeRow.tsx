import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Activity, Edit2, AlertCircle, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../../types';
import { formatCurrency } from '../../lib/analytics';
import DisciplineRater from '../ui/DisciplineRater';
import { TableRow, TableCell } from '../ui/Table';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

interface TradeRowProps {
  trade: Trade;
  onEdit?: (trade: Trade) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onUpdateTrade?: (id: string, updates: Partial<Trade>) => Promise<void>;
}

export default function TradeRow({ trade, onEdit, isSelected, onToggleSelect, onUpdateTrade }: TradeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [strategyInput, setStrategyInput] = useState(trade.strategyName || '');
  
  const [isSuccess, setIsSuccess] = useState(false);
  const strategyInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isProfit = trade.netPnl >= 0;

  useEffect(() => {
    if (isEditingStrategy && strategyInputRef.current) {
      strategyInputRef.current.focus();
      strategyInputRef.current.select();
    }
  }, [isEditingStrategy]);

  const handleStrategySave = async () => {
    const trimmed = strategyInput.trim();
    if (trimmed !== trade.strategyName && onUpdateTrade) {
      await onUpdateTrade(trade.id, { strategyName: trimmed });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1500);
    }
    setIsEditingStrategy(false);
  };

  const handleStrategyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleStrategySave();
    } else if (e.key === 'Escape') {
      setIsEditingStrategy(false);
      setStrategyInput(trade.strategyName || '');
    }
  };


  return (
    <>
      <TableRow
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "cursor-pointer group transition-all duration-300",
          isExpanded ? "bg-surface-2 border-b-transparent" : "hover:bg-surface-2"
        )}
      >
        <TableCell onClick={e => e.stopPropagation()} className="align-middle">
          <div className="flex items-center h-full">
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={onToggleSelect}
              className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
          </div>
        </TableCell>
        
        <TableCell className="whitespace-nowrap">
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-surface-2/80 border border-border-subtle text-primary shadow-sm">
              {trade.market}
            </span>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm",
              trade.direction === 'LONG' ? "bg-success/15 text-success border-success/30" : "bg-danger/15 text-danger border-danger/30"
            )}>
              {trade.direction}
            </span>
          </div>
        </TableCell>

        <TableCell 
          className="text-secondary text-sm font-medium max-w-[120px] truncate cursor-pointer group/strategy"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingStrategy(true);
          }}
        >
          {isEditingStrategy ? (
            <input
              ref={strategyInputRef}
              type="text"
              value={strategyInput}
              onChange={e => setStrategyInput(e.target.value)}
              onBlur={handleStrategySave}
              onKeyDown={handleStrategyKeyDown}
              className="w-full h-6 px-1 py-0 text-sm bg-surface text-primary border border-accent rounded outline-none focus:ring-2 focus:ring-accent/50"
            />
          ) : trade.strategyName ? (
            <span className="text-secondary group-hover/strategy:text-primary transition-colors">{trade.strategyName}</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded border border-dashed border-border-subtle/40 text-[10px] font-bold uppercase tracking-widest text-secondary/30 group-hover:text-secondary group-hover:border-border-subtle transition-colors">
              + Add Strategy
            </span>
          )}
        </TableCell>

        <TableCell className="text-secondary font-mono text-sm">
          {trade.entryPrice.toFixed(2)}
        </TableCell>

        <TableCell className="text-secondary font-mono text-sm">
          {trade.exitPrice.toFixed(2)}
        </TableCell>

        <TableCell className={cn("font-mono text-sm font-bold tabular-nums text-right pr-6", isProfit ? 'text-success' : 'text-danger')}>
          {isProfit ? '+' : ''}
          {formatCurrency(trade.netPnl)}
        </TableCell>

        <TableCell 
          className="relative group/rating"
        >
          <div className="inline-block p-1 rounded">
            <DisciplineRater value={trade.disciplineScore} />
          </div>
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
          <TableRow className="bg-surface-2/50 border-b border-border-subtle hover:bg-surface-2/50">
            <TableCell colSpan={10} className="p-0">
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
                    <div className="flex flex-wrap gap-4 md:gap-8 items-center p-4 rounded-xl bg-surface-1 border border-border-subtle shadow-sm">
                      <div>
                        <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Gross P&L</p>
                        <p className={cn("text-lg font-mono font-bold tracking-tight", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                          {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-border-subtle hidden md:block" />
                      <div>
                        <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Charges</p>
                        <p className="text-lg font-mono font-bold text-danger tracking-tight">
                          -{formatCurrency(trade.charges)}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-border-subtle hidden md:block" />
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
                    <div className="p-5 rounded-2xl bg-surface-2 border border-border-subtle space-y-4">
                      <div>
                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1.5">Mental State</p>
                        {trade.mindset ? (
                          <div className="inline-block px-3 py-1 bg-surface-1 rounded-md text-sm text-primary font-medium border border-border-subtle shadow-sm">
                            {trade.mindset}
                          </div>
                        ) : (
                          <span className="text-sm text-tertiary">Not logged</span>
                        )}
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          variant="primary" 
                          className="w-full h-10 gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-none shadow-md shadow-indigo-500/20"
                          onClick={() => {
                            navigate('/app/ai-coach', { 
                              state: { 
                                autoPrompt: `[MODE:performance] Please provide a comprehensive Trade Replay for my trade on ${trade.symbol} (Date: ${new Date(trade.date).toLocaleDateString()}, Net P&L: ${trade.netPnl}). Analyze my entry, exit, risk management, and psychology.` 
                              } 
                            });
                          }}
                        >
                          <BrainCircuit className="w-4 h-4 text-white" />
                          <span className="text-white font-bold tracking-wide">AI Trade Replay</span>
                        </Button>
                        
                        <Button
                          variant="secondary"
                          className="w-full h-10 gap-2 border border-border mt-3"
                          onClick={() => navigate(`/app/markets?date=${trade.date}`)}
                        >
                          <Activity className="w-4 h-4" />
                          View Market Context
                        </Button>
                      </div>
                    </div>
                      
                      <hr className="border-border-subtle" />
                      
                      <div>
                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1.5">Decision Logic</p>
                        <p className="text-sm text-secondary leading-relaxed">
                          {trade.decisionNotes || 'No decision logic provided.'}
                        </p>
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
