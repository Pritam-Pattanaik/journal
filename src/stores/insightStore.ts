import { create } from 'zustand';
import { api } from '../lib/api';
import { AIInsight } from '../types';

export interface CoachMemory {
  id: string;
  userId: string;
  patternType: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'improving' | 'positive';
  count: number;
  previousCount: number;
  avgPnl: string | null;
  detectedAt: string;
  updatedAt: string;
}

interface InsightState {
  insights: AIInsight[];
  coachMemory: CoachMemory[];
  loading: boolean;
  error: string | null;
  fetchInsights: () => Promise<void>;
  fetchCoachMemory: () => Promise<void>;
  runAnalysis: () => Promise<void>;
}

export const useInsightStore = create<InsightState>((set) => ({
  insights: [],
  coachMemory: [],
  loading: false,
  error: null,

  fetchInsights: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<AIInsight[]>('/insights');
      set({ insights: response || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch insights', loading: false });
    }
  },

  fetchCoachMemory: async () => {
    try {
      const response = await api.get<CoachMemory[]>('/coach-memory');
      set({ coachMemory: response || [] });
    } catch {
      // Non-blocking — don't show error for memory fetch
    }
  },

  runAnalysis: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<AIInsight>('/insights/analyze', {});
      set((state) => ({
        insights: [response, ...state.insights],
        loading: false,
      }));
      // Refresh coach memory after analysis since new patterns may have been saved
      const memories = await api.get<CoachMemory[]>('/coach-memory');
      set({ coachMemory: memories || [] });
    } catch (error: any) {
      set({ error: error.message || 'Failed to run analysis', loading: false });
      throw error;
    }
  },
}));
