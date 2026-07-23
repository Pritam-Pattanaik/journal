import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldAlert, TrendingDown, Target, Activity, FileText, 
  ChevronRight, Brain, AlertTriangle, CheckCircle2, Info 
} from 'lucide-react';
import { NotificationItem, useNotificationStore } from '../../stores/notificationStore';
import { cn } from '../../lib/cn';
import { Link } from 'react-router-dom';

const PRIORITY_CONFIG = {
  Critical: {
    icon: AlertTriangle,
    color: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/30',
    glow: 'group-hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]' // Using safe hex equivalent
  },
  Warning: {
    icon: ShieldAlert,
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    glow: 'group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]'
  },
  Success: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/30',
    glow: 'group-hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]'
  },
  Information: {
    icon: Info,
    color: 'text-info',
    bg: 'bg-info/10',
    border: 'border-info/30',
    glow: 'group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]'
  }
};

const CATEGORY_ICONS = {
  Trading: Target,
  Risk: TrendingDown,
  Market: Activity,
  AI: Brain,
  Reports: FileText
};

function relativeTime(date: number): string {
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface NotificationCardProps {
  notification: NotificationItem;
}

export const NotificationCard = memo(function NotificationCard({ notification }: NotificationCardProps) {
  const { markAsRead, deleteNotification } = useNotificationStore();
  const config = PRIORITY_CONFIG[notification.priority];
  const CategoryIcon = CATEGORY_ICONS[notification.category];
  const PriorityIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden', scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "group relative w-full flex flex-col p-4 rounded-xl transition-all duration-300",
        "bg-surface-0 border shadow-sm backdrop-blur-md",
        notification.isRead ? "border-border/40 opacity-80" : `border-border/80 ${config.glow}`,
        !notification.isRead && "bg-surface-1/50"
      )}
    >
      {/* Left Priority Indicator Line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-colors duration-300",
        notification.isRead ? "bg-transparent" : config.color.replace('text-', 'bg-')
      )} />

      <div className="flex items-start gap-3 w-full">
        {/* Icon */}
        <div className={cn(
          "shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border",
          config.bg, config.border, config.color
        )}>
          <PriorityIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center justify-between mb-1 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4 className={cn("text-sm font-semibold truncate", notification.isRead ? "text-secondary" : "text-primary")}>
                {notification.title}
              </h4>
              {!notification.isRead && (
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 animate-pulse", config.color.replace('text-', 'bg-'))} />
              )}
            </div>
            <span className="text-[11px] font-medium text-tertiary shrink-0 whitespace-nowrap">
              {relativeTime(notification.timestamp)}
            </span>
          </div>

          <p className="text-[13px] text-tertiary leading-relaxed mb-3">
            {notification.description}
          </p>

          <div className="flex items-center justify-between">
            {/* Category Tag */}
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-tertiary uppercase tracking-wider">
              <CategoryIcon className="w-3 h-3" />
              {notification.category}
            </div>

            {/* Action Button */}
            {notification.actionLabel && (
              notification.actionUrl ? (
                <Link
                  to={notification.actionUrl}
                  onClick={() => markAsRead(notification.id)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  {notification.actionLabel}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-accent hover:text-accent-hover transition-colors"
                >
                  {notification.actionLabel}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Dismiss Button - Absolute top right, fades in on hover */}
      <button
        onClick={() => deleteNotification(notification.id)}
        className="absolute top-3 right-3 p-1.5 text-tertiary opacity-0 group-hover:opacity-100 hover:bg-surface-2 hover:text-danger rounded-md transition-all focus:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Mark as read overlay (if unread and clicked outside action button) */}
      {!notification.isRead && (
        <button
          className="absolute inset-0 z-[-1] opacity-0 cursor-default"
          onClick={() => markAsRead(notification.id)}
          tabIndex={-1}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
});
