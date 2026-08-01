/**
 * LiveAISummary — Real-Time AI Market Summary
 *
 * Fetches a Groq-generated market summary using live Yahoo Finance data.
 * Displays: Sentiment, Highlights, Risks, Events to Watch, Educational Insight.
 * Auto-refreshes every 5 minutes.
 * Shows disclaimer prominently.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain, Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, BookOpen, Shield, Eye, Minus, Zap,
} from 'lucide-react';
import { useAISummary, type MarketSummary, type MarketSentiment } from '../../hooks/useMarketData';

// ─── Sentiment Config ─────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<MarketSentiment, {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: typeof TrendingUp;
}> = {
  BULLISH: {
    label: 'Bullish',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(16,185,129,0.25)',
    icon: TrendingUp,
  },
  BEARISH: {
    label: 'Bearish',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
    icon: TrendingDown,
  },
  NEUTRAL: {
    label: 'Neutral',
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.12)',
    border: 'rgba(107,114,128,0.25)',
    icon: Minus,
  },
  MIXED: {
    label: 'Mixed',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    icon: Zap,
  },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AISummarySkeleton() {
  return (
    <div className="relative p-1 rounded-2xl bg-gradient-to-br from-accent/20 via-surface-1 to-surface-1">
      <div className="bg-surface-0 rounded-xl p-6 border border-accent/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 animate-pulse shrink-0">
            <Brain className="w-5 h-5 text-accent/40" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-surface-2 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-surface-1 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-surface-2 rounded animate-pulse w-full" />
          <div className="h-3 bg-surface-1 rounded animate-pulse w-5/6" />
          <div className="h-3 bg-surface-1 rounded animate-pulse w-4/6" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="h-20 bg-surface-1 rounded-xl animate-pulse border border-border" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveAISummary() {
  const { summary, loading, retrying, error, refresh } = useAISummary();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    if (summary) {
      const d = new Date(summary.generatedAt);
      setLastUpdated(d.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
      }));
    }
  }, [summary]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [refresh]);

  if (loading) {
    return (
      <>
        <AISummarySkeleton />
        {retrying && (
          <p className="text-[10px] text-tertiary text-center mt-1 opacity-70">
            Retrying AI connection...
          </p>
        )}
      </>
    );
  }

  if (error || !summary) {
    return (
      <div className="relative p-1 rounded-2xl bg-gradient-to-br from-accent/20 via-surface-1 to-surface-1">
        <div className="bg-surface-0 rounded-xl p-6 border border-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary flex items-center gap-2">
                Today's Market Summary
              </h3>
              <p className="text-xs text-tertiary mt-0.5">Live contextual analysis powered by AI</p>
            </div>
          </div>
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2 opacity-80" />
            <p className="text-sm text-secondary font-medium">
              Unable to generate market summary
            </p>
            <p className="text-xs text-tertiary mt-1 max-w-[240px] mx-auto">
              The AI service is temporarily unavailable or experiencing high demand. Please try again.
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-medium text-surface-0 bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              {isRefreshing ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sentimentCfg = SENTIMENT_CONFIG[summary.sentiment] ?? SENTIMENT_CONFIG.NEUTRAL;
  const SentimentIcon = sentimentCfg.icon;

  return (
    <div className="relative h-fit p-1 rounded-2xl bg-gradient-to-br from-accent/20 via-surface-1 to-surface-1">
      <div className="bg-surface-0 rounded-xl p-6 h-full border border-accent/10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shrink-0">
              <Brain className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary flex items-center gap-2">
                Today's Market Summary
                <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              </h3>
              <p className="text-xs text-tertiary mt-0.5">
                Live contextual analysis • Updated at {lastUpdated} IST
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-1 transition-colors"
            title="Refresh AI summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Sentiment Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-5"
          style={{ background: sentimentCfg.bg, color: sentimentCfg.color, border: `1px solid ${sentimentCfg.border}` }}
        >
          <SentimentIcon className="w-4 h-4" />
          {sentimentCfg.label} Market
        </div>

        {/* Highlights & Risks */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Highlights */}
          <div className="p-3 bg-surface-1/50 rounded-xl border border-success/20">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-success mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Key Highlights
            </span>
            <ul className="space-y-1.5">
              {summary.highlights.map((h, i) => (
                <li key={i} className="text-xs text-secondary leading-relaxed flex items-start gap-1.5">
                  <span className="text-success mt-0.5 shrink-0">•</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="p-3 bg-surface-1/50 rounded-xl border border-warning/20">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-warning mb-2">
              <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors
            </span>
            <ul className="space-y-1.5">
              {summary.risks.map((r, i) => (
                <li key={i} className="text-xs text-secondary leading-relaxed flex items-start gap-1.5">
                  <span className="text-warning mt-0.5 shrink-0">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Events to Watch */}
        {summary.eventsToWatch.length > 0 && (
          <div className="p-3 bg-surface-1/50 rounded-xl border border-accent/20 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-accent mb-2">
              <Eye className="w-3.5 h-3.5" /> Events to Watch
            </span>
            <ul className="space-y-1">
              {summary.eventsToWatch.map((e, i) => (
                <li key={i} className="text-xs text-secondary flex items-start gap-1.5">
                  <span className="text-accent mt-0.5 shrink-0">→</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Educational Insight */}
        {summary.educationalInsight && (
          <div className="p-3 bg-surface-1/50 rounded-xl border border-iris/20 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-iris mb-2">
              <BookOpen className="w-3.5 h-3.5" /> Educational Insight
            </span>
            <p className="text-xs text-secondary leading-relaxed">{summary.educationalInsight}</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 pt-3 border-t border-border">
          <Shield className="w-3.5 h-3.5 text-tertiary shrink-0 mt-0.5" />
          <p className="text-[10px] text-tertiary leading-relaxed">
            {summary.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
