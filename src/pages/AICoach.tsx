import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle,
  Coffee,
  TrendingUp,
  TrendingDown,
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookMarked,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
} from 'lucide-react';
import { useTradeStore } from '../stores/tradeStore';
import { useInsightStore, CoachMemory } from '../stores/insightStore';
import {
  detectRevengeTrades,
  detectBoredomTrades,
  findBestStrategy,
  formatPercent,
} from '../lib/analytics';
import Button from '../components/ui/Button';

// ─── Severity config ─────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: {
    border: 'border-loss/40',
    bg: 'bg-loss-dim/30',
    badge: 'bg-loss/15 text-loss',
    dot: 'bg-loss',
    label: 'Critical',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  warning: {
    border: 'border-gold-border/60',
    bg: 'bg-gold-dim/20',
    badge: 'bg-gold/15 text-gold',
    dot: 'bg-gold',
    label: 'Warning',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  improving: {
    border: 'border-profit/30',
    bg: 'bg-profit-dim/20',
    badge: 'bg-profit/15 text-profit',
    dot: 'bg-profit',
    label: 'Improving',
    icon: <TrendingDown className="h-3.5 w-3.5" />,
  },
  positive: {
    border: 'border-profit/40',
    bg: 'bg-profit-dim/30',
    badge: 'bg-profit/20 text-profit',
    dot: 'bg-profit',
    label: 'Positive',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
};

// ─── Trend badge ─────────────────────────────────────────────────────────────
function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (previous === 0) return null;

  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-loss bg-loss/10 border border-loss/20 px-2 py-0.5 rounded-full">
        <ArrowUp className="h-3 w-3" /> +{diff} from last check
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-profit bg-profit/10 border border-profit/20 px-2 py-0.5 rounded-full">
        <ArrowDown className="h-3 w-3" /> {diff} from last check
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary bg-surface/50 border border-tv-border px-2 py-0.5 rounded-full">
      <Minus className="h-3 w-3" /> Unchanged
    </span>
  );
}

