import React from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Menu, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';

export default function Header() {
  const location = useLocation();
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { profile } = useAuthStore();

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
        {/* Sync Status Indicator */}
        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-tv-lg text-tv-sm text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-profit inline-block shrink-0 animate-pulse"></span>
          <span className="text-tv-xs select-none">Synced 2h ago</span>
          <RefreshCw className="h-[12px] w-[12px] text-accent shrink-0 animate-spin-slow cursor-pointer hover:text-accent-light" />
        </div>

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
