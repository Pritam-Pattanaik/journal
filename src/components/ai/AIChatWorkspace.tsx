import React, { useState, useEffect, useRef } from 'react';
import { Send, StopCircle, RefreshCw, Activity, ArrowRight, Brain, AlertTriangle, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useInsightStore } from '../../stores/insightStore';
import { cn } from '../../lib/cn';
import UserMessageBubble from './UserMessageBubble';
import { StreamedMarkdown } from './StreamedMarkdown';

interface Props {
  conversationId: string;
}

const ACTION_SUGGESTIONS = [
  "Analyze my most recent trades",
  "Review my discipline score over the last week",
  "What is my biggest psychological trap right now?",
  "Evaluate my risk to reward ratio"
];

function MessageActions({ content, isLatest, onRegenerate }: { content: string, isLatest: boolean, onRegenerate: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <button className="p-1.5 rounded text-tertiary hover:text-primary hover:bg-surface-1 transition-colors">
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button className="p-1.5 rounded text-tertiary hover:text-loss hover:bg-surface-1 transition-colors">
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}

export default function AIChatWorkspace({ conversationId }: Props) {
  const { messages, streamingMessage, isTyping, sendMessage, stopGeneration, regenerateResponse, loading, conversations } = useInsightStore();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages or stream change
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage]);

  // Listen for quick actions from EmptyWorkspace
  useEffect(() => {
    const handleQuickAction = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.prompt) {
        sendMessage(customEvent.detail.prompt);
      }
    };
    window.addEventListener('ai-quick-action', handleQuickAction);
    return () => window.removeEventListener('ai-quick-action', handleQuickAction);
  }, [sendMessage]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeConv = conversations.find(c => c.id === conversationId);

  return (
    <div className="flex flex-col h-full bg-canvas relative animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-14 border-b border-border bg-surface-0/80 backdrop-blur-md flex items-center px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-primary truncate max-w-[300px]">
            {activeConv ? activeConv.title : "TradeVault AI Mentor"}
          </h2>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">
              Groq (Testing)
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-tertiary">
            <Activity className="w-3 h-3" />
            Context Synced
          </div>
        </div>
      </div>

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
                        content={msg.content} 
                        isLatest={i === messages.length - 1} 
                        onRegenerate={regenerateResponse}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Streaming Message Indicator */}
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
          
          {/* Quick Suggestions (only if not typing and have messages) */}
          {!isTyping && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {ACTION_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(sug)}
                  className="px-3 py-1.5 rounded-full border border-border bg-surface-0 text-[11px] text-secondary hover:text-primary hover:bg-surface-1 hover:border-accent/30 transition-all flex items-center gap-1.5"
                >
                  {sug} <ArrowRight className="w-3 h-3 opacity-50" />
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
              placeholder="Ask the AI Coach to analyze your trades, psychology, or edge..."
              className="w-full bg-transparent p-4 pr-14 text-sm text-primary placeholder:text-tertiary focus:outline-none resize-none min-h-[60px] max-h-[200px]"
              rows={1}
            />
            
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              {isTyping ? (
                <button
                  onClick={stopGeneration}
                  className="w-8 h-8 rounded-lg bg-surface-2 text-tertiary hover:text-loss hover:bg-loss/10 flex items-center justify-center transition-colors"
                  title="Stop generation"
                >
                  <StopCircle className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-lg bg-accent text-base-dark flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  title="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-center text-[10px] text-tertiary font-medium">
            TradeVault AI can make mistakes. Always verify your own trading data.
          </div>
        </div>
      </div>

    </div>
  );
}
