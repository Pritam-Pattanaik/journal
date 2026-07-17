import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, BarChart3, BookOpen, Brain, Target, Settings, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'SUPER_ADMIN' || profile?.role === 'ADMIN' || profile?.role === 'SUB_ADMIN';

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <Command 
        className="w-full max-w-xl bg-surface-3 rounded-xl shadow-xl overflow-hidden border border-border"
        label="Global Command Menu"
        loop
      >
        <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input 
            autoFocus
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50" 
            placeholder="Type a command or search..." 
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm text-secondary">No results found.</Command.Empty>
          
          <Command.Group heading="Navigation" className="px-2 text-xs font-medium text-secondary py-2 [&_[cmdk-group-items]]:mt-2">
            <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Command.Item>
            <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app/trades'))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Trades</span>
            </Command.Item>
            <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app/journal'))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Journal</span>
            </Command.Item>
            <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app/ai-coach'))}>
              <Brain className="mr-2 h-4 w-4" />
              <span>AI Coach</span>
            </Command.Item>
            <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app/strategies'))}>
              <Target className="mr-2 h-4 w-4" />
              <span>Strategies</span>
            </Command.Item>
          </Command.Group>

          <Command.Separator className="h-px bg-border my-1" />

          <Command.Group heading="Settings" className="px-2 text-xs font-medium text-secondary py-2 [&_[cmdk-group-items]]:mt-2">
            <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app/settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </Command.Item>
            {isAdmin && (
              <Command.Item className="flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-surface-2 aria-selected:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => runCommand(() => navigate('/app/admin'))}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </Command.Item>
            )}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
