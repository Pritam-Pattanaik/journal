import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Menu, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useBrokerStore } from '../../stores/brokerStore';
import { useTradeStore } from '../../stores/tradeStore';

/** Format a Date into a human-readable relative string like "2h ago", "just now" */
function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export default function Header() {
  const location = useLocation();
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { profile } = useAuthStore();
  const { connections, syncConnection } = useBrokerStore();
  const fetchTrades = useTradeStore(state => state.fetchTrades);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Track when the last manual sync completed (so we can show a local "just now" state)
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);

  const getTitle = (pathname: string) => {
    switch (pathname) {
      case '/app':
      case '/app/':
        return 'Dashboard';
      case '/app/trades':
        return 'Trade Log';
      case '/app/journal':
        return 'Daily Journal';
      case '/app/ai-coach':
        return 'AI Coach';
      case '/app/strategies':
        return 'Strategies';
      case '/app/settings':
        return 'Settings';
      default:
        return 'TradeVault';
    }
  };

  const title = getTitle(location.pathname);

  /** Derive the most recent lastSyncedAt across all active connections */
  const latestSyncedAt = React.useMemo(() => {
    const activeTimes = connections
      .filter(c => c.isActive && c.lastSyncedAt)
      .map(c => new Date(c.lastSyncedAt!).getTime())
      .filter(t => !isNaN(t));
    if (activeTimes.length === 0) return null;
    // Also factor in any completed manual sync from this session
    const extra = lastManualSync ? lastManualSync.getTime() : 0;
    return new Date(Math.max(...activeTimes, extra));
  }, [connections, lastManualSync]);

  const syncLabel = isSyncing
    ? 'Syncing…'
    : latestSyncedAt
    ? `Synced ${relativeTime(latestSyncedAt)}`
    : 'Not synced';

  const handleForceSync = useCallback(async () => {
    if (isSyncing) return;
    const activeBrokers = connections.filter(c => c.isActive);
    if (activeBrokers.length === 0) return;

    setIsSyncing(true);
    setSyncError(null);
    try {
      const results = await Promise.allSettled(
        activeBrokers.map(c => syncConnection(c.broker))
      );
      const failed = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map(r => r.reason?.message || 'Unknown error');
      const errors = results
        .filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value?.error)
        .map(r => (r as PromiseFulfilledResult<any>).value.error);
      const allErrors = [...failed, ...errors];
      if (allErrors.length > 0) {
        setSyncError(allErrors[0]);
        setTimeout(() => setSyncError(null), 5000);
      }
      await fetchTrades();
      setLastManualSync(new Date());
    } catch (e: any) {
      setSyncError(e.message || 'Sync failed');
      setTimeout(() => setSyncError(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, connections, syncConnection, fetchTrades]);

  return (
    <header className="flex items-center justify-between h-[60px] px-4 md:px-6 glass-panel !border-b-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-1.5 rounded text-secondary hover:text-primary transition-all hover:bg-white/10 active:bg-white/20"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Page Title */}
        <h1 className="text-tv-md font-semibold text-primary select-none">
          {title}
        </h1>
      </div>

      {/* Header Actions & Meta */}
      <div className="flex items-center gap-4">
        {/* Live Sync Status — clickable to force re-sync */}
        <button
          onClick={handleForceSync}
          disabled={isSyncing || connections.filter(c => c.isActive).length === 0}
          title={syncError ?? (isSyncing ? 'Syncing…' : 'Click to sync broker trades now')}
          className={`flex items-center gap-2 glass-panel px-3 py-1.5 rounded-tv-lg text-tv-sm transition-all
            ${isSyncing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-white/10 active:bg-white/20'}
            ${syncError ? 'border-red-500/40 text-red-400' : 'text-secondary'}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full inline-block shrink-0 ${
            syncError ? 'bg-red-400' : isSyncing ? 'bg-gold animate-pulse' : 'bg-profit animate-pulse'
          }`} />
          <span className="text-tv-xs select-none whitespace-nowrap">
            {syncError ? 'Sync failed' : syncLabel}
          </span>
          <RefreshCw className={`h-[12px] w-[12px] shrink-0 ${
            isSyncing ? 'animate-spin text-gold' : 'text-accent hover:text-accent-light'
          }`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-secondary hover:text-primary transition-all hover:bg-white/10 active:bg-white/20"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Avatar */}
        <div className="h-8 w-8 rounded-full glass-panel flex items-center justify-center text-accent-light font-medium text-tv-sm hover:bg-white/10 active:bg-white/20 cursor-pointer select-none">
          {profile?.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
}
