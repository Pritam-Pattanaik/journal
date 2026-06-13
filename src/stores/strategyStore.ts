import { create } from 'zustand';
import { api } from '../lib/api';
import { Strategy } from '../types';

interface StrategyState {
  strategies: Strategy[];
  loading: boolean;
  error: string | null;
  fetchStrategies: () => Promise<void>;
  addStrategy: (strategy: Omit<Strategy, 'id' | 'totalPnl' | 'winRate' | 'tradeCount' | 'avgPnl'>) => Promise<void>;
  updateStrategy: (id: string, updates: Partial<Strategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  strategies: [],
  loading: false,
  error: null,

  fetchStrategies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<Strategy[]>('/strategies');
      set({ strategies: response || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch strategies', loading: false });
    }
  },

  addStrategy: async (strategy) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Strategy>('/strategies', strategy);
      set((state) => ({
        strategies: [response, ...state.strategies],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to add strategy', loading: false });
      throw error;
    }
  },

  updateStrategy: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch<Strategy>(`/strategies/${id}`, updates);
      set((state) => ({
        strategies: state.strategies.map((strat) => 
          strat.id === id ? response : strat
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update strategy', loading: false });
      throw error;
    }
  },

  deleteStrategy: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/strategies/${id}`);
      set((state) => ({
        strategies: state.strategies.filter((strat) => strat.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete strategy', loading: false });
      throw error;
    }
  },
}));
