import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Send,
  Copy,
  Activity,
  BookOpen,
  BrainCircuit,
  Target,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Square,
  Pin,
  Archive,
  Search,
  Check,
  Menu,
  PieChart,
  Calendar
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useTradeStore } from '../stores/tradeStore';
import { useInsightStore } from '../stores/insightStore';
import { useAuthStore } from '../stores/authStore';
import { computeStats } from '../lib/analytics';
import { cn } from '../lib/cn';
import { getTimeOfDayGreeting } from '../lib/dateUtils';
import { notify } from '../lib/notify';

// --- Message Components ---

function UserMessageBubble({ content, timestamp }: { content: string; timestamp?: Date }) {
  const { profile } = useAuthStore();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 md:gap-6 flex-row-reverse"
    >
      <div className="flex-1 space-y-2 min-w-0 flex flex-col items-end">
        <div className="px-5 py-4 bg-surface-2 text-primary rounded-3xl rounded-tr-sm w-fit max-w-[85%] text-[15px] leading-relaxed">
          {content}
        </div>
      </div>
    </motion.div>
  );
}

function AIMessageBubble({ content, isStreaming }: { content: string, isStreaming?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify.error('Failed to copy text.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 md:gap-6"
    >
      <div className="w-8 h-8 mt-1 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm relative">
        <BrainCircuit className="w-4 h-4 text-white relative z-10" />
      </div>
      <div className="flex-1 space-y-2 min-w-0 max-w-[85%] group">
        <div className="text-primary text-[15px] leading-relaxed prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(content || (isStreaming ? '...' : '')).replace(/<!--DISCIPLINE_JSON-->[\s\S]*?<!--\/DISCIPLINE_JSON-->/g, '').trim()}
          </ReactMarkdown>
          
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-1 align-middle" />
          )}

          {!isStreaming && content && (
            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button
                  className="p-1.5 rounded-md text-tertiary hover:bg-surface-2 hover:text-secondary transition-colors flex items-center gap-1 text-xs"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 md:gap-6">
      <div className="w-8 h-8 mt-1 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
        <BrainCircuit className="w-4 h-4 text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-4 h-[32px]">
        <motion.div className="w-1.5 h-1.5 rounded-full bg-tertiary" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
        <motion.div className="w-1.5 h-1.5 rounded-full bg-tertiary" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
        <motion.div className="w-1.5 h-1.5 rounded-full bg-tertiary" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
      </div>
    </div>
  );
}

// --- Main Component ---

const COACHING_MODES = [
  { id: 'general', label: 'General Trading Coach', icon: BrainCircuit },
  { id: 'performance', label: 'Performance Review', icon: TrendingUp },
  { id: 'psychology', label: 'Trading Psychology', icon: Activity },
  { id: 'risk', label: 'Risk Management', icon: Target },
  { id: 'strategy', label: 'Strategy Review', icon: BookOpen },
  { id: 'journal', label: 'Journal Analysis', icon: MessageSquare },
];

export default function AICoach() {
  const { trades } = useTradeStore();
  const { 
    conversations, 
    activeConversationId, 
    messages, 
    streamingMessage, 
    isTyping, 
    fetchConversations, 
    setActiveConversation, 
    sendMessage,
    createConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    archiveConversation,
    stopGeneration
  } = useInsightStore();
  
  const { profile } = useAuthStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState(COACHING_MODES[0]);
  const [isModeOpen, setIsModeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle autoPrompt for Trade Replay (Phase 6)
  useEffect(() => {
    const state = location.state as any;
    if (state?.autoPrompt && !isTyping) {
      setTimeout(() => {
        handleSend(state.autoPrompt);
        // Clear state to prevent loop on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }, 500);
    }
  }, [location.state, isTyping, navigate]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [conversations, activeConversationId, setActiveConversation]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, isTyping]);

  const stats = computeStats(trades);
  const greeting = `${getTimeOfDayGreeting()}, ${profile?.fullName?.split(' ')[0] || 'Trader'}.`;

  const quickPrompts = [
    { icon: Target, label: 'Find emotional mistakes', question: 'What emotional mistakes am I making most often based on my notes?' },
    { icon: TrendingUp, label: 'Improve win rate', question: 'What specific changes to my strategy would most improve my win rate?' },
    { icon: BookOpen, label: 'Review this week', question: 'Summarize my performance this week and give me 3 actionable lessons.' },
    { icon: Activity, label: 'Risk analysis', question: 'Analyze my risk management — am I sizing correctly compared to my R:R?' },
  ];

  const handleSend = (userMessage: string) => {
    if (!userMessage.trim() || isTyping) return;
    setInputValue('');
    // Phase 4: Pass mode as part of the initial message or handled in backend via state.
    // For now, we prepend the mode instruction invisibly or backend will pick it up via a modified payload.
    sendMessage(`[MODE:${mode.id}] ${userMessage}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const startNewChat = () => {
    setActiveConversation(null);
    inputRef.current?.focus();
    if(window.innerWidth < 1024) setSidebarOpen(false);
  };

  // Group Conversations
  const groupedConversations = useMemo(() => {
    const filtered = conversations.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const pinned = filtered.filter(c => c.isPinned && !c.isArchived);
    const archived = filtered.filter(c => c.isArchived);
    const active = filtered.filter(c => !c.isPinned && !c.isArchived);

    const groups = {
      Today: [] as typeof conversations,
      Yesterday: [] as typeof conversations,
      'Previous 7 Days': [] as typeof conversations,
      Older: [] as typeof conversations
    };

    active.forEach(c => {
      const d = new Date(c.updatedAt!);
      const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diffDays = Math.floor((today - time) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups.Today.push(c);
      else if (diffDays === 1) groups.Yesterday.push(c);
      else if (diffDays <= 7) groups['Previous 7 Days'].push(c);
      else groups.Older.push(c);
    });

    return { pinned, archived, ...groups };
  }, [conversations, searchQuery]);

  const renderConvItem = (conv: any) => (
    <div 
      key={conv.id} 
      className={cn(
        "group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors border border-transparent",
        activeConversationId === conv.id ? "bg-surface-2 border-border" : "hover:bg-surface-1"
      )}
      onClick={() => { if (editingConvId !== conv.id) { setActiveConversation(conv.id); if(window.innerWidth < 1024) setSidebarOpen(false); } }}
    >
      {editingConvId === conv.id ? (
        <input 
          autoFocus
          className="flex-1 bg-surface-0 border border-accent rounded px-2 py-1 text-sm outline-none w-full text-primary"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => {
            if (editTitle.trim() && editTitle !== conv.title) renameConversation(conv.id, editTitle);
            setEditingConvId(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
      ) : (
        <span className="text-[13px] text-secondary group-hover:text-primary truncate pr-2">
          {conv.title.replace(/^\[MODE:.*?\]\s*/i, '')}
        </span>
      )}
      
      {!editingConvId && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-surface-1 via-surface-1 pl-2">
          <button onClick={(e) => { e.stopPropagation(); pinConversation(conv.id, !conv.isPinned); }} className="p-1 text-tertiary hover:text-primary">
             <Pin className={cn("w-3 h-3", conv.isPinned && "text-accent fill-accent")} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setEditTitle(conv.title); setEditingConvId(conv.id); }} className="p-1 text-tertiary hover:text-primary">
            <Edit2 className="w-3 h-3" />
          </button>
          {!conv.isArchived && (
            <button onClick={(e) => { e.stopPropagation(); archiveConversation(conv.id, true); }} className="p-1 text-tertiary hover:text-primary">
              <Archive className="w-3 h-3" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 text-tertiary hover:text-danger">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-surface-0">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Left Sidebar ── */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-surface-0 border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-3">
          <button onClick={startNewChat} className="flex items-center justify-between w-full p-3 bg-surface-0 hover:bg-surface-1 border border-border rounded-xl text-sm font-medium text-primary transition-colors">
            <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> New chat</span>
            <Edit2 className="w-4 h-4 text-tertiary" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
            <input 
              type="text" 
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-1 border border-transparent focus:border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none text-primary placeholder:text-tertiary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-4 pb-4 mt-2">
          {groupedConversations.pinned.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-tertiary mb-2 px-2">Pinned</h3>
              <div className="flex flex-col gap-0.5">{groupedConversations.pinned.map(renderConvItem)}</div>
            </div>
          )}
          {groupedConversations.Today.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-tertiary mb-2 px-2">Today</h3>
              <div className="flex flex-col gap-0.5">{groupedConversations.Today.map(renderConvItem)}</div>
            </div>
          )}
          {groupedConversations.Yesterday.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-tertiary mb-2 px-2">Yesterday</h3>
              <div className="flex flex-col gap-0.5">{groupedConversations.Yesterday.map(renderConvItem)}</div>
            </div>
          )}
          {groupedConversations['Previous 7 Days'].length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-tertiary mb-2 px-2">Previous 7 Days</h3>
              <div className="flex flex-col gap-0.5">{groupedConversations['Previous 7 Days'].map(renderConvItem)}</div>
            </div>
          )}
          {groupedConversations.Older.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-tertiary mb-2 px-2">Older</h3>
              <div className="flex flex-col gap-0.5">{groupedConversations.Older.map(renderConvItem)}</div>
            </div>
          )}
          {groupedConversations.archived.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-tertiary mb-2 px-2">Archived</h3>
              <div className="flex flex-col gap-0.5">{groupedConversations.archived.map(renderConvItem)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Main: Chat Workspace ── */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-surface-0">
        
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border bg-surface-0 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 lg:hidden text-tertiary hover:text-primary">
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={() => setIsModeOpen(!isModeOpen)} className="flex items-center gap-2 text-primary font-medium hover:bg-surface-1 px-3 py-1.5 rounded-lg transition-colors">
                <span className="text-[15px]">Lunar AI</span>
                <span className="text-tertiary text-sm">v2.0</span>
                <mode.icon className="w-4 h-4 text-tertiary ml-1" />
              </button>
              
              <AnimatePresence>
                {isModeOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-surface-1 border border-border rounded-xl shadow-xl py-2 z-50"
                  >
                    <div className="px-3 pb-2 mb-2 border-b border-border">
                      <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Coaching Modes</span>
                    </div>
                    {COACHING_MODES.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => { setMode(m); setIsModeOpen(false); }}
                        className={cn("w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors", mode.id === m.id ? "bg-accent/10 text-accent" : "text-secondary hover:bg-surface-2 hover:text-primary")}
                      >
                        <m.icon className="w-4 h-4" />
                        {m.label}
                        {mode.id === m.id && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => handleSend('[REPORTS] Generate Daily Review')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-1 hover:bg-surface-2 border border-border rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors">
               <Calendar className="w-4 h-4" /> Daily
             </button>
             <button onClick={() => handleSend('[REPORTS] Generate Weekly Review')} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-1 hover:bg-surface-2 border border-border rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors">
               <PieChart className="w-4 h-4" /> Weekly
             </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-8 w-full custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 pb-10">
            {/* Empty State */}
            {messages.length === 0 && !streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-16 h-16 rounded-full bg-surface-1 flex items-center justify-center shadow-sm mb-6">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-medium text-primary tracking-tight mb-2">{greeting} 👋</h2>
                <p className="text-secondary text-[15px] mb-8 max-w-md">
                  I'm your TradeVault AI Coach.<br/>
                  I can help you analyze trades, improve discipline, review journals, and build better trading habits.<br/>
                  What would you like to work on today?
                </p>

                {trades.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                    {quickPrompts.map((prompt, i) => (
                      <motion.button
                        key={prompt.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * i }}
                        onClick={() => handleSend(prompt.question)}
                        disabled={isTyping}
                        className="p-4 rounded-xl border border-border bg-surface-0 hover:bg-surface-1 transition-colors group flex flex-col gap-2"
                      >
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <prompt.icon className="w-4 h-4 text-tertiary group-hover:text-primary transition-colors" />
                          {prompt.label}
                        </div>
                        <span className="text-sm text-tertiary group-hover:text-secondary line-clamp-1">
                          {prompt.question}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Render Thread */}
            {messages.map((msg, i) => (
              msg.role === 'user' 
                ? <UserMessageBubble key={i} content={msg.content.replace(/^\[MODE:.*?\] /, '')} />
                : <AIMessageBubble key={i} content={msg.content} />
            ))}

            {/* Render Streaming Message */}
            {streamingMessage && <AIMessageBubble content={streamingMessage} isStreaming />}
            
            {/* Typing Indicator */}
            {isTyping && !streamingMessage && <TypingIndicator />}

            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        {/* Input Box */}
        <div className="p-4 bg-surface-0 shrink-0 w-full">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative flex items-end gap-2 bg-surface-1 p-2 rounded-2xl border border-border focus-within:border-primary/50 transition-colors shadow-sm">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isTyping ? "Lunar AI is thinking..." : "Message Lunar AI..."}
                className="flex-1 bg-transparent resize-none outline-none text-[15px] text-primary placeholder:text-tertiary max-h-[240px] py-3 px-4 min-h-[80px] custom-scrollbar"
                rows={3}
                disabled={isTyping || trades.length === 0}
                style={{ height: 'auto', minHeight: '80px' }}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 240) + 'px';
                }}
              />
              <div className="flex items-center pb-2 pr-2 shrink-0">
                {isTyping ? (
                  <button
                    onClick={stopGeneration}
                    className="w-8 h-8 bg-surface-3 hover:bg-surface-4 text-primary rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim() || trades.length === 0}
                    className="w-8 h-8 bg-primary hover:bg-primary-hover text-surface-0 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:bg-surface-3 disabled:text-tertiary"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-tertiary mt-2">
              Lunar AI can make mistakes. Consider verifying critical trading metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
