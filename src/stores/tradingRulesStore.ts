import { create } from 'zustand';
import { TradingRules } from '../types';
import { api } from '../lib/api';

interface TradingRulesState {
  rules: TradingRules | null;
  loading: boolean;
  fetchRules: () => Promise<void>;
  saveRules: (rules: Partial<TradingRules>) => Promise<{ error?: string }>;
}

export const useTradingRulesStore = create<TradingRulesState>((set) => ({
  rules: null,
  loading: false,

  fetchRules: async () => {
    set({ loading: true });
    try {
      const data = await api.get<TradingRules | null>('/trading-rules');
      set({ rules: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveRules: async (rules) => {
    try {
      const saved = await api.post<TradingRules>('/trading-rules', rules);
      set({ rules: saved });
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to save rules' };
    }
  },
}));
