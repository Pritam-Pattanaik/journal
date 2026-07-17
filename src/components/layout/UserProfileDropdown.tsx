import React, { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Moon, Sun, Monitor, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/cn';

export default function UserProfileDropdown() {
  const { profile, signOut } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [open, setOpen] = useState(false);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-primary text-[13px] font-bold text-canvas shadow-md outline-none focus-visible:ring-2 focus-visible:ring-accent transition-transform hover:scale-105"
          aria-label="User profile"
        >
          {initials}
        </button>
      </DropdownMenu.Trigger>

      <AnimatePresence>
        {open && (
          <DropdownMenu.Portal forceMount>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              asChild
              className="z-50 w-64 rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-black/70 backdrop-blur-xl shadow-2xl p-2 outline-none"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 px-2 py-3 mb-1 border-b border-black/5 dark:border-white/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-primary font-bold">
                    {initials}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-primary truncate">
                      {profile?.fullName || 'User'}
                    </span>
                    <span className="text-[11px] text-tertiary truncate">
                      {profile?.email || 'user@example.com'}
                    </span>
                  </div>
                </div>

                <DropdownMenu.Group>
                  <DropdownMenu.Item className="group relative flex cursor-default select-none items-center rounded-xl px-2 py-2.5 text-sm text-secondary outline-none transition-colors data-[highlighted]:bg-black/5 data-[highlighted]:text-primary dark:data-[highlighted]:bg-white/10">
                    <User className="mr-3 h-4 w-4" />
                    My Profile
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="group relative flex cursor-default select-none items-center rounded-xl px-2 py-2.5 text-sm text-secondary outline-none transition-colors data-[highlighted]:bg-black/5 data-[highlighted]:text-primary dark:data-[highlighted]:bg-white/10">
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </DropdownMenu.Item>
                </DropdownMenu.Group>

                <DropdownMenu.Separator className="my-1 h-px bg-black/5 dark:bg-white/5" />

                <DropdownMenu.Group>
                  <DropdownMenu.Item
                    onSelect={(e) => {
                      e.preventDefault();
                      toggleTheme();
                    }}
                    className="group relative flex cursor-default select-none items-center justify-between rounded-xl px-2 py-2.5 text-sm text-secondary outline-none transition-colors data-[highlighted]:bg-black/5 data-[highlighted]:text-primary dark:data-[highlighted]:bg-white/10"
                  >
                    <div className="flex items-center">
                      {theme === 'dark' ? <Moon className="mr-3 h-4 w-4" /> : <Sun className="mr-3 h-4 w-4" />}
                      Appearance
                    </div>
                    <span className="text-[11px] capitalize text-tertiary">{theme}</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Group>

                <DropdownMenu.Separator className="my-1 h-px bg-black/5 dark:bg-white/5" />

                <DropdownMenu.Item
                  onSelect={() => signOut()}
                  className="group relative flex cursor-default select-none items-center rounded-xl px-2 py-2.5 text-sm text-danger outline-none transition-colors data-[highlighted]:bg-danger/10"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign out
                </DropdownMenu.Item>
              </motion.div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        )}
      </AnimatePresence>
    </DropdownMenu.Root>
  );
}
