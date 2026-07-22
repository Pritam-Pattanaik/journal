import { create } from 'zustand';
import { api } from '../lib/api';

interface ReflectionState {
  weeklyReviews: any[];
  monthlyReflections: any[];
  loading: boolean;
  generatingWeekly: boolean;
  fetchWeekly: () => Promise<void>;
  fetchMonthly: () => Promise<void>;
  addMonthly: (month: string, answers: any) => Promise<void>;
}

export const useReflectionStore = create<ReflectionState>((set, get) => ({
  weeklyReviews: [],
  monthlyReflections: [],
  loading: false,
  generatingWeekly: false,
  fetchWeekly: async () => {
    set({ loading: true });
    try {
      const data = await api.get<any[]>('/reflections/weekly');
      set({ weeklyReviews: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchMonthly: async () => {
    set({ loading: true });
    try {
      const data = await api.get<any[]>('/reflections/monthly');
      set({ monthlyReflections: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addMonthly: async (month, answers) => {
    try {
      const newRef = await api.post<any>('/reflections/monthly', { month, answers });
      set({ monthlyReflections: [newRef, ...get().monthlyReflections] });
    } catch (e) {
      console.error(e);
    }
  }
}));
