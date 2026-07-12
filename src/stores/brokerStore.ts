import { create } from 'zustand';
import { api } from '../lib/api';
import { useTradeStore } from './tradeStore';

export interface BrokerConnection {
  id: string;
  broker: string;
  clientId?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  createdAt: string;
}

interface SyncResult {
  error?: string;
  count?: number;
  alreadySyncing?: boolean;
}

interface BrokerStore {
  connections: BrokerConnection[];
  isLoading: boolean;
  // Per-broker sync tracking: key = broker id, value = true if syncing
  syncingBrokers: Record<string, boolean>;
  // True if ANY broker is currently syncing
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  error: string | null;
  fetchConnections: () => Promise<void>;
  addConnection: (payload: { broker: string; apiKey: string; apiSecret?: string; clientId?: string; metadata?: string }) => Promise<{ error?: string }>;
  removeConnection: (broker: string) => Promise<{ error?: string }>;
  syncConnection: (broker: string, fullSync?: boolean) => Promise<SyncResult>;
  syncAll: (fullSync?: boolean) => Promise<{ totalSynced: number; errors: string[] }>;
}

export const useBrokerStore = create<BrokerStore>((set, get) => ({
  connections: [],
  isLoading: false,
  syncingBrokers: {},
  isSyncing: false,
  lastSyncedAt: null,
  lastSyncError: null,
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
      await get().fetchConnections();
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to save connection' };
    }
  },

  removeConnection: async (broker) => {
    try {
      await api.delete(`/brokers/${broker}`);
      await get().fetchConnections();
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to disconnect broker' };
    }
  },

  syncConnection: async (broker, fullSync = false): Promise<SyncResult> => {
    // Mark this broker as syncing
    set(state => ({
      syncingBrokers: { ...state.syncingBrokers, [broker]: true },
      isSyncing: true,
      lastSyncError: null,
    }));

    try {
      const url = fullSync ? `/brokers/sync/${broker}?full=true` : `/brokers/sync/${broker}`;
      const data = await api.post<{ success: boolean; count: number; alreadySyncing?: boolean }>(url, {});

      // Refresh broker list to get updated lastSyncedAt
      await get().fetchConnections();

      // Always refresh trades after a sync completes so Trades page stays current
      await useTradeStore.getState().fetchTrades();

      set({ lastSyncedAt: new Date().toISOString() });

      return { count: data.count, alreadySyncing: data.alreadySyncing };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to sync broker';
      set({ lastSyncError: errorMsg });
      return { error: errorMsg };
    } finally {
      // Unmark this broker; recalculate global isSyncing
      set(state => {
        const updated = { ...state.syncingBrokers, [broker]: false };
        const stillSyncing = Object.values(updated).some(Boolean);
        return { syncingBrokers: updated, isSyncing: stillSyncing };
      });
    }
  },

  /**
   * Sync ALL active broker connections in parallel.
   * Used by App.tsx on login and by the periodic background interval.
   * Always refreshes trades once ALL brokers finish (not once per broker).
   */
  syncAll: async (fullSync = false) => {
    const { connections, syncingBrokers } = get();
    const activeBrokers = connections.filter(c => c.isActive);

    if (activeBrokers.length === 0) return { totalSynced: 0, errors: [] };

    // Mark all active brokers as syncing at once
    const newSyncingMap: Record<string, boolean> = { ...syncingBrokers };
    activeBrokers.forEach(c => { newSyncingMap[c.broker] = true; });
    set({ syncingBrokers: newSyncingMap, isSyncing: true, lastSyncError: null });

    let totalSynced = 0;
    const errors: string[] = [];

    try {
      const results = await Promise.allSettled(
        activeBrokers.map(c => {
          const url = fullSync
            ? `/brokers/sync/${c.broker}?full=true`
            : `/brokers/sync/${c.broker}`;
          return api.post<{ success: boolean; count: number }>(url, {});
        })
      );

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          totalSynced += result.value?.count ?? 0;
        } else {
          errors.push(`${activeBrokers[i].broker}: ${result.reason?.message || 'Unknown error'}`);
        }
      });

      // Refresh broker list to get updated lastSyncedAt timestamps
      await get().fetchConnections();

      // Single trade fetch after all brokers done
      await useTradeStore.getState().fetchTrades();

      set({ lastSyncedAt: new Date().toISOString() });
    } catch (err: any) {
      errors.push(err.message || 'Sync failed');
      set({ lastSyncError: errors.join(', ') });
    } finally {
      // Release all locks
      const clearedMap: Record<string, boolean> = { ...get().syncingBrokers };
      activeBrokers.forEach(c => { clearedMap[c.broker] = false; });
      set({ syncingBrokers: clearedMap, isSyncing: false });
    }

    return { totalSynced, errors };
  },
}));
