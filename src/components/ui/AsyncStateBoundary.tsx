import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCcw, WifiOff, ShieldAlert, FileQuestion, Activity } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

export interface AsyncStateBoundaryProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null | { status?: number; message?: string };
  isDegraded?: boolean;
  degradedMessage?: string;
  onRetry?: () => void;
  skeletonFallback?: React.ReactNode;
  className?: string;
}

export const AsyncStateBoundary: React.FC<AsyncStateBoundaryProps> = ({
  children,
  isLoading = false,
  isFetching = false,
  error = null,
  isDegraded = false,
  degradedMessage = "External Broker Sync Degraded · Displaying Local Cache",
  onRetry,
  skeletonFallback,
  className,
}) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [backoffSeconds, setBackoffSeconds] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatic Rate Limit (HTTP 429) backoff timer
  useEffect(() => {
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
      setBackoffSeconds(15);
      const timer = setInterval(() => {
        setBackoffSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (onRetry) onRetry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [error, onRetry]);

  // 1. Initial Loading Skeleton State (No cache present)
  if (isLoading && !isFetching && !children) {
    return (
      <div className={cn("w-full relative min-h-[200px] flex items-center justify-center", className)}>
        {skeletonFallback || (
          <div className="w-full h-48 bg-surface-1/50 rounded-2xl animate-pulse flex items-center justify-center border border-border/40">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-tertiary">
              <Activity className="w-4 h-4 animate-spin text-iris" />
              <span>Synchronizing institutional ledger...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Offline Network State
  if (isOffline) {
    return (
      <div className={cn("w-full rounded-2xl bg-surface-1 border border-warning/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm", className)}>
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-primary">Offline Execution Mode Active</h4>
            <p className="text-xs text-secondary leading-relaxed">
              No internet connection detected. Read-only exploration is enabled via encrypted localized storage. Order submissions are locked until connection stabilizes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 text-xs font-semibold text-tertiary">
          <span>Reconnecting automatic</span>
          <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
        </div>
      </div>
    );
  }

  // 3. Error States with granular HTTP status discrimination
  if (error) {
    const status = 'status' in error && typeof error.status === 'number' ? error.status : 500;
    const errorMessage = error.message || 'An unexpected failure occurred while fetching real-time data.';

    // Permission Denied (HTTP 403)
    if (status === 403) {
      return (
        <div className={cn("w-full rounded-2xl bg-surface-1 border border-danger/40 p-8 text-center flex flex-col items-center justify-center gap-3 max-w-lg mx-auto", className)}>
          <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary">Access Forbidden (403)</h3>
          <p className="text-sm text-secondary">
            Your current institutional credential or API token lacks permission to view or execute this resource. Contact your evaluation desk administrator.
          </p>
        </div>
      );
    }

    // Resource Not Found (HTTP 404)
    if (status === 404) {
      return (
        <div className={cn("w-full rounded-2xl bg-surface-1 border border-border p-8 text-center flex flex-col items-center justify-center gap-3 max-w-lg mx-auto", className)}>
          <div className="w-12 h-12 rounded-2xl bg-surface-2 text-tertiary flex items-center justify-center">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-primary">Resource Not Found (404)</h3>
          <p className="text-sm text-secondary">
            The requested trade log, strategy configuration, or broker journal could not be located in active storage.
          </p>
        </div>
      );
    }

    // Rate Limiting (HTTP 429)
    if (status === 429) {
      return (
        <div className={cn("w-full rounded-2xl bg-surface-1 border border-warning/40 p-6 flex items-center justify-between gap-4", className)}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning/15 text-warning flex items-center justify-center font-bold text-sm">
              429
            </div>
            <div>
              <h4 className="font-bold text-sm text-primary">API Rate Limit Threshold Exceeded</h4>
              <p className="text-xs text-secondary">
                To prevent execution flood and broker denial, queries have paused. Auto-resuming in <strong className="text-warning font-semibold">{backoffSeconds}s</strong>...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Default 500 / Network Exception with Retry
    return (
      <div className={cn("w-full rounded-2xl bg-surface-1 border border-danger/30 p-8 text-center flex flex-col items-center justify-center gap-3", className)}>
        <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-display font-bold text-lg text-primary">State Synchronization Failed</h3>
        <p className="text-sm text-secondary max-w-md leading-relaxed">
          {errorMessage}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary" className="mt-2 text-xs font-semibold px-5 py-2.5">
            <RefreshCcw className="w-3.5 h-3.5 mr-2" />
            <span>Retry Reconcile</span>
          </Button>
        )}
      </div>
    );
  }

  // 4. Stale-While-Revalidate & Partial Degradation UI Execution
  return (
    <div className={cn("relative w-full transition-all", className)}>
      {/* Silent background revalidation progress bar (Zero-CLS) */}
      {isFetching && (
        <div className="absolute top-2 right-2 z-30 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas/90 backdrop-blur-md border border-border/80 text-[11px] font-medium text-secondary shadow-xs pointer-events-none animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-iris animate-pulse" />
          <span>Syncing Background Cache...</span>
        </div>
      )}

      {/* Partial Fault Degradation Ribbon */}
      {isDegraded && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-between text-xs text-secondary font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span className="font-semibold text-primary">{degradedMessage}</span>
          </div>
          {onRetry && (
            <button 
              onClick={onRetry} 
              className="text-[11px] font-bold text-warning hover:underline outline-none"
            >
              Force Sync
            </button>
          )}
        </div>
      )}

      {children}
    </div>
  );
};