// ─── Coach Memory Card ────────────────────────────────────────────────────────
function MemoryCard({ memory }: { memory: CoachMemory }) {
  const cfg = SEVERITY_CONFIG[memory.severity] || SEVERITY_CONFIG.warning;
  return (
    <div className={`border ${cfg.border} ${cfg.bg} rounded-tv-lg p-4 space-y-2.5 transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} mt-0.5`} />
          <span className="text-tv-sm font-semibold text-primary leading-tight">{memory.title}</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      <p className="text-tv-sm text-secondary leading-relaxed pl-4.5 ml-0.5">{memory.description}</p>

      <div className="pl-4.5 ml-0.5">
        <TrendBadge current={memory.count} previous={memory.previousCount} />
      </div>

      {memory.updatedAt && (
        <p className="text-[10px] text-muted pl-4.5 ml-0.5">
          Last updated {new Date(memory.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AICoach() {
  const { trades } = useTradeStore();
  const { insights, coachMemory, fetchInsights, fetchCoachMemory, runAnalysis, loading } = useInsightStore();
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
    fetchCoachMemory();
  }, [fetchInsights, fetchCoachMemory]);

  // Compute coach card states (frontend quick stats)
  const revengeCount = detectRevengeTrades(trades);
  const boredomCount = detectBoredomTrades(trades);
  const bestStrategy = findBestStrategy(trades);

  const handleRunAnalysis = async () => {
    try {
      await runAnalysis();
    } catch {
      alert('Failed to run analysis. Check your server console for details.');
    }
  };

  const toggleInsight = (id: string) => {
    setExpandedInsightId(prev => prev === id ? null : id);
  };

  const latestInsight = insights[0];

  return (
    <div className="max-w-[820px] space-y-5 page-enter font-ui">
      {/* Header */}
      <div>
        <h2 className="text-tv-lg font-bold text-primary">AI Coach</h2>
        <p className="text-tv-sm text-secondary mt-0.5">
          Hyper-personal behavioral analysis. Every insight is backed by your real trade data.
        </p>
      </div>

      {/* Row 1: Quick Stats Cards */}
      <div className="flex flex-col md:flex-row gap-[14px]">
        <div className="flex-1 border border-loss/20 bg-loss-dim/40 rounded-tv-lg p-[18px] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="label-section text-loss block">Revenge Trades</span>
            <span className="text-tv-xl font-mono font-bold text-loss">{revengeCount}</span>
            <span className="text-[11px] text-secondary block">Detected patterns</span>
          </div>
          <AlertTriangle className="h-9 w-9 text-loss opacity-80" />
        </div>

        <div className="flex-1 border border-gold-border bg-gold-dim/40 rounded-tv-lg p-[18px] flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="label-section text-gold block">Boredom Trades</span>
            <span className="text-tv-xl font-mono font-bold text-gold">{boredomCount}</span>
            <span className="text-[11px] text-secondary block">Forced setups</span>
          </div>
          <Coffee className="h-9 w-9 text-gold opacity-80" />
        </div>

        <div className="flex-1 border border-profit/20 bg-profit-dim/40 rounded-tv-lg p-[18px] flex items-center justify-between">
          <div className="space-y-1.5 min-w-0">
            <span className="label-section text-profit block">Top Symbol</span>
            <span className="text-tv-md font-bold text-profit truncate block">
              {bestStrategy ? bestStrategy.name : 'N/A'}
            </span>
            <span className="text-[11px] text-secondary block">
              {bestStrategy ? `${formatPercent(bestStrategy.winRate)} Win Rate` : 'No data'}
            </span>
          </div>
          <TrendingUp className="h-9 w-9 text-profit opacity-80" />
        </div>
      </div>

      {/* ── Coach Memory Panel ── */}
      {coachMemory.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2.5 border-b border-tv-border pb-3">
            <BookMarked className="h-4 w-4 text-accent" />
            <div>
              <h3 className="text-tv-md font-semibold text-primary">Coach Memory</h3>
              <p className="text-[11px] text-secondary mt-0.5">
                Behavioral patterns the AI has identified and is tracking over time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coachMemory.map(memory => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        </div>
      )}

      {/* ── Deep Analysis Panel ── */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-tv-border pb-3">
          <div>
            <h3 className="text-tv-md font-semibold text-primary flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              Deep Analysis Coach
            </h3>
            <p className="text-tv-sm text-secondary mt-0.5">
              Personalized debrief — every sentence references your actual trade data.
            </p>
          </div>
          <Button
            variant="primary"
            loading={loading}
            icon={<Brain className="h-4 w-4" />}
            onClick={handleRunAnalysis}
          >
            Run Analysis
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-base/20 border border-tv-border rounded-tv-lg">
            <Loader2 className="h-8 w-8 text-accent animate-spin-slow" />
            <span className="text-tv-sm text-secondary font-medium">Analyzing your trade history...</span>
            <span className="text-[11px] text-muted">Computing patterns • Building behavioral profile • Generating insights</span>
          </div>
        )}

        {/* Latest Insight — rendered as Markdown */}
        {latestInsight && !loading && (
          <div className="bg-base/40 border border-tv-border rounded-tv-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-tv-xs text-accent-light font-mono uppercase tracking-wider">
                Latest Analysis — Powered by Groq AI
              </span>
              <span className="text-[11px] text-muted">
                {new Date(latestInsight.createdAt).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            <div className="prose prose-sm prose-invert max-w-none text-primary leading-relaxed
                [&_p]:text-tv-sm [&_p]:text-primary [&_p]:mb-2
                [&_ul]:space-y-2 [&_li]:text-tv-sm [&_li]:text-primary
                [&_strong]:text-primary [&_strong]:font-semibold
                [&_li::marker]:text-accent">
              <ReactMarkdown>{latestInsight.content}</ReactMarkdown>
            </div>
            {latestInsight.tradesAnalyzedCount && (
              <div className="mt-3 pt-3 border-t border-tv-border/50">
                <span className="text-[11px] text-muted">{latestInsight.tradesAnalyzedCount} trades analyzed in this session</span>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!latestInsight && !loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-secondary">
            <Brain className="h-10 w-10 opacity-30 mb-2" />
            <p className="text-sm font-medium">No analysis yet.</p>
            <p className="text-xs opacity-70 text-center max-w-xs">
              Click "Run Analysis" to receive your first hyper-personal coaching debrief based on your real trade data.
            </p>
          </div>
        )}
      </div>

      {/* ── History Accordion ── */}
      {insights.length > 1 && (
        <div className="space-y-3">
          <span className="label-section text-muted block">Analysis History</span>
          <div className="space-y-2">
            {insights.slice(1).map((insight) => {
              const isExpanded = expandedInsightId === insight.id;
              const formattedDate = new Date(insight.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              });
              return (
                <div key={insight.id} className="border border-tv-border rounded-tv-lg bg-surface/25 overflow-hidden">
                  <button
                    onClick={() => toggleInsight(insight.id)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Brain className="h-[15px] w-[15px] text-accent shrink-0" />
                      <span className="text-tv-sm font-semibold text-primary font-ui">Session Review — {formattedDate}</span>
                      {insight.tradesAnalyzedCount && (
                        <span className="text-[11px] text-secondary font-ui bg-accent-dim px-2 py-0.5 rounded-full select-none">
                          {insight.tradesAnalyzedCount} trades
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="h-[15px] w-[15px] text-secondary" /> : <ChevronDown className="h-[15px] w-[15px] text-secondary" />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 border-t border-tv-border bg-base/20 prose prose-sm prose-invert max-w-none
                        [&_p]:text-tv-sm [&_p]:text-primary [&_p]:mb-2
                        [&_ul]:space-y-1.5 [&_li]:text-tv-sm [&_li]:text-primary">
                      <ReactMarkdown>{insight.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
