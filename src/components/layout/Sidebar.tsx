import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import {
  TrendingUp,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Brain,
  Target,
  Settings,
  Shield,
  Users,
  Link2,
  ScrollText,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [isHovered, setIsHovered] = useState(false);
  const controls = useAnimation();

  let navItems: { name: string; path: string; icon: React.ElementType }[] = [];

  if (profile?.role === 'SUPER_ADMIN') {
    navItems = [
      { name: 'Overview',   path: '/app',              icon: Shield },
      { name: 'Users',      path: '/app/admin/users',  icon: Users },
      { name: 'Trades',     path: '/app/admin/trades', icon: BarChart3 },
      { name: 'Brokers',    path: '/app/admin/brokers', icon: Link2 },
      { name: 'AI Monitor', path: '/app/admin/ai',     icon: Brain },
      { name: 'Audit Logs', path: '/app/admin/audit',  icon: ScrollText },
      { name: 'Settings',   path: '/app/admin/settings', icon: Settings },
    ];
  } else {
    navItems = [
      { name: 'Dashboard', path: '/app',             icon: LayoutDashboard },
      { name: 'Trades',    path: '/app/trades',      icon: BarChart3 },
      { name: 'Journal',   path: '/app/journal',     icon: BookOpen },
      { name: 'AI Coach',  path: '/app/ai-coach',    icon: Brain },
      { name: 'Strategies',path: '/app/strategies',  icon: Target },
      { name: 'Settings',  path: '/app/settings',    icon: Settings },
    ];

    if (profile?.role === 'ADMIN' || profile?.role === 'SUB_ADMIN') {
      navItems.push({ name: 'Admin Panel', path: '/app/admin', icon: Shield });
    }
  }

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app' || location.pathname === '/app/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isExpanded = isHovered || !collapsed; // Wait, actually the user wanted mobile drawer + tablet collapsible. 
  // Let's rely on hover for expansion if it's collapsed, otherwise fixed expanded if not collapsed.
  // The original implementation used hover for expanding when it's narrow. Let's keep that elegant behavior.

  // Handle ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  // Swipe to close
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -500) {
      setSidebarOpen(false);
    } else {
      controls.start({ x: 0 }); // snap back
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 lg:hidden bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[45]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Desktop Spacer (prevents layout shift since actual sidebar is fixed) */}
      <div className="hidden lg:block w-[72px] shrink-0 h-screen" />

      <motion.aside
        layout
        initial={false}
        animate={sidebarOpen ? { x: 0 } : undefined}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "fixed top-0 left-0 h-screen bg-surface-0 border-r border-black/5 dark:border-white/5 flex flex-col z-50 shrink-0 overflow-hidden",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 shadow-none",
          isHovered ? "w-[260px] shadow-2xl" : "w-[72px]"
        )}
      >
        {/* Logo Area */}
        <div className="flex h-16 items-center justify-between px-6 shrink-0">
          <Link to="/app" className="flex items-center gap-3 overflow-hidden outline-none" onClick={() => setSidebarOpen(false)}>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/5 dark:bg-white/[0.05] border border-black/10 dark:border-white/10 shrink-0 shadow-sm">
              <TrendingUp className="h-4 w-4 text-black dark:text-white" strokeWidth={2.5} />
            </div>
            <div className={cn("overflow-hidden transition-all duration-300", isHovered ? "w-[120px] opacity-100" : "w-0 opacity-0")}>
              <span className="text-[15px] font-bold text-primary whitespace-nowrap tracking-tight">
                TradeVault
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={!isHovered ? item.name : undefined}
                className={cn(
                  "relative flex items-center h-10 px-3 rounded-lg transition-colors group outline-none",
                  active 
                    ? "text-primary" 
                    : "text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/[0.04]"
                )}
              >
                {/* Active Indicator Background */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-lg bg-black/5 dark:bg-white/[0.08]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div className={cn("relative z-10 flex items-center justify-center shrink-0 w-5 h-5", !isHovered ? "mx-auto" : "mr-3")}>
                  <Icon className={cn("w-[18px] h-[18px] transition-colors", active ? "text-primary" : "text-tertiary group-hover:text-primary")} strokeWidth={active ? 2.5 : 2} />
                </div>
                
                <div className={cn("relative z-10 overflow-hidden transition-all duration-300", isHovered ? "w-[150px] opacity-100" : "w-0 opacity-0")}>
                  <span className={cn("text-[14px] whitespace-nowrap", active ? "font-semibold" : "font-medium")}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}
