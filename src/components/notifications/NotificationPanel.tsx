import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellRing, X, Check, Trash2, Filter, Volume2, VolumeX, Search,
  CheckCircle2
} from 'lucide-react';
import { useNotificationStore, NotificationFilter } from '../../stores/notificationStore';
import { NotificationCard } from './NotificationCard';
import { useNotificationSound } from '../../hooks/useNotificationSound';
import { cn } from '../../lib/cn';
import { SkeletonLoader } from '../ui/SkeletonLoader';

const FILTERS: NotificationFilter[] = ['All', 'Trading', 'AI', 'Risk', 'Market', 'Reports', 'Unread'];

export function NotificationPanel() {
  const {
    notifications, filter, setFilter, isPanelOpen, setPanelOpen,
    markAllAsRead, clearAll, soundEnabled, setSoundEnabled
  } = useNotificationStore();
  
  const [isLoading, setIsLoading] = React.useState(true);
  const { playSound } = useNotificationSound();
  const prevCountRef = useRef(notifications.length);

  useEffect(() => {
    if (isPanelOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isPanelOpen]);

  // Play sound when a new notification arrives
  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      // Find the newest notification's priority
      const newest = notifications[0];
      if (newest && !newest.isRead) {
        playSound(newest.priority);
      }
    }
    prevCountRef.current = notifications.length;
  }, [notifications, playSound]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'All') return true;
      if (filter === 'Unread') return !n.isRead;
      return n.category === filter;
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-canvas/40 backdrop-blur-[2px]"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5, boxShadow: '0px 0px 0px rgba(0,0,0,0)' }}
            animate={{ x: 0, opacity: 1, boxShadow: '0px 24px 64px rgba(0,0,0,0.15)' }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-surface-0/95 backdrop-blur-3xl border-l border-border/50 flex flex-col shadow-floating"
            role="dialog"
            aria-label="Notification Center"
          >
            {/* Header */}
            <div className="flex flex-col px-5 pt-5 pb-3 border-b border-border/40 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <BellRing className="w-5 h-5 text-primary" />
                    {unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        key={unreadCount}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full"
                      />
                    )}
                  </div>
                  <h2 className="text-lg font-display font-bold text-primary">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold tabular-nums">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1.5 text-tertiary hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
                    title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1.5 text-tertiary hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted group-focus-within:text-accent transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search alerts..." 
                    className="w-full pl-8 pr-3 py-1.5 bg-surface-1 border border-border/50 rounded-lg text-[13px] text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  />
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="px-2.5 py-1.5 text-[12px] font-semibold text-tertiary hover:text-primary disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Read All
                  </button>
                  <button
                    onClick={clearAll}
                    disabled={notifications.length === 0}
                    className="px-2.5 py-1.5 text-[12px] font-semibold text-tertiary hover:text-danger disabled:opacity-40 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Filters (Horizontal Scroll) */}
              <div className="flex gap-2 overflow-x-auto scrollbar-none mask-edges-horizontal pb-1">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-3 py-1 text-[12px] font-bold rounded-full whitespace-nowrap transition-all",
                      filter === f 
                        ? "bg-primary text-inverse shadow-sm" 
                        : "bg-surface-1 text-tertiary hover:text-primary hover:bg-surface-2"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 space-y-2 relative">
              <AnimatePresence initial={false} mode="popLayout">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full flex flex-col p-4 rounded-xl bg-surface-0 border border-border/40 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <SkeletonLoader width={32} height={32} className="rounded-lg shrink-0" />
                        <div className="flex-1">
                          <SkeletonLoader width="60%" height={14} className="rounded mb-2" />
                          <SkeletonLoader width="100%" height={12} className="rounded mb-1" />
                          <SkeletonLoader width="80%" height={12} className="rounded mb-3" />
                          <div className="flex justify-between">
                            <SkeletonLoader width={60} height={12} className="rounded" />
                            <SkeletonLoader width={80} height={12} className="rounded" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : filteredNotifications.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center mb-4 border border-border/50">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-base font-bold text-primary mb-1">You're all caught up!</h3>
                    <p className="text-sm text-tertiary">No new notifications in this category.</p>
                    <button 
                      onClick={() => setPanelOpen(false)}
                      className="mt-6 px-4 py-2 bg-surface-2 hover:bg-surface-3 text-secondary font-bold text-xs rounded-lg transition-colors"
                    >
                      Return to Dashboard
                    </button>
                  </motion.div>
                ) : (
                  filteredNotifications.map(notification => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
