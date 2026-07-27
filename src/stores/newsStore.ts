import { create } from 'zustand';
import { api } from '../lib/api';
import { EnrichedNews } from '../types';

// ─── Engine Feed Types ────────────────────────────────────────────────────────

export interface EngineFeedItem {
  id: string;
  headline: string;
  url: string | null;
  source: string;
  publishedAt: string;
  sectors: string[];
  direction: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidence: 'high' | 'medium' | 'low';
  rationale: string;
  historicalAnalogues: string[];
  category: string;
  urgency: 'breaking' | 'routine';
  mode: 'EDUCATIONAL_MODE';
  disclaimer: string;
  scoredAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  type: 'sector' | 'ticker';
  value: string;
  createdAt: string;
}

export interface EngineHealth {
  status: 'healthy' | 'degraded' | 'down';
  engine: { running: boolean; mode: string };
  pipeline: {
    itemsLast1h: number;
    triagePassRate: string;
    triageCircuitBreaker: string;
    scoringCircuitBreaker: string;
  };
  costs: { triageDailyUsd: string; scoringDailyUsd: string };
}

// ─── State Interface ──────────────────────────────────────────────────────────

interface NewsState {
  // Existing news hub state
  news: any[];
  calendar: any[];
  loadingNews: boolean;
  loadingCalendar: boolean;
  enrichingId: string | null;
  fetchNews: (category?: string) => Promise<void>;
  fetchCalendar: () => Promise<void>;
  enrichArticle: (article: any) => Promise<EnrichedNews | null>;
  bookmarkArticle: (id: string, notes?: string) => Promise<void>;
  linkTrade: (newsId: string, tradeId: string, reason?: string) => Promise<void>;

  // AI News Engine state
  engineFeed: EngineFeedItem[];
  loadingFeed: boolean;
  feedError: string | null;
  selectedSector: string | null;
  todayDigest: any | null;
  loadingDigest: boolean;
  availableSectors: string[];
  watchlist: WatchlistItem[];
  loadingWatchlist: boolean;
  engineHealth: EngineHealth | null;

  // Engine actions
  fetchEngineFeed: (filters?: { sector?: string; direction?: string; urgency?: string; limit?: number }) => Promise<void>;
  fetchTodayDigest: () => Promise<void>;
  fetchAvailableSectors: () => Promise<void>;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (type: 'sector' | 'ticker', value: string) => Promise<void>;
  removeFromWatchlist: (id: string) => Promise<void>;
  fetchEngineHealth: () => Promise<void>;
  setSelectedSector: (sector: string | null) => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useNewsStore = create<NewsState>((set, get) => ({
  // Existing state
  news: [],
  calendar: [],
  loadingNews: false,
  loadingCalendar: false,
  enrichingId: null,

  // Engine state
  engineFeed: [],
  loadingFeed: false,
  feedError: null,
  selectedSector: null,
  todayDigest: null,
  loadingDigest: false,
  availableSectors: [],
  watchlist: [],
  loadingWatchlist: false,
  engineHealth: null,

  // ─── Existing actions ─────────────────────────────────────────────────────

  fetchNews: async (category = 'general') => {
    set({ loadingNews: true });
    try {
      const data = await api.get<any[]>(`/news?category=${category}`);
      set({ news: data, loadingNews: false });
    } catch {
      set({ loadingNews: false });
    }
  },

  fetchCalendar: async () => {
    set({ loadingCalendar: true });
    try {
      const data = await api.get<any[]>('/news/economic-calendar');
      set({ calendar: data, loadingCalendar: false });
    } catch {
      set({ loadingCalendar: false });
    }
  },

  enrichArticle: async (article) => {
    set({ enrichingId: article.id });
    try {
      const enriched = await api.post<EnrichedNews>('/news/enrich', article);
      set({ enrichingId: null });
      return enriched;
    } catch (error) {
      console.error('Failed to enrich article:', error);
      set({ enrichingId: null });
      return null;
    }
  },

  bookmarkArticle: async (id, notes) => {
    try {
      await api.post(`/news/${id}/bookmark`, { notes });
    } catch (error) {
      console.error('Failed to bookmark article:', error);
    }
  },

  linkTrade: async (newsId, tradeId, reason) => {
    try {
      await api.post('/news/link-trade', { newsId, tradeId, reason });
    } catch (error) {
      console.error('Failed to link trade:', error);
    }
  },

  // ─── Engine Actions ───────────────────────────────────────────────────────

  fetchEngineFeed: async (filters = {}) => {
    set({ loadingFeed: true, feedError: null });
    try {
      const params = new URLSearchParams();
      if (filters.sector) params.set('sector', filters.sector);
      if (filters.direction) params.set('direction', filters.direction);
      if (filters.urgency) params.set('urgency', filters.urgency);
      if (filters.limit) params.set('limit', String(filters.limit));

      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<{ feed: EngineFeedItem[]; disclaimer: string }>(
        `/news-engine/feed${query}`
      );
      set({ engineFeed: data.feed, loadingFeed: false });
    } catch (err: any) {
      set({ feedError: err.message || 'Failed to load feed', loadingFeed: false });
    }
  },

  fetchTodayDigest: async () => {
    set({ loadingDigest: true });
    try {
      const data = await api.get<any>('/news-engine/digest/today');
      set({ todayDigest: data, loadingDigest: false });
    } catch {
      set({ loadingDigest: false });
    }
  },

  fetchAvailableSectors: async () => {
    try {
      const data = await api.get<{ sectors: string[] }>('/news-engine/sectors');
      set({ availableSectors: data.sectors });
    } catch {}
  },

  fetchWatchlist: async () => {
    set({ loadingWatchlist: true });
    try {
      const data = await api.get<{ watchlist: WatchlistItem[]; availableSectors: string[] }>(
        '/news-engine/watchlist'
      );
      set({ watchlist: data.watchlist, availableSectors: data.availableSectors, loadingWatchlist: false });
    } catch {
      set({ loadingWatchlist: false });
    }
  },

  addToWatchlist: async (type, value) => {
    try {
      const data = await api.post<{ item: WatchlistItem }>('/news-engine/watchlist', { type, value });
      set(state => ({ watchlist: [...state.watchlist, data.item] }));
    } catch (err: any) {
      console.error('Failed to add to watchlist:', err);
    }
  },

  removeFromWatchlist: async (id) => {
    try {
      await api.delete(`/news-engine/watchlist/${id}`);
      set(state => ({ watchlist: state.watchlist.filter(w => w.id !== id) }));
    } catch (err: any) {
      console.error('Failed to remove from watchlist:', err);
    }
  },

  fetchEngineHealth: async () => {
    try {
      const data = await api.get<EngineHealth>('/news-engine/health');
      set({ engineHealth: data });
    } catch {}
  },

  setSelectedSector: (sector) => {
    set({ selectedSector: sector });
    get().fetchEngineFeed({ sector: sector || undefined });
  },
}));
