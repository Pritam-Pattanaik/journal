import { create } from 'zustand';
import { api } from '../lib/api';

interface AnalyticsState {
  mistakes: any[];
  session: any;
  risk: any;
  loading: boolean;
  fetchAnalytics: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  mistakes: [],
  session: null,
  risk: null,
  loading: false,
  fetchAnalytics: async () => {
    set({ loading: true });
    try {
      const [mistakes, session, risk] = await Promise.all([
        api.get<any[]>('/analytics/mistakes'),
        api.get<any>('/analytics/session'),
        api.get<any>('/analytics/risk')
      ]);
      set({ mistakes, session, risk, loading: false });
    } catch {
      set({ loading: false });
    }
  }
}));
