import React from 'react';
import { Sparkles, Brain, Target, Shield, BookOpen, Activity, ArrowRight, TrendingUp, BarChart2, Flame } from 'lucide-react';
import { useTradeStore } from '../../stores/tradeStore';
import { isToday } from 'date-fns';
import { cn } from '../../lib/cn';

const MODES = [
  {
    id: 'general',
    title: 'Daily Check-in',
    description: 'A general review of your recent trading activity.',
    icon: <Brain className="w-5 h-5 text-accent" />,
    color: 'from-accent/20 to-transparent',
    prompt: '[MODE:general] How is my trading looking today?',
    metadata: 'Est. 30s • Trade Context'
  },
  {
    id: 'psychology',
    title: 'Analyze Psychology',
    description: 'Deep dive into your emotional state and discipline.',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    color: 'from-purple-500/20 to-transparent',
    prompt: '[MODE:psychology] Can you review my recent journal entries for emotional leakage?',
    metadata: 'Est. 45s • Journal Context'
  },
  {
    id: 'performance',
    title: 'Weekly Performance Review',
    description: 'Strict analysis of your P&L, win rate, and edge.',
    icon: <Activity className="w-5 h-5 text-emerald-400" />,
    color: 'from-emerald-500/20 to-transparent',
    prompt: '[REPORTS] Weekly Review',
    metadata: 'Est. 1m • Full Context'
  },
  {
    id: 'strategy',
    title: 'Strategy Audit',
    description: 'Find out which setups are actually making you money.',
    icon: <Target className="w-5 h-5 text-blue-400" />,
    color: 'from-blue-500/20 to-transparent',
    prompt: '[MODE:strategy] Which of my strategies has the best profit factor?',
    metadata: 'Est. 1m • Trade Context'
  }
];

interface Props {
  onSelectAction: (prompt: string) => void;
}

export default function EmptyWorkspace({ onSelectAction }: Props) {
  const { trades, dailySummaries } = useTradeStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  // Live Stats
  const todaysTrades = trades.filter(t => isToday(new Date(t.date)));
  const todaysPnl = todaysTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const todaysWins = todaysTrades.filter(t => t.netPnl > 0).length;
  const todaysWinRate = todaysTrades.length > 0 ? Math.round((todaysWins / todaysTrades.length) * 100) : 0;
  
  const todayKey = new Date().toISOString().split('T')[0];
  const todaysDiscipline = dailySummaries[todayKey]?.averageDiscipline || 0;

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-success';
    if (pnl < 0) return 'text-loss';
    return 'text-primary';
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500 min-h-full">
        
        {/* Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20 mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <Brain className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-3xl font-display font-bold text-primary mb-2 tracking-tight">{greeting}, Trader.</h1>
        <p className="text-secondary text-base mb-10">Your AI Mentor is ready. Let's analyze your edge.</p>
        
        {/* Live Dashboard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10">
          
          <div className="bg-surface-0 border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Today's P&L</span>
            </div>
            <div className={cn("text-2xl font-bold", getPnlColor(todaysPnl))}>
              ${todaysPnl.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-surface-0 border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {todaysWinRate}%
            </div>
          </div>
          
          <div className="bg-surface-0 border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <BarChart2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Discipline</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {todaysDiscipline}/10
            </div>
          </div>

          <div className="bg-surface-0 border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-500">
              3 Days
            </div>
          </div>

        </div>

        {/* Quick Actions Header */}
        <div className="w-full text-left mb-4 px-2 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-tertiary">Suggested Actions</span>
          <span className="text-[10px] text-tertiary">Context automatically loaded</span>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => onSelectAction(mode.prompt)}
              className="group relative flex flex-col items-start p-5 rounded-2xl border border-border bg-surface-0 hover:bg-surface-1 transition-all text-left overflow-hidden hover:shadow-xl hover:border-accent/30"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <div className="flex w-full items-start justify-between mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center border border-border group-hover:scale-110 transition-transform shadow-sm">
                  {mode.icon}
                </div>
                <div className="text-[10px] font-medium text-tertiary bg-surface-2 px-2 py-1 rounded-md border border-border">
                  {mode.metadata}
                </div>
              </div>
              
              <h3 className="relative z-10 font-bold text-primary mb-1.5 flex items-center gap-2 text-sm">
                {mode.title}
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent" />
              </h3>
              
              <p className="relative z-10 text-xs text-secondary leading-relaxed">
                {mode.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
