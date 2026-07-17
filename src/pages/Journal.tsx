import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Save } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useJournalStore } from '../stores/journalStore';
import { useTradeStore } from '../stores/tradeStore';
import DisciplineRater from '../components/ui/DisciplineRater';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import { motion } from 'framer-motion';
import { getLocalYYYYMMDD } from '../lib/dateUtils';
import { formatCurrency } from '../lib/analytics';
import { notify } from '../lib/notify';

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
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);

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
    };

    try {
      if (currentEntryId) {
        await updateEntry(currentEntryId, data);
        notify.success('Journal updated');
      } else {
        await addEntry(data);
        notify.success('Journal saved');
      }
    } catch (err) {
      notify.error('Failed to save');
    }
  };

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

  const baseInputStyles = "w-full bg-surface-1 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent/50 outline-none transition-all shadow-sm";

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 pb-20">
      
      {/* LEFT PANE: Calendar */}
      <div className="lg:w-[340px] flex-shrink-0 flex flex-col gap-6">
        <div className="p-6 flex flex-col items-center glass-panel rounded-2xl">
          <div className="flex items-center justify-between w-full mb-6">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-secondary hover:text-primary transition-colors focus-ring">
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-primary tracking-wide">{format(currentMonth, 'MMMM yyyy')}</span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-secondary hover:text-primary transition-colors focus-ring">
              <ChevronRight size={16} />
            </button>
          </div>
          
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

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDateStr(dayStr)}
                  className={cn(
                    "relative h-11 w-full rounded-lg flex items-center justify-center text-sm transition-colors outline-none",
                    !isCurrentMonth && "text-tertiary opacity-50",
                    isCurrentMonth && !isSelected && "text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <span className={cn("relative z-10", isSelected && "text-canvas font-semibold")}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicators container */}
                  <div className="absolute bottom-1.5 flex gap-1 items-center justify-center w-full z-10">
                    {pnl !== null && (
                      <div className={cn("w-1 h-1 rounded-full", pnl >= 0 ? "bg-success" : "bg-danger", isSelected && "opacity-60")} />
                    )}
                    {hasEntry && pnl === null && (
                      <div className={cn("w-1 h-1 rounded-full bg-accent", isSelected && "opacity-60")} />
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
        <div className="p-6 flex-1 glass-panel rounded-2xl">
          <h3 className="text-xs font-semibold text-tertiary uppercase tracking-widest mb-6">Daily Snapshot</h3>
          <div className="space-y-6">
            <div>
              <p className="text-[11px] text-tertiary uppercase tracking-widest mb-1.5">Date</p>
              <p className="font-semibold text-primary tracking-tight">{format(selectedDateObj, 'EEEE, MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-[11px] text-tertiary uppercase tracking-widest mb-1.5">Net P&L</p>
              {(() => {
                const pnl = getDayTradesPnl(selectedDateStr);
                if (pnl === null) return <p className="text-sm text-secondary">No trades execution</p>;
                return <p className={cn("text-2xl font-bold font-mono tabular-nums tracking-tighter", pnl >= 0 ? 'text-success' : 'text-danger')}>
                  {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                </p>;
              })()}
            </div>
            <div>
              <p className="text-[11px] text-tertiary uppercase tracking-widest mb-2">Discipline Integrity</p>
              {discipline ? (
                <div className="flex gap-1.5">
                  {[1,2,3,4,5].map(v => (
                    <div key={v} className={cn("h-1 flex-1 rounded-full transition-colors", v <= discipline ? 'bg-accent shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-black/10 dark:bg-white/10')} />
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
      <div className="flex-1 flex flex-col h-full glass-panel rounded-2xl overflow-hidden">
        
        {/* Editor Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5 bg-surface-1">
          <div className="flex items-center gap-3">
            <BookOpen className="text-primary h-5 w-5" />
            <h2 className="text-lg font-bold text-primary tracking-tight">Workspace Entry</h2>
          </div>
          <Button onClick={handleSave} isLoading={loading} size="sm" className="gap-2 px-6 rounded-lg">
            <Save size={16} />
            {currentEntryId ? 'Update Entry' : 'Save Entry'}
          </Button>
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12">
          
          {/* Section: Pre-Market */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest">
              Pre-Market Foundation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Market Bias</label>
                <div className="flex gap-2 p-1.5 bg-surface-1 border border-black/10 dark:border-white/10 rounded-lg">
                  {(['bullish', 'neutral', 'bearish'] as const).map(b => (
                    <button
                      key={b}
                      onClick={() => setBias(b)}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold rounded-md transition-all capitalize outline-none focus-visible:ring-1 focus-visible:ring-accent",
                        bias === b 
                          ? "bg-primary text-canvas shadow-md"
                          : "text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      {b}
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
                <textarea
                  value={levels}
                  onChange={(e) => setLevels(e.target.value)}
                  rows={2}
                  placeholder="Support/Resistance..."
                  className={cn(baseInputStyles, "resize-none")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">Active Watchlist</label>
                <textarea
                  value={watchlist}
                  onChange={(e) => setWatchlist(e.target.value)}
                  rows={2}
                  placeholder="Tickers..."
                  className={cn(baseInputStyles, "resize-none")}
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
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={4}
                placeholder="How did the day go? What was the overall market action?"
                className={cn(baseInputStyles, "resize-y min-h-[120px]")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">What went well?</label>
                <textarea
                  value={wentWell}
                  onChange={(e) => setWentWell(e.target.value)}
                  rows={3}
                  placeholder="Rules followed, good executions..."
                  className={cn(baseInputStyles, "resize-none focus:border-success/50 focus:ring-success/20 bg-success/5 dark:bg-success/[0.02]")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-tertiary uppercase tracking-widest">What to improve?</label>
                <textarea
                  value={toImprove}
                  onChange={(e) => setToImprove(e.target.value)}
                  rows={3}
                  placeholder="Mistakes, FOMO, sizing..."
                  className={cn(baseInputStyles, "resize-none focus:border-danger/50 focus:ring-danger/20 bg-danger/5 dark:bg-danger/[0.02]")}
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
                        "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all outline-none focus-visible:ring-1 focus-visible:ring-accent",
                        mood === opt.value
                          ? "bg-primary text-canvas font-semibold border-transparent shadow-md"
                          : "bg-surface-1 border-black/10 dark:border-white/10 text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <span className="text-base">{opt.emoji}</span>
                      <span>{opt.value}</span>
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
          </section>

        </div>
      </div>
      
    </div>
  );
}
