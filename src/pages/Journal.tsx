import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Tag, ArrowUpRight, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, subDays, addDays } from 'date-fns';
import { useJournalStore } from '../stores/journalStore';
import { useTradeStore } from '../stores/tradeStore';
import DisciplineRater from '../components/ui/DisciplineRater';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import { motion } from 'framer-motion';
import { getLocalYYYYMMDD } from '../lib/dateUtils';
import { formatCurrency } from '../lib/analytics';
import { notify } from '../lib/notify';
import { CMD_KEY } from '../lib/osUtils';
import JournalEditor from '../components/journal/JournalEditor';
import JournalEmptyState from '../components/journal/JournalEmptyState';
import WeeklyReflectionView from '../components/journal/WeeklyReflectionView';
import MonthlyReflectionView from '../components/journal/MonthlyReflectionView';
import KnowledgeVault from './KnowledgeVault';

const moodOptions = [
  { emoji: '🚀', value: 'Excellent' },
  { emoji: '🧘‍♂️', value: 'Focused' },
  { emoji: '🤷‍♂️', value: 'Neutral' },
  { emoji: '😓', value: 'Anxious' },
  { emoji: '😡', value: 'Revenge' },
  { emoji: '😴', value: 'Bored' }
];

export default function Journal() {
  const { entries, fetchEntries, addEntry, updateEntry, loading } = useJournalStore();
  const { trades } = useTradeStore();
  
  const [selectedDateStr, setSelectedDateStr] = useState(() => getLocalYYYYMMDD());
  const selectedDateObj = useMemo(() => new Date(selectedDateStr), [selectedDateStr]);
  
  const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), 1));

  const [bias, setBias] = useState<'bullish' | 'bearish' | 'neutral' | undefined>(undefined);
  const [levels, setLevels] = useState('');
  const [watchlist, setWatchlist] = useState('');
  const [news, setNews] = useState('');
  const [reflection, setReflection] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [discipline, setDiscipline] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'vault'>('daily');

  useEffect(() => {
    setIsCreatingNew(false);
  }, [selectedDateStr]);

  const isToday = selectedDateStr === getLocalYYYYMMDD();
  
  const handlePreviousDay = () => {
    setSelectedDateStr(getLocalYYYYMMDD(subDays(selectedDateObj, 1)));
  };
  
  const handleNextDay = () => {
    setSelectedDateStr(getLocalYYYYMMDD(addDays(selectedDateObj, 1)));
  };
  
  const handleToday = () => {
    setSelectedDateStr(getLocalYYYYMMDD());
    setCurrentMonth(startOfMonth(new Date()));
  };



  const tradesOnDay = useMemo(() => {
    return trades.filter(t => {
       const td = t.isCarryForward && t.exitTime ? new Date(t.exitTime) : new Date(t.date);
       return getLocalYYYYMMDD(td) === selectedDateStr;
    });
  }, [trades, selectedDateStr]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    const entry = entries.find((e) => e.date === selectedDateStr);
    if (entry) {
      setCurrentEntryId(entry.id);
      setBias(entry.marketBias);
      setLevels(entry.keyLevels || '');
      setWatchlist(entry.watchlist || '');
      setNews(entry.newsNotes || '');
      setReflection(entry.reflection || '');
      setWentWell(entry.whatWentWell || '');
      setToImprove(entry.whatToImprove || '');
      setMood(entry.mood);
      setDiscipline(entry.overallDiscipline || 3);
      setTags(entry.tags || []);
    } else {
      setCurrentEntryId(null);
      setBias(undefined);
      setLevels('');
      setWatchlist('');
      setNews('');
      setReflection('');
      setWentWell('');
      setToImprove('');
      setMood(undefined);
      setDiscipline(3);
      setTags([]);
    }
  }, [selectedDateStr, entries]);

  const handleSave = async () => {
    const data = {
      date: selectedDateStr,
      marketBias: bias,
      keyLevels: levels,
      watchlist,
      newsNotes: news,
      reflection,
      whatWentWell: wentWell,
      whatToImprove: toImprove,
      mood,
      overallDiscipline: discipline,
      tags,
    };

    try {
      if (currentEntryId) {
        await updateEntry(currentEntryId, data);
        notify.success('Journal updated');
      } else {
        await addEntry(data);
        notify.success('Journal saved');
      }
    } catch (_err) {
      notify.error('Failed to save');
    }
  };

  // Cmd/Ctrl + S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && (currentEntryId || isCreatingNew)) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEntryId, isCreatingNew, handleSave]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayTradesPnl = (dateStr: string) => {
    const dayTrades = trades.filter(t => {
       const td = t.isCarryForward && t.exitTime ? new Date(t.exitTime) : new Date(t.date);
       return getLocalYYYYMMDD(td) === dateStr;
    });
    if (dayTrades.length === 0) return null;
    return dayTrades.reduce((sum, t) => sum + t.netPnl, 0);
  };

  const getDayTradesStats = (dateStr: string) => {
    const dayTrades = trades.filter(t => {
       const td = t.isCarryForward && t.exitTime ? new Date(t.exitTime) : new Date(t.date);
       return getLocalYYYYMMDD(td) === dateStr;
    });
    if (dayTrades.length === 0) return null;
    const wins = dayTrades.filter(t => t.netPnl > 0).length;
    return { count: dayTrades.length, wins, losses: dayTrades.length - wins };
  };

  const baseInputStyles = "w-full bg-surface-1 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all shadow-sm";

  return (
    <div className="flex flex-col h-full gap-6 pb-20">
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly', 'vault'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-colors",
              viewMode === mode ? "bg-primary text-inverse shadow-sm" : "bg-surface border border-border text-secondary hover:bg-surface-2 hover:text-primary"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {viewMode === 'weekly' && (
        <WeeklyReflectionView />
      )}
      
      {viewMode === 'monthly' && (
        <MonthlyReflectionView />
      )}
      
      {viewMode === 'vault' && (
        <KnowledgeVault />
      )}

      {viewMode === 'daily' && (
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-6">
      
      {/* LEFT PANE: Calendar */}
      <div className="lg:w-[340px] flex-shrink-0 flex flex-col gap-6">
        <div className="p-6 flex flex-col items-center card rounded-2xl">
          <div className="flex items-center justify-between w-full mb-6">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Previous month" className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-secondary hover:text-primary transition-colors focus-ring">
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-primary tracking-wide">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} disabled={format(addMonths(currentMonth, 1), 'yyyy-MM') > format(new Date(), 'yyyy-MM')} aria-label="Next month" className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-secondary hover:text-primary transition-colors focus-ring disabled:opacity-30 disabled:pointer-events-none">
              <ChevronRight size={16} />
            </button>
          </div>

          {!isToday && (
            <button onClick={handleToday} className="w-full mb-5 text-[11px] font-bold text-accent uppercase tracking-widest bg-accent/10 hover:bg-accent/20 transition-colors py-2 rounded-lg shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas border border-accent/20 hover:border-accent/40 flex items-center justify-center gap-2">
              <Activity size={12} />
              Jump to Today
            </button>
          )}
          
          <div className="grid grid-cols-7 gap-1 w-full text-center mb-3">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <span key={d} className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{d}</span>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 w-full">
            {calendarDays.map((day, i) => {
              const dayStr = getLocalYYYYMMDD(day);
              const pnl = getDayTradesPnl(dayStr);
              const hasEntry = entries.some(e => e.date === dayStr);
              const isSelected = selectedDateStr === dayStr;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isFuture = dayStr > getLocalYYYYMMDD();
              const pnlLabel = pnl !== null
                ? `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`
                : (hasEntry ? 'Journal entry' : 'No data');

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDateStr(dayStr)}
                  disabled={!isCurrentMonth || isFuture}
                  title={`${format(day, 'MMM d')} — ${pnlLabel}`}
                  aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${pnl !== null ? `, Net P&L: ${pnlLabel}` : hasEntry ? ', has journal entry' : ''}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative h-11 w-full rounded-lg flex items-center justify-center text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-canvas",
                    (!isCurrentMonth || isFuture) && "text-tertiary opacity-40 pointer-events-none",
                    isCurrentMonth && !isFuture && !isSelected && "text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <span className={cn("relative z-10", isSelected && "text-canvas font-semibold")}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicators container */}
                  <div className="absolute bottom-1.5 flex gap-1 items-center justify-center w-full z-10">
                    {pnl !== null && (
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        pnl > 0 ? "bg-success" : pnl < 0 ? "bg-danger" : "bg-tertiary",
                        isSelected && "opacity-50"
                      )} />
                    )}
                    {hasEntry && pnl === null && (
                      <div className={cn("w-1.5 h-1.5 rounded-full bg-accent", isSelected && "opacity-50")} />
                    )}
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="journal-selected-date"
                      className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Summary */}
        <div className="p-6 flex-1 card rounded-2xl">
          <h3 className="text-xs font-semibold text-tertiary uppercase tracking-widest mb-6">Daily Snapshot</h3>
          <div className="space-y-5">
            <div>
              <p className="text-[11px] text-tertiary uppercase tracking-widest mb-1.5">Date</p>
              <p className="font-semibold text-primary tracking-tight">{format(selectedDateObj, 'EEEE, MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-[11px] text-tertiary uppercase tracking-widest mb-1.5">Net P&L</p>
              {(() => {
                const pnl = getDayTradesPnl(selectedDateStr);
                if (pnl === null) return <p className="text-sm text-secondary">No trades on this day</p>;
                return <p className={cn("text-2xl font-bold font-mono tabular-nums tracking-tighter", pnl >= 0 ? 'text-success' : 'text-danger')}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                </p>;
              })()}
            </div>
            {/* Trades summary row */}
            {(() => {
              const stats = getDayTradesStats(selectedDateStr);
              if (!stats) return null;
              return (
                <div>
                  <p className="text-[11px] text-tertiary uppercase tracking-widest mb-2">Executions</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{stats.count} trades</span>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">
                        <TrendingUp size={9} />{stats.wins}W
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded">
                        <TrendingDown size={9} />{stats.losses}L
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
            <div>
              <p className="text-[11px] text-tertiary uppercase tracking-widest mb-2">Discipline Integrity</p>
              {discipline ? (
                <div className="flex gap-1.5" role="meter" aria-valuenow={discipline} aria-valuemin={1} aria-valuemax={5} aria-label={`Discipline: ${discipline} out of 5`}>
                  {[1,2,3,4,5].map(v => (
                    <div key={v} className={cn("h-1.5 flex-1 rounded-full transition-colors", v <= discipline ? 'bg-accent shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-black/10 dark:bg-white/10')} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary">Unrated</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Editor */}
      <div className="flex-1 flex flex-col h-full card rounded-2xl overflow-hidden">
        
        {/* Editor Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-surface-1 gap-4 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-black/5 dark:border-white/5">
              <button onClick={handlePreviousDay} aria-label="Previous day" className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-secondary hover:text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-primary px-3 min-w-[110px] text-center tracking-tight">
                {format(selectedDateObj, 'MMM d, yyyy')}
              </span>
              <button onClick={handleNextDay} disabled={selectedDateStr >= getLocalYYYYMMDD()} aria-label="Next day" className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-secondary hover:text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-30 disabled:pointer-events-none">
                <ChevronRight size={16} />
              </button>
            </div>
            {!isToday && (
              <button onClick={handleToday} className="text-xs font-bold text-accent hover:text-accent-hover transition-colors px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 outline-none focus-visible:ring-1 focus-visible:ring-accent shadow-sm border border-accent/20">
                Today
              </button>
            )}
          </div>
          {(currentEntryId || isCreatingNew) && (
            <div className="flex items-center gap-3">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded bg-surface-2 border border-border px-1.5 font-mono text-[10px] font-bold text-muted">{CMD_KEY}S</kbd>
              <Button onClick={handleSave} isLoading={loading} size="sm" className="gap-2 px-6 rounded-lg shadow-sm" aria-label="Save journal entry">
                <Save size={16} />
                {currentEntryId ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          )}
        </div>

        {/* Editor Body */}
        {(!currentEntryId && !isCreatingNew) ? (
          <JournalEmptyState date={format(selectedDateObj, 'MMMM d, yyyy')} onCreateEntry={() => setIsCreatingNew(true)} />
        ) : (
        <div className="flex-1 overflow-y-auto p-8 space-y-12 relative">
          
          {tradesOnDay.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-accent" />
                Trades on this day
                <span className="bg-surface-2 border border-black/5 dark:border-white/5 text-primary px-2 py-0.5 rounded-full text-[10px] font-mono">{tradesOnDay.length}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tradesOnDay.map((trade) => (
                  <div key={trade.id} className="p-4 bg-surface-1 rounded-xl border border-black/10 dark:border-white/10 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 hover:border-accent/30 group cursor-default relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: trade.netPnl >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
                    <div className="flex justify-between items-center pl-1">
                      <span className="font-bold text-primary text-sm group-hover:text-accent transition-colors flex items-center gap-1.5">
                        {trade.symbol}
                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider", trade.direction === 'LONG' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                        {trade.direction}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pl-1">
                      <span className="text-xs font-medium text-tertiary capitalize">{trade.status.toLowerCase()}</span>
                      <span className={cn("font-bold font-mono text-sm tracking-tight", trade.netPnl >= 0 ? "text-success" : "text-danger")}>
                        {trade.netPnl >= 0 ? '+' : ''}{formatCurrency(trade.netPnl)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Section: Pre-Market */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest">
              Pre-Market Foundation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Market Bias</label>
                <div className="flex gap-2 p-1.5 bg-surface-1 border border-black/10 dark:border-white/10 rounded-xl relative" role="group" aria-label="Market bias selection">
                  {(['bullish', 'neutral', 'bearish'] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setBias(b)}
                      aria-pressed={bias === b}
                      aria-label={`Set market bias to ${b}`}
                      className={cn(
                        "relative flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors capitalize outline-none z-10 focus-visible:ring-2 focus-visible:ring-accent",
                        bias === b 
                          ? "text-canvas"
                          : "text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {bias === b && (
                        <motion.div
                          layoutId="bias-active-bg"
                          className={cn(
                            "absolute inset-0 rounded-lg z-[-1] shadow-sm",
                            b === 'bullish' ? 'bg-success/80' : b === 'bearish' ? 'bg-danger/80' : 'bg-primary'
                          )}
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      {b === 'bullish' ? '▲ ' : b === 'bearish' ? '▼ ' : '— '}{b}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Macro / Catalysts</label>
                <input
                  type="text"
                  value={news}
                  onChange={(e) => setNews(e.target.value)}
                  placeholder="CPI data, earnings..."
                  className={baseInputStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Key Pivots & Zones</label>
                <JournalEditor
                  content={levels}
                  onChange={setLevels}
                  placeholder="Support/Resistance..."
                  minHeight="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Active Watchlist</label>
                <JournalEditor
                  content={watchlist}
                  onChange={setWatchlist}
                  placeholder="Tickers..."
                  minHeight="min-h-[80px]"
                />
              </div>
            </div>
          </section>

          <hr className="border-black/5 dark:border-white/5" />

          {/* Section: Post-Market */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest">
              Execution Review
            </h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Executive Summary</label>
              <JournalEditor
                content={reflection}
                onChange={setReflection}
                placeholder="How did the day go? What was the overall market action?"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">What went well?</label>
                <JournalEditor
                  content={wentWell}
                  onChange={setWentWell}
                  placeholder="Rules followed, good executions..."
                  className="focus-within:border-success/50 focus-within:ring-success/20 bg-success/5 dark:bg-success/[0.02]"
                  minHeight="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">What to improve?</label>
                <JournalEditor
                  content={toImprove}
                  onChange={setToImprove}
                  placeholder="Mistakes, FOMO, sizing..."
                  className="focus-within:border-danger/50 focus-within:ring-danger/20 bg-danger/5 dark:bg-danger/[0.02]"
                  minHeight="min-h-[100px]"
                />
              </div>
            </div>
          </section>

          <hr className="border-black/5 dark:border-white/5" />

          {/* Section: Psychology */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest">
              Psychology & Integrity
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Emotional State</label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMood(opt.value)}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas overflow-hidden",
                        mood === opt.value
                          ? "border-transparent text-canvas font-semibold shadow-md"
                          : "bg-surface-1 border-black/10 dark:border-white/10 text-secondary hover:text-primary hover:border-black/20 dark:hover:border-white/20"
                      )}
                    >
                      {mood === opt.value && (
                        <motion.div
                          layoutId="mood-active-bg"
                          className="absolute inset-0 bg-primary z-0"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 text-base">{opt.emoji}</span>
                      <span className="relative z-10">{opt.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Discipline Score</label>
                <div className="pt-2">
                  <DisciplineRater value={discipline} onChange={setDiscipline} interactive />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
               <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest flex items-center gap-2">
                 <Tag size={12} />
                 Journal Tags
                 <span className="ml-auto text-[10px] font-normal text-tertiary/60 normal-case tracking-normal">Enter or comma to add</span>
               </label>
               <div className="flex flex-wrap gap-2 items-center bg-surface-1 p-3 rounded-xl border border-black/5 dark:border-white/5" role="group" aria-label="Journal tags">
                  {tags.map(tag => (
                    <span key={tag} className="bg-surface-2 text-primary text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-black/10 dark:border-white/10 group shadow-sm">
                      #{tag}
                      <button onClick={() => setTags(tags.filter(t => t !== tag))} aria-label={`Remove tag ${tag}`} className="text-tertiary group-hover:text-danger hover:bg-danger/10 rounded-full p-0.5 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-danger">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "Add tags, e.g. fomo, tilt, breakout..." : "Add tag..."}
                    aria-label="Add journal tag"
                    className="bg-transparent border-none text-xs text-primary placeholder:text-tertiary focus:ring-0 outline-none flex-1 min-w-[120px] ml-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim().toLowerCase().replace(/^#/, '');
                        if (val && !tags.includes(val)) {
                          setTags([...tags, val]);
                        }
                        e.currentTarget.value = '';
                      } else if (e.key === 'Backspace' && e.currentTarget.value === '' && tags.length > 0) {
                        setTags(tags.slice(0, -1));
                      }
                    }}
                  />
               </div>
            </div>
          </section>

        </div>
        )}
      </div>
    </div>
    )}
    </div>
  );
}
