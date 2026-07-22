import { create } from 'zustand';
import { api } from '../lib/api';
import { EnrichedNews } from '../types';

interface NewsState {
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
}

export const useNewsStore = create<NewsState>((set) => ({
  news: [],
  calendar: [],
  loadingNews: false,
  loadingCalendar: false,
  enrichingId: null,
  
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
  }
}));
