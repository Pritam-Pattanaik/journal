import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTradeStore } from '../stores/tradeStore';
import { useBrokerStore } from '../stores/brokerStore';

const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useAutoSync() {
  const initialize = useAuthStore(state => state.initialize);
  const fetchTrades = useTradeStore(state => state.fetchTrades);
  const token = useAuthStore(state => state.token);
  const fetchConnections = useBrokerStore(state => state.fetchConnections);
  const syncAll = useBrokerStore(state => state.syncAll);

  const startupDoneRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startupDoneRef.current = false;
      return;
    }

    if (startupDoneRef.current) return;
    startupDoneRef.current = true;

    const startup = async () => {
      await fetchConnections();
      await fetchTrades();

      const { connections } = useBrokerStore.getState();
      const hasActiveBrokers = connections.some(c => c.isActive);
      if (hasActiveBrokers) {
        syncAll().catch(err => console.warn('[AutoSync] Background sync error:', err));
      }
    };

    startup();

    intervalRef.current = setInterval(async () => {
      const { isSyncing, connections } = useBrokerStore.getState();
      if (isSyncing || !connections.some(c => c.isActive)) return;
      syncAll().catch(err => console.warn('[PeriodicSync] Error:', err));
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, fetchTrades, fetchConnections, syncAll]);
}
