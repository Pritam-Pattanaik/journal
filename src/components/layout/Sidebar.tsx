import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, LayoutDashboard, BarChart3, BookOpen, Brain,
  Target, Settings, Shield, Users, Link2, ScrollText, Globe,
  ChevronLeft, ChevronRight, X, Search, Bell
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { NotificationPanel } from '../notifications';
import { cn } from '../../lib/cn';
import * as Tooltip from '@radix-ui/react-tooltip';
import UserProfileDropdown from './UserProfileDropdown';

type NavItem = { 
  name: string; 
  path: string; 
  icon: React.ElementType; 
  hasNotification?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { notifications, setPanelOpen, fetchNotifications, initializeSSE } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const { sidebarOpen, setSidebarOpen, desktopSidebarExpanded, toggleDesktopSidebar } = useUIStore();

  const navGroups: NavGroup[] = React.useMemo(() => {
    if (profile?.role === 'SUPER_ADMIN') {
      return [
        {
          label: 'Admin',
          items: [
            { name: 'Overview',   path: '/app',                icon: Shield },
            { name: 'Users',      path: '/app/admin/users',    icon: Users },
            { name: 'Trades',     path: '/app/admin/trades',   icon: BarChart3 },
            { name: 'Brokers',    path: '/app/admin/brokers',  icon: Link2 },
            { name: 'AI Monitor', path: '/app/admin/ai',       icon: Brain, hasNotification: true },
            { name: 'Audit Logs', path: '/app/admin/audit',    icon: ScrollText },
          ]
        },
        {
          label: 'System',
          items: [
            { name: 'Settings',   path: '/app/admin/settings', icon: Settings },
          ]
        }
      ];
    }

    const groups: NavGroup[] = [
      {
        label: 'Workspace',
        items: [
          { name: 'Dashboard',  path: '/app',             icon: LayoutDashboard },
          { name: 'Market & News', path: '/app/markets',  icon: Globe },
          { name: 'Analytics',  path: '/app/analytics',   icon: TrendingUp },
        ]
      },
      {
        label: 'Trading',
        items: [
          { name: 'Trades',     path: '/app/trades',      icon: BarChart3 },
          { name: 'Journal',    path: '/app/journal',     icon: BookOpen },
          { name: 'Strategies', path: '/app/strategies',  icon: Target },
        ]
      },
      {
        label: 'AI',
        items: [
          { name: 'Lunar AI',   path: '/app/ai-coach',    icon: Brain, hasNotification: true },
        ]
      },
      {
        label: 'System',
        items: [
          { name: 'Settings',   path: '/app/settings',    icon: Settings },
        ]
      }
    ];

    if (profile?.role === 'ADMIN' || profile?.role === 'SUB_ADMIN') {
      groups.push({
        label: 'Admin',
        items: [{ name: 'Admin Panel', path: '/app/admin', icon: Shield }]
      });
    }

    return groups;
  }, [profile?.role]);

  // Handle mobile route change close
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Notifications
  useEffect(() => {
    if (profile) {
      fetchNotifications();
      initializeSSE();
    }
  }, [profile, fetchNotifications, initializeSSE]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden bg-surface-0 border-r border-border">
      
      {/* Top Brand Area */}
      <div className={cn(
        "flex items-center p-4 shrink-0 h-[68px]",
        desktopSidebarExpanded ? "justify-between" : "justify-center"
      )}>
        <AnimatePresence initial={false}>
          {desktopSidebarExpanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              <div className="flex flex-col justify-center h-full">
                <span className="font-display font-bold text-primary tracking-tight leading-tight text-lg">TradeVault</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={toggleDesktopSidebar}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-surface-2 text-tertiary hover:text-secondary transition-colors shrink-0"
          aria-label={desktopSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {desktopSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Mobile Close Toggle */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden items-center justify-center w-8 h-8 rounded-md hover:bg-surface-2 text-tertiary hover:text-secondary transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Global Actions (Search & Notifications) */}
      <div className={cn("px-3 mb-4 shrink-0 transition-all duration-200", desktopSidebarExpanded ? "space-y-2" : "space-y-3")}>
        {desktopSidebarExpanded ? (
          <button 
            className="w-full flex items-center gap-2 px-3 py-2 bg-surface-1 hover:bg-surface-2 border border-border rounded-lg text-tertiary hover:text-secondary transition-colors text-sm text-left group"
          >
            <Search className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" />
            <span className="flex-1">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        ) : (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="w-full flex items-center justify-center h-10 bg-surface-1 hover:bg-surface-2 border border-border rounded-lg text-tertiary hover:text-secondary transition-colors group">
                <Search className="w-4 h-4 group-hover:text-primary transition-colors" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right" sideOffset={10} className="bg-surface-elevated border border-border px-3 py-1.5 rounded-md shadow-floating text-xs font-medium text-primary z-50 flex items-center gap-2 animate-in fade-in zoom-in-95">
                Search
                <kbd className="inline-flex items-center text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded border border-border">⌘K</kbd>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}

        {desktopSidebarExpanded ? (
          <button 
            onClick={() => setPanelOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-surface-1 rounded-lg text-secondary transition-colors text-sm text-left group"
          >
            <div className="relative">
              <Bell className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors text-tertiary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-accent rounded-full border border-surface-0"></span>
              )}
            </div>
            <span className="flex-1 font-medium flex justify-between items-center">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-accent text-inverse rounded-md text-[10px] font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>
        ) : (
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button 
                onClick={() => setPanelOpen(true)}
                className="w-full flex items-center justify-center h-10 hover:bg-surface-1 rounded-lg text-secondary transition-colors group relative"
              >
                <Bell className="w-4 h-4 text-tertiary group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-accent rounded-full border border-surface-0"></span>
                )}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="right" sideOffset={10} className="bg-surface-elevated border border-border px-3 py-1.5 rounded-md shadow-floating text-xs font-medium text-primary z-50 animate-in fade-in zoom-in-95">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-3 space-y-6 pb-4">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-1">
            <AnimatePresence initial={false}>
              {desktopSidebarExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 mb-2"
                >
                  <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{group.label}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
              
              const LinkContent = (
                <Link
                  to={item.path}
                  className={cn(
                    "relative flex items-center rounded-lg transition-all duration-200 group h-10",
                    desktopSidebarExpanded ? "px-3 gap-3" : "justify-center",
                    isActive 
                      ? "bg-accent/10 text-accent font-medium" 
                      : "text-secondary hover:bg-surface-1 hover:text-primary"
                  )}
                >
                  {/* Premium Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 top-1 bottom-1 w-1 bg-accent rounded-r-md"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="relative shrink-0">
                    <item.icon className={cn(
                      "w-[18px] h-[18px] transition-colors",
                      isActive ? "text-accent" : "text-tertiary group-hover:text-primary"
                    )} />
                    {item.hasNotification && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                      </span>
                    )}
                  </div>

                  <AnimatePresence initial={false}>
                    {desktopSidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="truncate text-[13px]"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              return desktopSidebarExpanded ? (
                <div key={item.path}>{LinkContent}</div>
              ) : (
                <Tooltip.Root key={item.path}>
                  <Tooltip.Trigger asChild>
                    <div>{LinkContent}</div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content 
                      side="right" 
                      sideOffset={14} 
                      className="bg-surface-elevated border border-border px-3 py-1.5 rounded-md shadow-floating text-xs font-medium text-primary z-50 animate-in fade-in zoom-in-95"
                    >
                      {item.name}
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / User Profile Area */}
      <div className={cn("p-3 border-t border-border shrink-0 mt-auto flex", desktopSidebarExpanded ? "" : "justify-center")}>
        <UserProfileDropdown collapsed={!desktopSidebarExpanded} />
      </div>
    </div>
  );

  return (
    <>
    <Tooltip.Provider delayDuration={200}>
      {/* Desktop Sidebar (Absolute position) */}
      <div 
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-250 ease-in-out",
          desktopSidebarExpanded ? "w-[240px]" : "w-[68px]"
        )}
      >
        <SidebarContent />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Tooltip.Provider>
    <NotificationPanel />
    </>
  );
}
