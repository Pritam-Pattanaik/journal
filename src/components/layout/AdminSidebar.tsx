import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, Key, Link2, Flag, Activity, BarChart3, Newspaper, Globe2,
  Server, FileText, Bell, ScrollText, Lock, Database, PlayCircle, Network,
  AlertTriangle, Gauge, Settings, ChevronLeft, ChevronRight, X, Search, Brain
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import * as Tooltip from '@radix-ui/react-tooltip';
import UserProfileDropdown from './UserProfileDropdown';

type NavItem = { name: string; path: string; icon: React.ElementType };
type NavGroup = { label: string; items: NavItem[] };

const adminGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { name: 'Dashboard', path: '/app/admin', icon: Activity },
      { name: 'Users', path: '/app/admin/users', icon: Users },
      { name: 'Trades', path: '/app/admin/trades', icon: BarChart3 },
      { name: 'Brokers', path: '/app/admin/brokers', icon: Link2 },
    ]
  },
  {
    label: 'Monitoring',
    items: [
      { name: 'AI Coach', path: '/app/admin/ai', icon: Brain },
      { name: 'Audit Logs', path: '/app/admin/audit', icon: ScrollText },
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', path: '/app/admin/settings', icon: Settings },
    ]
  }
];

export default function AdminSidebar() {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { sidebarOpen, setSidebarOpen, desktopSidebarExpanded, toggleDesktopSidebar } = useUIStore();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

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
              className="whitespace-nowrap overflow-hidden flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-danger" />
              </div>
              <span className="font-display font-bold text-primary tracking-tight leading-tight text-lg">Super Admin</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={toggleDesktopSidebar}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md hover:bg-surface-2 text-tertiary hover:text-secondary transition-colors shrink-0"
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

      <div className="px-3 mb-4 shrink-0">
        <button className={cn(
          "w-full flex items-center justify-center h-10 bg-surface-1 hover:bg-surface-2 border border-border rounded-lg text-tertiary hover:text-secondary transition-colors text-sm",
          desktopSidebarExpanded ? "px-3 justify-start gap-2" : ""
        )}>
          <Search className="w-4 h-4 shrink-0" />
          {desktopSidebarExpanded && <span className="flex-1 text-left">Search Admin...</span>}
        </button>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-3 space-y-6 pb-4">
        {adminGroups.map((group, groupIndex) => (
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
              const isActive = location.pathname === item.path;
              
              const LinkContent = (
                <Link
                  to={item.path}
                  className={cn(
                    "relative flex items-center rounded-lg transition-all duration-200 group h-10",
                    desktopSidebarExpanded ? "px-3 gap-3" : "justify-center",
                    isActive 
                      ? "bg-danger/10 text-danger font-medium" 
                      : "text-secondary hover:bg-surface-1 hover:text-primary"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active-indicator"
                      className="absolute left-0 top-1 bottom-1 w-1 bg-danger rounded-r-md"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="relative shrink-0">
                    <item.icon className={cn(
                      "w-[18px] h-[18px] transition-colors",
                      isActive ? "text-danger" : "text-tertiary group-hover:text-primary"
                    )} />
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
                      className="bg-surface-elevated border border-border px-3 py-1.5 rounded-md shadow-floating text-xs font-medium text-primary z-50"
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

      <div className={cn("p-3 border-t border-border shrink-0 flex", desktopSidebarExpanded ? "" : "justify-center")}>
        <UserProfileDropdown collapsed={!desktopSidebarExpanded} />
      </div>
    </div>
  );

  return (
    <Tooltip.Provider delayDuration={200}>
      <div 
        className={cn(
          "hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-250 ease-in-out",
          desktopSidebarExpanded ? "w-[240px]" : "w-[68px]"
        )}
      >
        <SidebarContent />
      </div>

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
  );
}
