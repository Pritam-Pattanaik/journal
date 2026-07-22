import React, { useState, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { RefreshCw, ChevronRight, Menu } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useBrokerStore } from '../../stores/brokerStore';
import { useTradeStore } from '../../stores/tradeStore';
import { CommandPalette } from '../ui/CommandPalette';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';

function relativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 10)  return 'just now';
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Header() {
  const location = useLocation();
  const { setSidebarOpen } = useUIStore();
  const { connections, syncConnection } = useBrokerStore();
  const fetchTrades = useTradeStore(s => s.fetchTrades);

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastManualSync, setLastManualSync] = useState<Date | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);

  const getBreadcrumbs = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 2) return []; // Hide breadcrumbs for top-level pages (e.g. /app, /app/markets)
    
    const crumbs = [{ name: 'Dashboard', path: '/app' }];
    if (parts[1]) {
      crumbs.push({
        name: parts[1].charAt(0).toUpperCase() + parts[1].slice(1).replace(/-/g, ' '),
        path: `/app/${parts[1]}`,
      });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const latestSyncedAt = React.useMemo(() => {
    const times = connections
      .filter(c => c.isActive && c.lastSyncedAt)
      .map(c => new Date(c.lastSyncedAt!).getTime())
      .filter(t => !isNaN(t));
    const extra = lastManualSync ? lastManualSync.getTime() : 0;
    if (times.length === 0 && !extra) return null;
    return new Date(Math.max(...times, extra));
  }, [connections, lastManualSync]);

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    const active = connections.filter(c => c.isActive);
    if (!active.length) return;
    setIsSyncing(true);
    try {
      await Promise.allSettled(active.map(c => syncConnection(c.broker)));
      await fetchTrades();
      setLastManualSync(new Date());
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, connections, syncConnection, fetchTrades]);

  const activeConnections = connections.filter(c => c.isActive).length;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between px-6 gap-4 bg-transparent pt-2">

        {/* Left — Mobile menu + Breadcrumbs */}
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-4 w-4" />
          </Button>
          {breadcrumbs.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1.5" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={crumb.path}>
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted" />}
                  <Link
                    to={crumb.path}
                    className={cn(
                      'text-[13px] transition-colors hover:text-primary',
                      i === breadcrumbs.length - 1 ? 'text-primary font-semibold' : 'text-tertiary font-medium'
                    )}
                  >
                    {crumb.name}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right — Sync Status Only */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {activeConnections > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted">
                {latestSyncedAt ? `Synced ${relativeTime(latestSyncedAt)}` : 'Not synced'}
              </span>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                title="Force sync broker trades"
                aria-label="Force sync broker trades"
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg',
                  'text-tertiary hover:text-primary hover:bg-surface-2 transition-colors',
                  'focus:outline-none focus-ring disabled:opacity-40'
                )}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin text-accent')} />
              </button>
            </div>
          )}
        </div>
      </header>

      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
    </>
  );
}
