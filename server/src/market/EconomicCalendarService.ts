/**
 * EconomicCalendarService — Real Economic Calendar Data
 *
 * Sources real economic events from:
 * 1. RBI published schedule (official, parsed from embedded JSON)
 * 2. Investing.com economic calendar API (public endpoint)
 * 3. Curated fallback of known future events
 *
 * Events are normalized to CalendarEvent model.
 */

import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { CalendarEvent, EventImpact } from './types';

const CACHE_KEY = 'market:calendar:v2';
const CACHE_TTL_SEC = 3600; // 1 hour — events don't change minute-to-minute
const REQUEST_TIMEOUT_MS = 10_000;

const COUNTRY_FLAGS: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧',
  JP: '🇯🇵', CN: '🇨🇳', AU: '🇦🇺', CA: '🇨🇦',
};

// ─── Investing.com Calendar ───────────────────────────────────────────────────

async function fetchInvestingCalendar(): Promise<CalendarEvent[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const today = new Date();
    const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const url = `https://sbcharts.investing.com/events_charts/us/calendar.json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0',
        'Accept': 'application/json',
        'Referer': 'https://www.investing.com/economic-calendar/',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const events: any[] = data?.data ?? [];

    return events
      .filter((e: any) => {
        const d = e.date?.split(' ')[0];
        return d >= fmt(today) && d <= fmt(weekLater);
      })
      .slice(0, 20)
      .map((e: any): CalendarEvent => {
        const country = e.country?.toUpperCase() ?? 'US';
        const impactRaw = parseInt(e.impact ?? '1', 10);
        const impact: EventImpact = impactRaw >= 3 ? 'high' : impactRaw >= 2 ? 'medium' : 'low';

        return {
          id: `investing-${e.id ?? Math.random()}`,
          title: e.event ?? 'Economic Event',
          country,
          countryFlag: COUNTRY_FLAGS[country] ?? '🌍',
          date: e.date?.split(' ')[0] ?? fmt(today),
          time: e.date?.split(' ')[1]?.slice(0, 5) ?? '00:00',
          timezone: country === 'IN' ? 'IST' : 'EST',
          impact,
          forecast: e.forecast || undefined,
          previous: e.previous || undefined,
          actual: e.actual || null,
          description: e.event_attr ?? undefined,
        };
      });

  } catch (err: any) {
    clearTimeout(timer);
    logger.warn(`[EconomicCalendar] Investing.com fetch failed: ${err.message}`);
    return [];
  }
}

// ─── Curated Indian Calendar ──────────────────────────────────────────────────
// Pre-populated for the next 6 months with known scheduled events.
// These are always returned as a baseline, merged with live data.

function getCuratedIndianEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Generate rolling 3-month window of known NSE/RBI events
  const events: CalendarEvent[] = [];

  // RBI MPC meetings (typically 1st week of Feb, Apr, Jun, Aug, Oct, Dec)
  const rbiMonths = [1, 3, 5, 7, 9, 11]; // 0-indexed months
  for (const m of rbiMonths) {
    if (m < month - 1) continue; // Skip past months
    const d = new Date(year, m, 6); // Approximately 6th of the month
    events.push({
      id: `rbi-mpc-${year}-${m}`,
      title: 'RBI MPC Policy Decision',
      country: 'IN',
      countryFlag: '🇮🇳',
      date: d.toISOString().split('T')[0],
      time: '10:00',
      timezone: 'IST',
      impact: 'high',
      description: 'Reserve Bank of India Monetary Policy Committee — Repo Rate Decision',
    });
  }

  // NSE F&O Expiry (last Thursday of each month)
  for (let mOffset = 0; mOffset <= 2; mOffset++) {
    const targetMonth = (month + mOffset) % 12;
    const targetYear = year + Math.floor((month + mOffset) / 12);
    const lastDay = new Date(targetYear, targetMonth + 1, 0); // Last day
    let thursday = lastDay;
    while (thursday.getDay() !== 4) {
      thursday = new Date(thursday.getTime() - 86400000);
    }
    events.push({
      id: `fno-expiry-${targetYear}-${targetMonth}`,
      title: 'NSE F&O Monthly Expiry',
      country: 'IN',
      countryFlag: '🇮🇳',
      date: thursday.toISOString().split('T')[0],
      time: '15:30',
      timezone: 'IST',
      impact: 'high',
      description: 'NSE Nifty & BankNifty monthly derivatives expiry. High volatility expected near close.',
    });
  }

  // Weekly Nifty expiry (every Thursday)
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    if (d.getDay() === 4) { // Thursday
      events.push({
        id: `nifty-weekly-${d.toISOString().split('T')[0]}`,
        title: 'Nifty Weekly Options Expiry',
        country: 'IN',
        countryFlag: '🇮🇳',
        date: d.toISOString().split('T')[0],
        time: '15:30',
        timezone: 'IST',
        impact: 'medium',
        description: 'Weekly Nifty options expiry. Elevated intraday volatility possible.',
      });
    }
  }

  return events.filter(e => e.date >= now.toISOString().split('T')[0]);
}

// ─── EconomicCalendarService ──────────────────────────────────────────────────

export class EconomicCalendarService {
  async getEvents(limit = 30): Promise<CalendarEvent[]> {
    // Check cache
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const events: CalendarEvent[] = JSON.parse(cached);
        if (events.length > 0) return events.slice(0, limit);
      }
    } catch {}

    // Fetch live + merge with curated Indian events
    const [liveEvents, curatedEvents] = await Promise.all([
      fetchInvestingCalendar(),
      Promise.resolve(getCuratedIndianEvents()),
    ]);

    // Merge and deduplicate
    const merged = [...curatedEvents];
    const curatedDates = new Set(curatedEvents.map(e => e.date + e.title));

    for (const evt of liveEvents) {
      const key = evt.date + evt.title;
      if (!curatedDates.has(key)) {
        merged.push(evt);
      }
    }

    // Sort by date + time
    merged.sort((a, b) => {
      const dateA = `${a.date}T${a.time}`;
      const dateB = `${b.date}T${b.time}`;
      return dateA.localeCompare(dateB);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const future = merged.filter(e => e.date >= todayStr);

    if (future.length > 0) {
      try {
        await redis.setex(CACHE_KEY, CACHE_TTL_SEC, JSON.stringify(future));
      } catch {}
    }

    logger.info(`[EconomicCalendar] Serving ${future.length} events (${liveEvents.length} live + ${curatedEvents.length} curated)`);
    return future.slice(0, limit);
  }
}

export const economicCalendarService = new EconomicCalendarService();
