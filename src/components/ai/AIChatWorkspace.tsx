import React, { useState, useEffect, useRef } from 'react';
import {
  Send, StopCircle, RefreshCw, Activity, Brain, AlertTriangle,
  Copy, Check, ThumbsUp, ThumbsDown, ChevronDown, Sunrise, Sunset,
  TrendingUp, BookOpen, Shield, BarChart3, Calendar, Target, Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useInsightStore } from '../../stores/insightStore';
import { useTradeStore } from '../../stores/tradeStore';
import { useJournalStore } from '../../stores/journalStore';
import { cn } from '../../lib/cn';
import UserMessageBubble from './UserMessageBubble';
import { api } from '../../lib/api';
import { notify } from '../../lib/notify';

interface Props {
  conversationId: string;
}

// ─── Trading Modes ────────────────────────────────────────────────────────────

interface TradingMode {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const TRADING_MODES: TradingMode[] = [
  { id: 'general',    label: 'Mentor',       icon: <Brain className="w-3.5 h-3.5" />,      description: 'General coaching',     color: 'text-accent' },
  { id: 'premarket',  label: 'Pre-Market',   icon: <Sunrise className="w-3.5 h-3.5" />,    description: 'Morning briefing',     color: 'text-amber-400' },
  { id: 'postmarket', label: 'Post-Market',  icon: <Sunset className="w-3.5 h-3.5" />,     description: 'Day debrief',          color: 'text-orange-400' },
  { id: 'performance',label: 'Performance',  icon: <TrendingUp className="w-3.5 h-3.5" />, description: 'P&L & statistics',     color: 'text-green-400' },
  { id: 'journal',    label: 'Journal',      icon: <BookOpen className="w-3.5 h-3.5" />,   description: 'Psychology coaching',  color: 'text-purple-400' },
  { id: 'risk',       label: 'Risk',         icon: <Shield className="w-3.5 h-3.5" />,     description: 'Risk management',      color: 'text-red-400' },
  { id: 'strategy',   label: 'Strategy',     icon: <BarChart3 className="w-3.5 h-3.5" />,  description: 'Strategy analysis',   color: 'text-blue-400' },
];

// ─── Mode Selector Component ─────────────────────────────────────────────────

function ModeSelector({ activeMode, onModeChange }: { activeMode: string; onModeChange: (mode: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = TRADING_MODES.find(m => m.id === activeMode) ?? TRADING_MODES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold",
          "bg-surface-1 border-border hover:border-accent/40",
          current.color
        )}
      >
        {current.icon}
        {current.label}
        <ChevronDown className={cn("w-3 h-3 text-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-surface-0 border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {TRADING_MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => { onModeChange(mode.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-1",
                activeMode === mode.id && "bg-accent/5"
              )}
            >
              <span className={cn("shrink-0", mode.color)}>{mode.icon}</span>
              <div>
                <div className={cn("text-[12px] font-bold", activeMode === mode.id ? mode.color : 'text-primary')}>
                  {mode.label}
                </div>
                <div className="text-[10px] text-tertiary">{mode.description}</div>
              </div>
              {activeMode === mode.id && (
                <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", "bg-accent")} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Message Actions ──────────────────────────────────────────────────────────

function MessageActions({
  messageId,
  content,
  isLatest,
  onRegenerate
}: {
  messageId?: string;
  content: string;
  isLatest: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (feedback === type) return;
    setFeedback(type);
    try {
      await api.post('/ai/feedback', { messageId, feedback: type });
      notify.success(type === 'up' ? 'Thanks for the positive feedback!' : 'Feedback recorded. We\'ll improve.');
    } catch {
      // Non-critical — still show optimistic UI
    }
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-tertiary hover:text-primary hover:bg-surface-1 transition-colors"
      >
        {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      
      {isLatest && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium text-tertiary hover:text-accent hover:bg-surface-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      )}
      
      <div className="flex items-center gap-1 ml-4 border-l border-border pl-4">
        <button
          onClick={() => handleFeedback('up')}
          className={cn(
            "p-1.5 rounded transition-colors",
            feedback === 'up'
              ? "text-success bg-success/10"
              : "text-tertiary hover:text-success hover:bg-surface-1"
          )}
          title="Helpful"
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleFeedback('down')}
          className={cn(
            "p-1.5 rounded transition-colors",
            feedback === 'down'
              ? "text-loss bg-loss/10"
              : "text-tertiary hover:text-loss hover:bg-surface-1"
          )}
          title="Not helpful"
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}

// ─── Context Status Bar ───────────────────────────────────────────────────────

function ContextStatusBar() {
  const { coachMemory } = useInsightStore();
  const { trades } = useTradeStore();
  const { entries } = useJournalStore();

  const hasMarketData = true; // MarketWorker is always running on backend

  return (
    <div className="flex items-center gap-3 px-6 py-1.5 border-b border-border bg-surface-0/60 text-[10px] font-medium text-tertiary shrink-0">
      <Activity className="w-3 h-3 text-accent" />
      <span className="text-success font-bold">Context Synced</span>
      <span className="text-border">·</span>
      <span>{trades?.length ?? 0} Trades</span>
      <span className="text-border">·</span>
      <span>{entries?.length ?? 0} Journals</span>
      <span className="text-border">·</span>
      <span>{coachMemory?.length ?? 0} Memory Patterns</span>
      <span className="text-border">·</span>
      <span className={hasMarketData ? 'text-success' : 'text-tertiary'}>
        {hasMarketData ? '🟢 Market: Live' : '⚫ Market: Offline'}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ACTION_SUGGESTIONS = [
  "Analyze my most recent trades",
  "What is my biggest psychological trap?",
  "Review my discipline score this week",
  "Evaluate my risk to reward ratio",
];

export default function AIChatWorkspace({ conversationId }: Props) {
  const {
    messages,
    streamingMessage,
    isTyping,
    sendMessage,
    stopGeneration,
    regenerateResponse,
    loading,
    conversations,
  } = useInsightStore();

  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState('general');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages or stream change
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Prefix mode tag if not general
    const content = activeMode !== 'general'
      ? `[MODE:${activeMode}] ${input.trim()}`
      : input.trim();
    
    sendMessage(content);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeConv = conversations.find(c => c.id === conversationId);
  const currentMode = TRADING_MODES.find(m => m.id === activeMode) ?? TRADING_MODES[0];

  return (
    <div className="flex flex-col h-full bg-canvas relative animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-14 border-b border-border bg-surface-0/80 backdrop-blur-md flex items-center px-6 shrink-0 z-10 sticky top-0 gap-4">
        {/* Mode Selector */}
        <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />

        {/* Conversation Title */}
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-bold text-primary truncate max-w-[200px]">
            {activeConv ? activeConv.title : 'TradeVault AI Mentor'}
          </h2>
        </div>
        
        {/* Status Indicators */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">
              Groq
            </span>
          </div>
          {activeMode !== 'general' && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold",
              "border-border bg-surface-1",
              currentMode.color
            )}>
              {currentMode.icon}
              {currentMode.label} Mode
            </div>
          )}
        </div>
      </div>

      {/* Context Status Bar */}
      <ContextStatusBar />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8 lg:px-24">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 animate-spin text-tertiary" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <Brain className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-widest">AI Coach</span>
                  </div>
                )}
                
                {msg.role === 'user' ? (
                  <div className="max-w-[80%]">
                    <UserMessageBubble content={msg.content} />
                  </div>
                ) : (
                  <div className="w-full max-w-[90%] bg-surface-0 border border-border rounded-xl p-5 shadow-sm text-[13px] text-secondary leading-relaxed group/message">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center gap-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                      <MessageActions
                        messageId={(msg as any).id}
                        content={msg.content}
                        isLatest={i === messages.length - 1}
                        onRegenerate={regenerateResponse}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Message */}
            {isTyping && (
              <div className="flex flex-col items-start animate-in fade-in">
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <div className="w-6 h-6 rounded-md bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Brain className="w-3.5 h-3.5 text-accent animate-pulse" />
                  </div>
                  <span className="text-[11px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                    Thinking <span className="flex gap-0.5"><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span><span className="animate-bounce delay-300">.</span></span>
                  </span>
                </div>
                
                {streamingMessage && (
                  <div className="w-full max-w-[90%] bg-surface-0 border border-border rounded-xl p-5 shadow-sm text-[13px] text-secondary leading-relaxed border-l-2 border-l-accent">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingMessage}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 lg:px-24 bg-gradient-to-t from-canvas via-canvas to-transparent shrink-0">
        <div className="max-w-4xl mx-auto">
          
          {/* Quick Suggestions */}
          {!isTyping && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {ACTION_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(activeMode !== 'general' ? `[MODE:${activeMode}] ${sug}` : sug)}
                  className="px-3 py-1.5 rounded-full border border-border bg-surface-0 text-[11px] text-secondary hover:text-primary hover:bg-surface-1 hover:border-accent/30 transition-all"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Chat Box */}
          <div className="relative group rounded-2xl bg-surface-0 border border-border shadow-lg focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10 transition-all overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask the AI Coach (${currentMode.label} mode)...`}
              className="w-full bg-transparent p-4 pr-14 text-sm text-primary placeholder:text-tertiary focus:outline-none resize-none min-h-[60px] max-h-[200px]"
              rows={1}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {isTyping ? (
                <button
                  onClick={stopGeneration}
                  className="w-8 h-8 rounded-lg bg-surface-2 text-tertiary hover:text-loss hover:bg-loss/10 flex items-center justify-center transition-colors"
                  title="Stop generation (Escape)"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-lg bg-accent text-base-dark flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  title="Send (Enter)"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-center text-[10px] text-tertiary font-medium">
            TradeVault AI analyzes your trades for educational purposes only. Not financial advice.
          </div>
        </div>
      </div>

    </div>
  );
}
