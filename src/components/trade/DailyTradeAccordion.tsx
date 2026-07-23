import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';
import { Trade } from '../../types';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Target, Scale, Shield, ArrowUpRight, ArrowDownRight, Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency, computeStats } from '../../lib/analytics';
import DisciplineRater from '../ui/DisciplineRater';
import { Table, TableHeader, TableBody, TableRow as UITableRow, TableHead, ResizableTableHead } from '../ui/Table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import DailySummaryBlock from './DailySummaryBlock';

interface DailyTradeAccordionProps {
  dateKey: string;
  summary?: any;
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
  summary,
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
  const [isDisciplineExpanded, setIsDisciplineExpanded] = useState(false);

  const validScores = trades.filter(t => t.disciplineRawScore != null || t.disciplineScore != null);
  const avgScore = validScores.length > 0 
    ? validScores.reduce((sum, t) => sum + (t.disciplineRawScore ?? t.disciplineScore ?? 0), 0) / validScores.length 
    : 0;

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

        {/* Middle: Core Stats (Discipline -> Win Rate -> R:R) */}
        <div className="hidden lg:flex items-center gap-10 flex-1 justify-center px-4">
          
          {/* 1. Discipline (Hero Element) */}
          <div className="flex flex-col gap-1.5 cursor-pointer group/disc p-3 -m-3 rounded-xl hover:bg-surface-2 transition-colors relative"
               onClick={(e) => {
                 e.stopPropagation();
                 setIsDisciplineExpanded(!isDisciplineExpanded);
               }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Discipline</span>
              {validScores.length > 0 && (
                <span className="text-[9px] text-tertiary font-mono bg-surface-2/50 border border-border-subtle px-2 py-0.5 rounded-full">
                  {Math.round(
                    trades
                      .filter(t => t.confidence != null)
                      .reduce((sum, t) => sum + (t.confidence || 0), 0) / validScores.length
                  )}% CONF
                </span>
              )}
            </div>
            
            {validScores.length > 0 ? (
               <DisciplineRater value={Math.round(avgScore)} rawScore={parseFloat(avgScore.toFixed(1))} />
            ) : (
              <span className="text-sm font-bold text-tertiary mt-1">Unrated</span>
            )}
            
            {/* Click indicator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/disc:opacity-100 transition-opacity">
               <ChevronRight className={cn("w-4 h-4 text-tertiary transition-transform", isDisciplineExpanded && "rotate-90")} />
            </div>
          </div>

          <div className="w-px h-8 bg-surface-2 hidden xl:block" />

          {/* 2. Win Rate */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-iris shadow-sm">
              <Target size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary tracking-tight">{winRate.toFixed(1)}%</span>
              <span className="text-[9px] uppercase tracking-widest text-tertiary">{wins}W - {losses}L</span>
            </div>
          </div>
          
          {/* 3. Risk Reward */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-gold shadow-sm">
              <Scale size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary tracking-tight">1:{avgRR.toFixed(1)}</span>
              <span className="text-[9px] uppercase tracking-widest text-tertiary">Avg R:R</span>
            </div>
          </div>
        </div>

        {/* Right: Chevron */}
        <div className="flex items-center justify-end">
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
            <div className="p-5 md:p-6 bg-surface-1 border-t border-border-subtle/50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Style Card */}
                <div className="bg-surface p-3.5 rounded-xl border border-border-subtle flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 bg-surface-2 rounded-lg text-iris flex items-center justify-center shrink-0">
                    <Activity size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-tertiary uppercase font-bold tracking-widest truncate">Style</span>
                    <span className="text-sm font-bold text-primary truncate">
                      {trades.find(t => t.tradingStyle)?.tradingStyle || 'Detecting...'}
                    </span>
                  </div>
                </div>

                {/* Hold Time Card */}
                <div className="bg-surface p-3.5 rounded-xl border border-border-subtle flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 bg-surface-2 rounded-lg text-gold flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-tertiary uppercase font-bold tracking-widest truncate">Hold Time</span>
                    <span className="text-sm font-bold text-primary font-mono truncate">
                      {Math.round(
                        trades.reduce((sum, t) => sum + (t.behaviourProfile?.holdDurationMins || 0), 0) / (trades.length || 1)
                      )} mins
                    </span>
                  </div>
                </div>

                {/* Size Card */}
                <div className="bg-surface p-3.5 rounded-xl border border-border-subtle flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 bg-surface-2 rounded-lg text-emerald-500 flex items-center justify-center shrink-0">
                    <Target size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-tertiary uppercase font-bold tracking-widest truncate">Avg Size</span>
                    <span className="text-sm font-bold text-primary font-mono truncate">
                      {Math.round(trades.reduce((sum, t) => sum + t.quantity, 0) / (trades.length || 1))}
                    </span>
                  </div>
                </div>

                {/* Revenge Card */}
                {(() => {
                  const revengeTrades = trades.filter(t => (t.behaviourProfile?.consecutiveLossesBefore || 0) > 0 && (t.behaviourProfile?.timeSinceLastTradeMins || 0) < 10).length;
                  return (
                    <div className="bg-surface p-3.5 rounded-xl border border-border-subtle flex items-center gap-3.5 shadow-sm">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors", revengeTrades > 0 ? "bg-danger/10 text-danger" : "bg-surface-2 text-success")}>
                        {revengeTrades > 0 ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] text-tertiary uppercase font-bold tracking-widest truncate">Revenge</span>
                        <span className={cn("text-sm font-bold font-mono truncate", revengeTrades > 0 ? "text-danger" : "text-primary")}>
                          {revengeTrades}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
              </div>
            </div>
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
