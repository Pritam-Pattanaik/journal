import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useJournalStore } from '../stores/journalStore';
import { JournalEntry } from '../types';
import DisciplineRater from '../components/ui/DisciplineRater';
import Button from '../components/ui/Button';
import { getLocalYYYYMMDD } from '../lib/dateUtils';

const moodOptions = [
  { emoji: '🚀', value: 'Excellent' },
  { emoji: '🧘‍♂️', value: 'Calm/Focused' },
  { emoji: '🤷‍♂️', value: 'Neutral' },
  { emoji: '😓', value: 'Anxious' },
  { emoji: '😡', value: 'Frustrated/Revenge' },
  { emoji: '😴', value: 'Bored' }
];

export default function Journal() {
  const { entries, fetchEntries, addEntry, updateEntry, loading } = useJournalStore();
  const [selectedDate, setSelectedDate] = useState(() => {
    return getLocalYYYYMMDD();
  });
  
  // Form state
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

  // Fetch entries on mount
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Load entry when date changes
  useEffect(() => {
    const entry = entries.find((e) => e.date === selectedDate);
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
      // Clear form for empty entry
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
  }, [selectedDate, entries]);

  // Navigate date offset
  const shiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    date.setDate(date.getDate() + days);
    setSelectedDate(getLocalYYYYMMDD(date));
  };

  const handleSave = async () => {
    const data = {
      date: selectedDate,
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
        alert(`Journal entry for ${selectedDate} updated successfully!`);
      } else {
        await addEntry(data);
        alert(`Journal entry for ${selectedDate} saved successfully!`);
      }
    } catch (err) {
      alert('Failed to save journal entry.');
    }
  };

  return (
    <div className="max-w-[700px] space-y-5 page-enter font-ui">
      {/* Date Navigation */}
      <div className="flex items-center gap-2 bg-surface/40 border border-tv-border rounded-tv-lg p-3">
        <button
          onClick={() => shiftDate(-1)}
          className="p-2 hover:bg-accent-dim rounded text-secondary hover:text-primary transition-colors shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-base text-center py-1 text-tv-sm font-semibold font-mono"
        />

        <button
          onClick={() => shiftDate(1)}
          className="p-2 hover:bg-accent-dim rounded text-secondary hover:text-primary transition-colors shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* 1. PRE-MARKET SECTION */}
      <div className="card space-y-4">
        <div className="border-b border-tv-border pb-2">
          <span className="label-section text-accent-light">Pre-Market Notes</span>
        </div>

        {/* Bias Selector */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            Market Bias
          </span>
          <div className="flex gap-2">
            {(['bullish', 'bearish', 'neutral'] as const).map((b) => {
              const isActive = bias === b;
              let activeClass = '';
              if (isActive) {
                if (b === 'bullish') activeClass = 'active-win';
                else if (b === 'bearish') activeClass = 'active-loss';
                else activeClass = 'active';
              }
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBias(b)}
                  className={`filter-pill text-capitalize ${isActive ? activeClass : ''}`}
                >
                  {b.charAt(0).toUpperCase() + b.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Key Levels */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            Key Levels & Pivots
          </span>
          <textarea
            value={levels}
            onChange={(e) => setLevels(e.target.value)}
            rows={3}
            placeholder="Nifty support / resistance levels, sector pivots..."
            className="input-base"
          />
        </div>

        {/* Watchlist */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            Watchlist
          </span>
          <textarea
            value={watchlist}
            onChange={(e) => setWatchlist(e.target.value)}
            rows={2}
            placeholder="Tickers or options contracts on watch..."
            className="input-base"
          />
        </div>

        {/* News */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            News & Macro Catalysts
          </span>
          <textarea
            value={news}
            onChange={(e) => setNews(e.target.value)}
            rows={2}
            placeholder="Global market cues, economic events, earnings release..."
            className="input-base"
          />
        </div>
      </div>

      {/* 2. POST-MARKET SECTION */}
      <div className="card space-y-4">
        <div className="border-b border-tv-border pb-2">
          <span className="label-section text-gold">Post-Market Reflection</span>
        </div>

        {/* Reflection */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            Reflection & Executive Summary
          </span>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="Summary of execution performance, overall market behavior..."
            className="input-base"
          />
        </div>

        {/* What went well */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            What went well?
          </span>
          <textarea
            value={wentWell}
            onChange={(e) => setWentWell(e.target.value)}
            rows={3}
            placeholder="Rules followed, good patient exits, entries..."
            className="input-base"
          />
        </div>

        {/* What to improve */}
        <div className="space-y-1">
          <span className="text-tv-xs text-secondary block font-medium uppercase tracking-wider">
            What to improve?
          </span>
          <textarea
            value={toImprove}
            onChange={(e) => setToImprove(e.target.value)}
            rows={3}
            placeholder="Mindset mistakes, FOMO management, trade execution errors..."
            className="input-base"
          />
        </div>
      </div>

      {/* 3. REFLECTIONS & RATINGS */}
      <div className="card space-y-5">
        {/* Mood Selector */}
        <div className="space-y-2">
          <span className="label-section text-muted block">Mood & Emotion</span>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map((opt) => {
              const isActive = mood === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(opt.value)}
                  className={`flex items-center gap-1.5 filter-pill ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <span className="text-tv-md">{opt.emoji}</span>
                  <span>{opt.value}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Discipline Rating */}
        <div className="space-y-2">
          <span className="label-section text-muted block">Overall Daily Discipline</span>
          <DisciplineRater
            value={discipline}
            onChange={setDiscipline}
            interactive={true}
          />
        </div>
      </div>

      {/* Save Button */}
      <Button
        variant="primary"
        loading={loading}
        onClick={handleSave}
        className="w-full text-tv-md font-semibold font-ui shadow-lg py-2.5"
      >
        {currentEntryId ? 'Update Journal Entry' : 'Save Journal Entry'}
      </Button>
    </div>
  );
}
