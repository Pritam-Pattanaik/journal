import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle,
  Coffee,
  TrendingUp,
  Loader2,
  Send,
  Zap,
  Paperclip,
  Mic,
  Copy,
  RefreshCcw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Target,
  Activity,
  Award,
  BarChart2,
  Search,
  BookOpen,
  BrainCircuit,
  Settings,
} from 'lucide-react';
import { useInsightStore } from '../stores/insightStore';
import { useTradeStore } from '../stores/tradeStore';
import {
  detectRevengeTrades,
  detectBoredomTrades,
  findBestStrategy,
  formatPercent,
  computeStats,
  computeCurrentStreak,
  formatCurrency
} from '../lib/analytics';
import { cn } from '../lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonShimmer } from '../components/ui/SkeletonShimmer';
import { notify } from '../lib/notify';
import { Button } from '../components/ui/Button';

export default function AICoach() {
  const { trades } = useTradeStore();
  const { insights, fetchInsights, runAnalysis, loading } = useInsightStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [insights, loading]);

  const stats = computeStats(trades);
  const streak = computeCurrentStreak(trades);
  
  const quickPrompts = [
    { icon: Target, label: 'Analyze Last Trade' },
    { icon: BookOpen, label: 'Review Journal' },
    { icon: BrainCircuit, label: 'Find Mistakes' },
    { icon: Activity, label: 'Market Outlook' },
  ];

  const handleRunAnalysis = async (promptOverride?: string) => {
    if (loading) return;
    setInputValue('');
    try {
      // In a real app, promptOverride would be passed to the backend.
      // For now we just trigger the existing analysis endpoint.
      await runAnalysis();
    } catch {
      notify.error('Failed to run analysis.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] max-w-7xl mx-auto w-full gap-8 pb-4 mt-2">
      
      {/* ── Left Sidebar: AI Insight Panel (Hidden on Mobile) ── */}
      <div className="hidden lg:flex flex-col w-[320px] xl:w-[380px] shrink-0 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-10">
        
        <div>
          <h2 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4" />
            Portfolio Context
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel bg-surface-1 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1 block">Net P&L</span>
              <span className={cn("text-lg font-mono font-bold tracking-tight", stats.totalPnl >= 0 ? "text-success" : "text-danger")}>
                {stats.totalPnl >= 0 ? '+' : ''}{formatCurrency(stats.totalPnl)}
              </span>
            </div>
            <div className="glass-panel bg-surface-1 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1 block">Win Rate</span>
              <span className="text-lg font-mono font-bold text-primary tracking-tight">{formatPercent(stats.winRate)}</span>
            </div>
            <div className="glass-panel bg-surface-1 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1 block">Discipline</span>
              <span className="text-lg font-mono font-bold text-primary tracking-tight">{stats.avgDiscipline.toFixed(1)}/5</span>
            </div>
            <div className="glass-panel bg-surface-1 p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1 block">Streak</span>
              <span className={cn("text-lg font-mono font-bold tracking-tight", streak.type === 'WIN' ? "text-success" : streak.type === 'LOSS' ? "text-danger" : "text-primary")}>
                {streak.count} {streak.type === 'WIN' ? 'W' : streak.type === 'LOSS' ? 'L' : '-'}
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-4 mt-2">
            <Zap className="h-4 w-4" />
            Quick Prompts
          </h2>
          <div className="flex flex-col gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button 
                key={idx}
                onClick={() => handleRunAnalysis(prompt.label)}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-1 hover:bg-surface-2 border border-black/5 dark:border-white/5 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-secondary group-hover:text-primary transition-colors">
                  <prompt.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-secondary group-hover:text-primary">{prompt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Area: Conversation & Input ── */}
      <div className="flex-1 flex flex-col relative glass-panel bg-surface-0 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-black/5 dark:border-white/5 bg-surface-1/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-primary">TradeVault Intelligence</h1>
              <p className="text-[10px] text-success font-medium uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Online & Ready
              </p>
            </div>
          </div>
          <button className="p-2 rounded-lg text-tertiary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 custom-scrollbar relative">
          
          {insights.length === 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8"
            >
              <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-sm">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary tracking-tight mb-2">Good Morning, Chandan.</h2>
                <p className="text-sm text-secondary">I have analyzed your recent trades. What would you like to improve today?</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {['Find emotional mistakes', 'Improve my win rate', 'Create today\'s trading plan', 'Summarize this week'].map((text, i) => (
                  <motion.button
                    key={text}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => handleRunAnalysis(text)}
                    className="p-4 rounded-xl bg-surface-1 border border-black/5 dark:border-white/5 hover:border-accent/30 hover:bg-accent/5 text-sm font-medium text-secondary hover:text-primary text-left transition-all shadow-sm"
                  >
                    {text}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {[...insights].reverse().map((insight) => (
            <motion.div 
              key={insight.id} 
              className="group flex gap-4 md:gap-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-surface-2 border border-black/5 dark:border-white/5 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-secondary" />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary">TradeVault AI</span>
                  <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">
                    {new Date(insight.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="prose prose-sm md:prose-base max-w-none text-primary/90 leading-relaxed
                  [&_p]:mb-4
                  [&_ul]:space-y-2 [&_li]:font-medium
                  [&_strong]:text-primary [&_strong]:font-bold
                  [&_li::marker]:text-accent">
                  <ReactMarkdown>{insight.content}</ReactMarkdown>
                </div>

                <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 rounded-md text-tertiary hover:bg-surface-2 hover:text-secondary transition-colors" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-md text-tertiary hover:bg-surface-2 hover:text-success transition-colors" title="Helpful">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-md text-tertiary hover:bg-surface-2 hover:text-danger transition-colors" title="Not Helpful">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleRunAnalysis()} className="p-1.5 rounded-md text-tertiary hover:bg-surface-2 hover:text-secondary transition-colors ml-auto flex items-center gap-1.5 text-xs font-medium">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Regenerate
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-4 md:gap-6"
            >
              <div className="w-8 h-8 shrink-0 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              </div>
              <div className="flex-1 space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary">TradeVault AI</span>
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest animate-pulse">Computing...</span>
                </div>
                <div className="space-y-3 max-w-2xl">
                  <SkeletonShimmer className="h-4 w-full bg-surface-1 rounded" />
                  <SkeletonShimmer className="h-4 w-5/6 bg-surface-1 rounded" />
                  <SkeletonShimmer className="h-4 w-2/3 bg-surface-1 rounded" />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} className="h-4" />
        </div>

        {/* Premium Input Area */}
        <div className="p-4 md:p-6 bg-surface-0 border-t border-black/5 dark:border-white/5 shrink-0">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-2 rounded-lg text-tertiary hover:bg-surface-2 hover:text-secondary transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about your trading performance..."
              className={cn(
                "w-full h-14 bg-surface-1 border border-black/10 dark:border-white/10 rounded-xl pl-14 pr-32 text-sm font-medium text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent outline-none shadow-sm transition-all",
                loading ? "opacity-50 cursor-not-allowed" : "cursor-text hover:border-black/20 dark:hover:border-white/20"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleRunAnalysis(inputValue);
                }
              }}
              disabled={loading}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-2 rounded-lg text-tertiary hover:bg-surface-2 hover:text-secondary transition-colors hidden sm:block">
                <Mic className="w-4 h-4" />
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRunAnalysis(inputValue)}
                disabled={loading}
                className="h-10 px-3 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Shortcut hints */}
            <div className="absolute -top-6 right-2 hidden md:flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-tertiary">
              <span className="px-1.5 py-0.5 rounded bg-surface-1 border border-black/5 dark:border-white/5">↵ Enter</span> to send
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
