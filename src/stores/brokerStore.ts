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
  addConnection: (payload: { broker: string; apiKey: string; apiSecret?: string; clientId?: string }) => Promise<{ error?: string }>;
  removeConnection: (broker: string) => Promise<{ error?: string }>;
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
  }
}));
