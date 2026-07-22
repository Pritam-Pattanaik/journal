import React from 'react';
import { Moon, Sun, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';
import { motion } from 'framer-motion';

export default function UserProfileDropdown({ collapsed }: { collapsed?: boolean }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? '?';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl select-none',
            'bg-gradient-to-br from-iris to-accent text-[12px] font-bold text-white',
            'shadow-iris hover:shadow-raised transition-all duration-200',
            'outline-none focus-ring hover:scale-105 active:scale-95'
          )}
          aria-label="User profile"
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[100] w-[220px] glass-float p-1.5 animate-scale-in origin-top-right"
        >
          {/* Profile header */}
          <div className="px-3 py-3 mb-1 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-iris to-accent text-[12px] font-bold text-white shadow-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-primary truncate">{profile?.fullName || 'Trader'}</p>
                <p className="text-[11px] text-tertiary truncate">{profile?.email}</p>
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <DropdownMenu.Item
            onSelect={(e) => { e.preventDefault(); toggleTheme(); }}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium text-secondary hover:text-primary hover:bg-surface-1 transition-colors cursor-pointer outline-none select-none"
          >
            <div className="flex items-center gap-2.5">
              {theme === 'dark'
                ? <Moon className="w-4 h-4 text-iris" />
                : <Sun className="w-4 h-4 text-gold" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            {/* Mini toggle indicator */}
            <div className={cn(
              'w-7 h-4 rounded-full border transition-colors duration-200 flex items-center px-0.5',
              theme === 'dark' ? 'bg-accent border-accent/50' : 'bg-surface-2 border-border'
            )}>
              <motion.div
                layout
                className="w-3 h-3 rounded-full bg-white shadow-xs"
                animate={{ x: theme === 'dark' ? 12 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => navigate('/app/settings')}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-secondary hover:text-primary hover:bg-surface-1 transition-colors cursor-pointer outline-none select-none"
          >
            <Settings className="w-4 h-4" />
            Settings
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border my-1 mx-1" />

          <DropdownMenu.Item
            onSelect={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-danger hover:bg-danger/8 transition-colors cursor-pointer outline-none select-none"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
