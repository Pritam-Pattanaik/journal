import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trade } from '../../types';
import { ChevronDown, TrendingUp, TrendingDown, Target, Scale, Shield, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, computeStats } from '../../lib/analytics';
import { cn } from '../../lib/cn';
import { Table, TableHeader, TableBody, TableRow as UITableRow, TableHead, ResizableTableHead } from '../ui/Table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface DailyTradeAccordionProps {
  dateKey: string;
  trades: Trade[];
  isInitiallyExpanded: boolean;
  children: React.ReactNode;
  
  // Table Header Props for the nested table
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  sortConfig: { key: string, direction: 'asc' | 'desc' };
  onSort: (key: string) => void;
}

export default function DailyTradeAccordion({
  dateKey,
  trades,
  isInitiallyExpanded,
  children,
  allSelected,
  onSelectAll,
  sortConfig,
  onSort
}: DailyTradeAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem(`tv-accordion-${dateKey}`);
    return saved !== null ? saved === 'true' : isInitiallyExpanded;
  });

  const toggleExpanded = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem(`tv-accordion-${dateKey}`, String(next));
  };

  // Compute Daily Stats using existing analytics logic
  const stats = computeStats(trades);
  const totalTrades = trades.length;
  const netPnl = stats.totalPnl;
  const winRate = stats.winRate;
  const avgRR = stats.avgRR;
  const avgDiscipline = stats.avgDiscipline;
  
  const wins = trades.filter(t => t.status === 'WIN').length;
  const losses = trades.filter(t => t.status === 'LOSS').length;

  const bestTrade = trades.reduce((best, t) => (!best || t.netPnl > best.netPnl ? t : best), trades[0]);
  const worstTrade = trades.reduce((worst, t) => (!worst || t.netPnl < worst.netPnl ? t : worst), trades[0]);

  // Format Date (e.g. "21 Jul 2026")
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit', 
    month: 'short', 
    year: 'numeric'
  });

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 inline text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 inline text-primary" />;
  };

  const isPositive = netPnl >= 0;

  return (
    <div className="card overflow-hidden transition-all duration-300 hover:border-border-hover mb-4">
      {/* Accordion Header / Daily Performance Card */}
      <button
        onClick={toggleExpanded}
        className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent bg-surface hover:bg-surface-1 transition-colors"
        aria-expanded={isExpanded}
      >
        {/* Left: Date & Status */}
        <div className="flex items-center gap-4 w-full sm:w-[240px] shrink-0">
          <div className="flex flex-col min-w-[100px]">
            <span className="text-sm font-bold text-primary">{dateStr}</span>
            <span className="text-[10px] uppercase tracking-widest text-secondary mt-0.5">{totalTrades} Executions</span>
          </div>
          
          <div className="w-px h-8 bg-border hidden sm:block" />
          
          <div className="flex flex-col">
            <span className={cn("text-lg font-bold font-mono tracking-tight flex items-center gap-1", isPositive ? "text-success" : "text-danger")}>
              {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {isPositive ? '+' : ''}{formatCurrency(netPnl)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-secondary mt-0.5">Net P&L</span>
          </div>
        </div>

        {/* Middle: Micro Stats */}
        <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-iris">
              <Target size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary">{winRate.toFixed(1)}%</span>
              <span className="text-[9px] uppercase tracking-widest text-tertiary">{wins}W - {losses}L</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-gold">
              <Scale size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-primary">1:{avgRR.toFixed(1)}</span>
              <span className="text-[9px] uppercase tracking-widest text-tertiary">Avg R:R</span>
            </div>
          </div>
          
          {avgDiscipline > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-success">
                <Shield size={14} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">{avgDiscipline.toFixed(1)}/5</span>
                <span className="text-[9px] uppercase tracking-widest text-tertiary">Discipline</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Chevron */}
        <div className="flex items-center justify-end gap-4 w-full sm:w-[320px] shrink-0">
          <div className="hidden xl:flex items-center justify-end gap-3 text-xs w-[260px]">
            {bestTrade && bestTrade.netPnl > 0 && (
              <span className="text-success font-medium flex items-center gap-1"><TrendingUp size={12}/> Best: {formatCurrency(bestTrade.netPnl)}</span>
            )}
            {worstTrade && worstTrade.netPnl < 0 && (
              <span className="text-danger font-medium flex items-center gap-1"><TrendingDown size={12}/> Worst: {formatCurrency(worstTrade.netPnl)}</span>
            )}
          </div>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300", isExpanded ? "bg-surface-2 rotate-180" : "bg-transparent")}>
            <ChevronDown size={16} className="text-secondary" />
          </div>
        </div>
      </button>

      {/* Accordion Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-t border-border overflow-hidden bg-canvas/30"
          >
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <UITableRow className="hover:bg-transparent border-b border-border bg-surface-1/50">
                    <TableHead className="w-[40px] px-4 align-middle">
                      <div className="flex items-center justify-center h-full">
                        <input 
                          type="checkbox"
                          aria-label={`Select all trades for ${dateStr}`}
                          className="rounded border-border text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                          checked={allSelected}
                          onChange={(e) => onSelectAll(e.target.checked)}
                        />
                      </div>
                    </TableHead>
                    <ResizableTableHead className="text-[10px] font-semibold uppercase tracking-wider cursor-pointer group select-none text-secondary" onClick={() => onSort('symbol')}>
                      Asset {getSortIcon('symbol')}
                    </ResizableTableHead>
                    <ResizableTableHead className="text-[10px] font-semibold uppercase tracking-wider cursor-pointer group select-none text-secondary" onClick={() => onSort('date')}>
                      Date & Time {getSortIcon('date')}
                    </ResizableTableHead>
                    <ResizableTableHead className="text-[10px] font-semibold uppercase tracking-wider cursor-pointer group select-none text-secondary" onClick={() => onSort('direction')}>
                      Type {getSortIcon('direction')}
                    </ResizableTableHead>
                    <ResizableTableHead className="text-[10px] font-semibold uppercase tracking-wider cursor-pointer group select-none text-secondary text-right" onClick={() => onSort('netPnl')}>
                      Net P&L {getSortIcon('netPnl')}
                    </ResizableTableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      Setup & Conviction
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-secondary w-[80px]">
                      Discipline
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </UITableRow>
                </TableHeader>
                <TableBody>
                  {children}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
