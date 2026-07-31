/**
 * EnhancedEconomicCalendar — Real Economic Calendar
 *
 * Fetches live events from the backend (Investing.com + curated Indian events).
 * Features:
 * - Country flags
 * - Impact level color coding (High/Medium/Low)
 * - Countdown to next event
 * - Previous / Forecast / Actual columns
 * - Grouped by date
 * - Filterable by impact
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertTriangle, Flame, TrendingUp, ChevronDown, RefreshCw } from 'lucide-react';
import { useEconomicCalendar, type CalendarEvent } from '../../hooks/useMarketData';
import { cn } from '../../lib/cn';

const IMPACT_CONFIG = {
  high:   { label: 'High Impact',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   dot: 'bg-red-500' },
  medium: { label: 'Medium Impact', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  dot: 'bg-amber-500' },
  low:    { label: 'Low Impact',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', dot: 'bg-gray-500' },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function Countdown({ date, time, timezone }: { date: string; time: string; timezone: string }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const update = () => {
      const eventTime = new Date(`${date}T${time}:00`);
      // Adjust for IST if needed
      const now = new Date();
      const diff = eventTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Passed');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      if (h > 24) {
        const days = Math.floor(h / 24);
        setCountdown(`${days}d ${h % 24}h`);
      } else if (h > 0) {
        setCountdown(`${h}h ${m}m`);
      } else {
        setCountdown(`${m}m`);
      }
    };

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [date, time]);

  return <span className="text-[10px] font-mono text-tertiary">{countdown}</span>;
}

function EventRow({ event }: { event: CalendarEvent }) {
  const [expanded, setExpanded] = useState(false);
  const impact = IMPACT_CONFIG[event.impact];

  return (
    <div
      className={cn(
        'p-3 rounded-xl border transition-all duration-200 cursor-pointer',
        expanded ? 'border-border-hover' : 'border-border hover:border-border-hover',
      )}
      style={{ background: expanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }}
      onClick={() => setExpanded(v => !v)}
    >
      {/* Main row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {/* Impact dot */}
          <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
            <div className={cn('w-2 h-2 rounded-full', impact.dot)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-lg leading-none">{event.countryFlag}</span>
              <span className="text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded text-secondary flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {event.time} {event.timezone}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: impact.bg, color: impact.color, border: `1px solid ${impact.border}` }}
              >
                {event.impact === 'high' && <Flame className="w-2.5 h-2.5 inline mr-0.5" />}
                {event.impact}
              </span>
              <Countdown date={event.date} time={event.time} timezone={event.timezone} />
            </div>
            <h4 className="text-sm font-bold text-primary leading-tight truncate">{event.title}</h4>
          </div>
        </div>

        {/* Data columns */}
        <div className="flex items-center gap-3 shrink-0">
          {event.forecast && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-tertiary uppercase tracking-wider">Forecast</span>
              <span className="text-xs font-mono font-semibold text-secondary">{event.forecast}</span>
            </div>
          )}
          {event.previous && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-tertiary uppercase tracking-wider">Prev</span>
              <span className="text-xs font-mono text-tertiary">{event.previous}</span>
            </div>
          )}
          {event.actual != null && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-tertiary uppercase tracking-wider">Actual</span>
              <span className="text-xs font-mono font-bold text-primary">{event.actual}</span>
            </div>
          )}
          <ChevronDown
            className={cn('w-3 h-3 text-tertiary transition-transform duration-200', expanded && 'rotate-180')}
          />
        </div>
      </div>

      {/* Expanded description */}
      {expanded && event.description && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-tertiary leading-relaxed">{event.description}</p>
        </div>
      )}
    </div>
  );
}

type ImpactFilter = 'all' | 'high' | 'medium' | 'low';

export default function EnhancedEconomicCalendar() {
  const { events, loading, error } = useEconomicCalendar(30);
  const [filter, setFilter] = useState<ImpactFilter>('all');

  const filtered = events.filter(e => filter === 'all' || e.impact === filter);

  // Group by date
  const grouped = filtered.reduce<Record<string, CalendarEvent[]>>((acc, evt) => {
    if (!acc[evt.date]) acc[evt.date] = [];
    acc[evt.date].push(evt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h3 className="font-display font-bold text-primary">Economic Calendar</h3>
          {events.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {events.length} events
            </span>
          )}
        </div>
        {loading && <RefreshCw className="w-3.5 h-3.5 text-tertiary animate-spin" />}
      </div>

      {/* Impact Filters */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as ImpactFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'text-[10px] font-bold px-2.5 py-1 rounded-full transition-all capitalize',
              filter === f
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-surface-1 text-tertiary border border-border hover:border-border-hover'
            )}
          >
            {f === 'all' ? 'All Events' : f}
            {f !== 'all' && (
              <span
                className="ml-1 inline-block w-1.5 h-1.5 rounded-full align-middle"
                style={{ background: IMPACT_CONFIG[f].color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
        {loading && events.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-16 bg-surface-1 rounded-xl animate-pulse border border-border" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-tertiary mx-auto mb-2 opacity-50" />
            <p className="text-sm text-tertiary">Calendar data unavailable</p>
          </div>
        )}

        {!loading && !error && sortedDates.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-tertiary mx-auto mb-2 opacity-50" />
            <p className="text-sm text-tertiary">No events found for this filter</p>
          </div>
        )}

        {sortedDates.map(date => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
                {formatDate(date)}
              </span>
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-tertiary">{grouped[date].length} events</span>
            </div>
            <div className="space-y-2">
              {grouped[date].map(evt => (
                <EventRow key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
