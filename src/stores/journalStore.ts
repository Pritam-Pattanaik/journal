import { create } from 'zustand';
import { api } from '../lib/api';
import { JournalEntry } from '../types';

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
  addEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<JournalEntry[]>('/journal');
      set({ entries: response || [], loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch journal entries', loading: false });
    }
  },

  addEntry: async (entry) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<JournalEntry>('/journal', entry);
      set((state) => ({
        entries: [response, ...state.entries],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to add journal entry', loading: false });
      throw error;
    }
  },

  updateEntry: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch<JournalEntry>(`/journal/${id}`, updates);
      set((state) => ({
        entries: state.entries.map((entry) => 
          entry.id === id ? response : entry
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update journal entry', loading: false });
      throw error;
    }
  },

  deleteEntry: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/journal/${id}`);
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete journal entry', loading: false });
      throw error;
    }
  },
}));
