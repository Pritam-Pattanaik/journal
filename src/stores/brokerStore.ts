import { create } from 'zustand';
import { api } from '../lib/api';

export interface BrokerConnection {
  id: string;
  broker: string;
  clientId?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
}

interface BrokerStore {
  connections: BrokerConnection[];
  isLoading: boolean;
  error: string | null;
  fetchConnections: () => Promise<void>;
  addConnection: (payload: { broker: string; apiKey: string; apiSecret?: string; clientId?: string; metadata?: string }) => Promise<{ error?: string }>;
  removeConnection: (broker: string) => Promise<{ error?: string }>;
  syncConnection: (broker: string, fullSync?: boolean) => Promise<{ error?: string; count?: number }>;
}

export const useBrokerStore = create<BrokerStore>((set, get) => ({
  connections: [],
  isLoading: false,
  error: null,

  fetchConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get<BrokerConnection[]>('/brokers');
      set({ connections: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch broker connections', isLoading: false });
    }
  },

  addConnection: async (payload) => {
    try {
      await api.post('/brokers', payload);
      // Refresh list
      await get().fetchConnections();
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to save connection' };
    }
  },

  removeConnection: async (broker) => {
    try {
      await api.delete(`/brokers/${broker}`);
      // Refresh list
      await get().fetchConnections();
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to disconnect broker' };
    }
  },

  syncConnection: async (broker, fullSync = false) => {
    try {
      const url = fullSync ? `/brokers/sync/${broker}?full=true` : `/brokers/sync/${broker}`;
      const data = await api.post<{ success: boolean; count: number }>(url, {});
      await get().fetchConnections();
      return { count: data.count };
    } catch (err: any) {
      return { error: err.message || 'Failed to sync broker' };
    }
  }
}));
