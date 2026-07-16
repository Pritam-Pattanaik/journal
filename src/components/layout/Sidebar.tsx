import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrendingUp,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Brain,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
  Users,
  Link2,
  ScrollText
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  let navItems = [];

  if (profile?.role === 'SUPER_ADMIN') {
    navItems = [
      { name: 'Overview', path: '/app', icon: Shield },
      { name: 'Users', path: '/app/admin/users', icon: Users },
      { name: 'Trades', path: '/app/admin/trades', icon: BarChart3 },
      { name: 'Brokers', path: '/app/admin/brokers', icon: Link2 },
      { name: 'AI Monitor', path: '/app/admin/ai', icon: Brain },
      { name: 'Audit Logs', path: '/app/admin/audit', icon: ScrollText },
      { name: 'Settings', path: '/app/admin/settings', icon: Settings },
    ];
  } else {
    navItems = [
      { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
      { name: 'Trades', path: '/app/trades', icon: BarChart3 },
      { name: 'Journal', path: '/app/journal', icon: BookOpen },
      { name: 'AI Coach', path: '/app/ai-coach', icon: Brain },
      { name: 'Strategies', path: '/app/strategies', icon: Target },
      { name: 'Settings', path: '/app/settings', icon: Settings },
    ];
    
    if (profile?.role === 'ADMIN' || profile?.role === 'SUB_ADMIN') {
      navItems.push({ name: 'Admin Panel', path: '/app/admin', icon: Shield });
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-overlay z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside
        className={`fixed md:relative flex flex-col h-screen glass-panel !border-r-0 !border-y-0 transition-all duration-300 z-50 shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: collapsed ? '60px' : '220px' }}
      >
        {/* Top Logo Section */}
        <div className="flex items-center justify-between h-[60px] px-4 overflow-hidden">
          <div className="flex items-center">
            <TrendingUp className="text-accent h-[20px] w-[20px] shrink-0" />
            {!collapsed && (
              <span className="ml-3 font-ui font-semibold text-tv-md text-accent tracking-wider select-none">
                TradeVault
              </span>
            )}
          </div>
          {/* Mobile Close Button */}
          <button 
            className="md:hidden text-secondary hover:text-primary p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center h-[48px] pl-4 mx-2 my-1 rounded-tv-md transition-all duration-150 relative overflow-hidden group ${
                isActive
                  ? 'glass-panel text-accent-light'
                  : 'text-secondary hover:text-primary hover:bg-white/5'
              }`}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" />
              {!collapsed && (
                <span className="ml-3 font-ui font-medium text-tv-sm select-none">
                  {item.name}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-[60px] ml-2 px-2 py-1 bg-surface border border-tv-border rounded text-tv-sm text-primary font-ui whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info Row */}
      {!collapsed && (
        <div className="p-4 flex items-center gap-3 overflow-hidden border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-light font-medium text-tv-sm shrink-0">
            {profile?.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-tv-sm font-semibold text-primary truncate">{profile?.fullName || 'User'}</span>
            <span className="text-tv-xs text-profit flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-profit animate-pulse inline-block"></span>
              Kite Synced
            </span>
          </div>
        </div>
      )}

      {/* Collapse Toggle Button (Desktop Only) */}
      <div className="p-3 hidden md:flex justify-end">
        <button
          onClick={onToggle}
          className="p-1.5 rounded text-secondary hover:text-primary transition-all hover:bg-white/10 active:bg-white/20"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
    </>
  );
}
