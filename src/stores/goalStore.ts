import { create } from 'zustand';
import { api } from '../lib/api';

interface GoalState {
  goals: any[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  addGoal: (goal: any) => Promise<void>;
  completeGoal: (id: string, date: string, completed: boolean) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,
  fetchGoals: async () => {
    set({ loading: true });
    try {
      const data = await api.get<any[]>('/goals');
      set({ goals: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  addGoal: async (goal) => {
    try {
      const newGoal = await api.post<any>('/goals', goal);
      set({ goals: [...get().goals, { ...newGoal, completions: [] }] });
    } catch (e) {
      console.error(e);
    }
  },
  completeGoal: async (id, date, completed) => {
    try {
      const comp = await api.post<any>(`/goals/${id}/complete`, { date, completed });
      set({
        goals: get().goals.map(g => {
          if (g.id === id) {
            return { ...g, completions: [...g.completions, comp] };
          }
          return g;
        })
      });
    } catch (e) {
      console.error(e);
    }
  }
}));
