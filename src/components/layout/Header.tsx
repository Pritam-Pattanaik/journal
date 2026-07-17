import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { RefreshCw, Search, Moon, Sun, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useBrokerStore } from '../../stores/brokerStore';
import { useTradeStore } from '../../stores/tradeStore';
import { CommandPalette } from '../ui/CommandPalette';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import UserProfileDropdown from './UserProfileDropdown';

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
  const { theme, toggleTheme } = useUIStore();
  const { profile } = useAuthStore();
  const { connections, syncConnection } = useBrokerStore();
  const fetchTrades = useTradeStore(state => state.fetchTrades);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);

  const getBreadcrumbs = (pathname: string) => {
    const paths = pathname.split('/').filter(Boolean);
    if (paths.length === 0 || paths[0] !== 'app') return [];
    
    const breadcrumbs = [{ name: 'Dashboard', path: '/app' }];
    if (paths[1]) {
      breadcrumbs.push({
        name: paths[1].charAt(0).toUpperCase() + paths[1].slice(1),
        path: `/app/${paths[1]}`
      });
    }
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const latestSyncedAt = React.useMemo(() => {
    const activeTimes = connections
      .filter(c => c.isActive && c.lastSyncedAt)
      .map(c => new Date(c.lastSyncedAt!).getTime())
      .filter(t => !isNaN(t));
    if (activeTimes.length === 0) return null;
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
      await fetchTrades();
      setLastManualSync(new Date());
    } catch (e: any) {
      setSyncError(e.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, connections, syncConnection, fetchTrades]);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-black/5 dark:border-white/5 bg-canvas/80 backdrop-blur-md px-8 lg:px-12 transition-colors">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="h-4 w-4 text-tertiary" />}
              <Link 
                to={crumb.path}
                className={cn(
                  "text-[13px] font-medium transition-colors hover:text-primary",
                  idx === breadcrumbs.length - 1 ? "text-primary font-bold" : "text-secondary"
                )}
              >
                {crumb.name}
              </Link>
            </React.Fragment>
          ))}
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
          <button
            onClick={() => setCmdOpen(true)}
            className="flex h-10 w-[320px] items-center gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-surface-1 px-4 text-[13px] text-tertiary font-medium transition-all hover:bg-surface-2 hover:text-primary outline-none focus-visible:ring-1 focus-visible:ring-accent shadow-sm"
          >
            <Search className="h-4 w-4" />
            <span>Search commands...</span>
            <kbd className="ml-auto flex h-6 items-center justify-center gap-1 rounded bg-black/5 dark:bg-white/10 px-2 font-mono text-[10px] font-bold text-secondary">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-3 md:flex">
            {syncError && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-danger">{syncError}</span>
            )}
            <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary">{syncLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleForceSync}
              disabled={isSyncing || connections.filter(c => c.isActive).length === 0}
              className="h-9 w-9 rounded-xl hover:bg-surface-2 text-secondary"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin text-primary")} />
            </Button>
          </div>

          <div className="h-5 w-px bg-black/10 dark:bg-white/10 hidden md:block" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl hover:bg-surface-2 text-secondary"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 hover:text-primary transition-colors" /> : <Moon className="h-4 w-4 hover:text-primary transition-colors" />}
          </Button>

          <UserProfileDropdown />
        </div>
      </header>

      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
    </>
  );
}
