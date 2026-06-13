import { create } from 'zustand';
import { Trade } from '../types';
import { api } from '../lib/api';

// ─── Type adapters (DB → Frontend) ───────────────────────────────────────────
// The DB returns numeric fields as strings (Drizzle numeric type).
// This normalizes them back to numbers.
function normalize(raw: any): Trade {
  return {
    id: raw.id,
    date: raw.date instanceof Date ? raw.date.toISOString() : raw.date,
    symbol: raw.symbol,
    market: raw.market,
    instrumentType: raw.instrumentType,
    direction: raw.direction,
    entryPrice: parseFloat(raw.entryPrice ?? '0') || 0,
    exitPrice: parseFloat(raw.exitPrice ?? '0') || 0,
    quantity: parseFloat(raw.quantity ?? '0') || 0,
    pnl: parseFloat(raw.pnl ?? '0') || 0,
    charges: parseFloat(raw.charges ?? '0') || 0,
    netPnl: parseFloat(raw.netPnl ?? '0') || 0,
    status: raw.status,
    strategyId: raw.strategyId ?? undefined,
    strategyName: raw.strategyName ?? undefined,
    setupDescription: raw.setupDescription ?? undefined,
    mindset: raw.mindset ?? undefined,
    decisionNotes: raw.decisionNotes ?? undefined,
    learnings: raw.learnings ?? undefined,
    disciplineScore: raw.disciplineScore ?? undefined,
    tags: raw.tags ?? undefined,
    source: raw.source ?? 'manual',
  };
}

interface TradeState {
  trades: Trade[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchTrades: () => Promise<void>;
  addTrade: (trade: Omit<Trade, 'id'>) => Promise<void>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  clearAll: () => void;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],
  loading: false,
  error: null,

  fetchTrades: async () => {
    set({ loading: true, error: null });
    try {
      const raw = await api.get<any[]>('/trades');
      set({ trades: raw.map(normalize), loading: false });
    } catch (err: any) {
      console.error('fetchTrades error:', err);
      set({ error: err.message, loading: false });
    }
  },

  addTrade: async (tradeData) => {
    try {
      const raw = await api.post<any>('/trades', tradeData);
      const newTrade = normalize(raw);
      set((state) => ({ trades: [newTrade, ...state.trades] }));
    } catch (err: any) {
      console.error('addTrade error:', err);
      set({ error: err.message });
    }
  },

  updateTrade: async (id, updates) => {
    try {
      const raw = await api.patch<any>(`/trades/${id}`, updates);
      const updated = normalize(raw);
      set((state) => ({
        trades: state.trades.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err: any) {
      console.error('updateTrade error:', err);
      set({ error: err.message });
    }
  },

  deleteTrade: async (id) => {
    try {
      await api.delete(`/trades/${id}`);
      set((state) => ({ trades: state.trades.filter((t) => t.id !== id) }));
    } catch (err: any) {
      console.error('deleteTrade error:', err);
      set({ error: err.message });
    }
  },

  clearAll: () => set({ trades: [] }),
}));
