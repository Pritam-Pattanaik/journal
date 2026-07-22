import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import {
  LayoutDashboard, BarChart3, BookOpen, Brain, Target, Settings,
  Plus, Sparkles, Moon, PenTool, TrendingUp
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { CMD_KEY } from '../../lib/osUtils';

import { api } from '../../lib/api';

export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{trades: any[], notes: any[], strategies: any[], goals: any[], journals: any[]}>({trades: [], notes: [], strategies: [], goals: [], journals: []});
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (!query) {
      setResults({trades: [], notes: [], strategies: [], goals: [], journals: []});
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<{trades: any[], notes: any[], strategies: any[], goals: any[], journals: any[]}>(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[99] bg-canvas/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <Command className="relative w-full max-w-xl mx-4 flex flex-col rounded-2xl glass-float border border-border shadow-floating overflow-hidden bg-surface-0/95 text-primary animate-scale-in">
            <div className="flex items-center px-4 border-b border-border">
              <Command.Input
                placeholder="Search commands, navigate, or search trades and notes..."
                className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted"
                value={query}
                onValueChange={setQuery}
                autoFocus
              />
            </div>
            
            <Command.List className="max-h-[350px] overflow-y-auto p-2 scrollbar-none">
              <Command.Empty className="py-6 text-center text-sm text-muted">
                No results found.
              </Command.Empty>
              
              <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                <CommandItem icon={LayoutDashboard} shortcut={`${CMD_KEY}1`} onSelect={() => runCommand(() => navigate('/app'))}>Dashboard</CommandItem>
                <CommandItem icon={BarChart3} shortcut={`${CMD_KEY}2`} onSelect={() => runCommand(() => navigate('/app/trades'))}>Trades</CommandItem>
                <CommandItem icon={TrendingUp} shortcut={`${CMD_KEY}3`} onSelect={() => runCommand(() => navigate('/app/analytics'))}>Analytics</CommandItem>
                <CommandItem icon={BookOpen} shortcut={`${CMD_KEY}4`} onSelect={() => runCommand(() => navigate('/app/journal'))}>Journal</CommandItem>
                <CommandItem icon={Brain} shortcut={`${CMD_KEY}5`} onSelect={() => runCommand(() => navigate('/app/vault'))}>Knowledge Vault</CommandItem>
                <CommandItem icon={Target} shortcut={`${CMD_KEY}6`} onSelect={() => runCommand(() => navigate('/app/goals'))}>Goals & Habits</CommandItem>
                <CommandItem icon={Brain} shortcut={`${CMD_KEY}7`} onSelect={() => runCommand(() => navigate('/app/ai-coach'))}>AI Coach</CommandItem>
                <CommandItem icon={Target} shortcut={`${CMD_KEY}8`} onSelect={() => runCommand(() => navigate('/app/strategies'))}>Strategies</CommandItem>
                <CommandItem icon={Settings} onSelect={() => runCommand(() => navigate('/app/settings'))}>Settings</CommandItem>
              </Command.Group>
              
              <Command.Group heading="Quick Actions" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                <CommandItem icon={Plus} onSelect={() => runCommand(() => console.log('New Trade'))}>New Trade</CommandItem>
                <CommandItem icon={PenTool} onSelect={() => runCommand(() => console.log('New Journal Entry'))}>New Journal Entry</CommandItem>
                <CommandItem icon={Sparkles} onSelect={() => runCommand(() => console.log('Run AI Analysis'))}>Run AI Analysis</CommandItem>
              </Command.Group>
              
              <Command.Group heading="Theme" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                <CommandItem icon={Moon} onSelect={() => runCommand(toggleTheme)}>Toggle Dark/Light Mode</CommandItem>
              </Command.Group>

              {query && (results.trades.length > 0 || results.notes.length > 0 || results.strategies.length > 0 || results.goals.length > 0 || results.journals.length > 0) && (
                <>
                  {results.strategies.length > 0 && (
                    <Command.Group heading="Strategies" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                      {results.strategies.map(s => (
                        <CommandItem key={s.id} icon={Target} onSelect={() => runCommand(() => navigate('/app/strategies'))}>
                          {s.name}
                        </CommandItem>
                      ))}
                    </Command.Group>
                  )}
                  {results.trades.length > 0 && (
                    <Command.Group heading="Trades" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                      {results.trades.map(t => (
                        <CommandItem key={t.id} icon={BarChart3} onSelect={() => runCommand(() => navigate('/app/trades'))}>
                          {t.symbol} - {t.netPnl >= 0 ? 'WIN' : 'LOSS'}
                        </CommandItem>
                      ))}
                    </Command.Group>
                  )}
                  {results.journals.length > 0 && (
                    <Command.Group heading="Journal Entries" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                      {results.journals.map(j => (
                        <CommandItem key={j.id} icon={BookOpen} onSelect={() => runCommand(() => navigate('/app/journal'))}>
                          {new Date(j.date).toLocaleDateString()}
                        </CommandItem>
                      ))}
                    </Command.Group>
                  )}
                  {results.goals.length > 0 && (
                    <Command.Group heading="Goals" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                      {results.goals.map(g => (
                        <CommandItem key={g.id} icon={Target} onSelect={() => runCommand(() => navigate('/app/goals'))}>
                          {g.description}
                        </CommandItem>
                      ))}
                    </Command.Group>
                  )}
                  {results.notes.length > 0 && (
                    <Command.Group heading="Notes" className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-tertiary">
                      {results.notes.map(n => (
                        <CommandItem key={n.id} icon={Brain} onSelect={() => runCommand(() => navigate('/app/vault'))}>
                          {n.title || 'Untitled Note'}
                        </CommandItem>
                      ))}
                    </Command.Group>
                  )}
                </>
              )}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const CommandItem = React.forwardRef<
  React.ElementRef<typeof Command.Item>,
  {
    children: React.ReactNode;
    icon: React.ElementType;
    shortcut?: string;
    onSelect: () => void;
  }
>(({ children, icon: Icon, shortcut, onSelect }, ref) => {
  return (
    <Command.Item
      ref={ref}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-secondary outline-none transition-colors",
        "aria-selected:bg-surface-2 aria-selected:text-primary aria-selected:font-medium",
        "hover:bg-surface-2 hover:text-primary hover:font-medium"
      )}
    >
      <Icon className="h-4 w-4 text-muted aria-selected:text-primary" />
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="inline-flex h-5 items-center gap-1 rounded bg-surface-3 px-1.5 font-mono text-[10px] font-medium text-muted">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
});

CommandItem.displayName = 'CommandItem';
