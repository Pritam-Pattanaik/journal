/**
 * BreakingNewsTimeline — Live news from the AI Engine
 * Uses the real news-engine feed as its data source instead of mock data
 */
import React, { useEffect, useState } from 'react';
import { Flame, Brain, ExternalLink, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useNewsStore } from '../../stores/newsStore';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  sector: string;
  category: string;
  readTime: string;
}

const IMPACT_COLORS = {
  high:   { dot: '#ef4444', bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  medium: { dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  low:    { dot: '#10b981', bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
} as const;

// Map news-engine confidence → impact level
function confidenceToImpact(conf: string): 'high' | 'medium' | 'low' {
  if (conf === 'high') return 'high';
  if (conf === 'medium') return 'medium';
  return 'low';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Map direction to category tag
const DIRECTION_LABEL: Record<string, string> = {
  positive: 'Bullish',
  negative: 'Bearish',
  neutral:  'Neutral',
  mixed:    'Mixed',
};

interface BreakingNewsTimelineProps {
  onAnalyze: (item: NewsItem) => void;
}

const CATEGORY_FILTERS = ['All', 'RBI', 'Results', 'Macro', 'Global'];

export default function BreakingNewsTimeline({ onAnalyze }: BreakingNewsTimelineProps) {
  const { engineFeed, loadingFeed, fetchEngineFeed } = useNewsStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Always fetch on mount to ensure fresh news on every page visit (RCA-M06 fix)
    fetchEngineFeed({ limit: 20 });
    const interval = setInterval(() => {
      fetchEngineFeed({ limit: 20 });
    }, 5 * 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEngineFeed]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEngineFeed({ limit: 20 });
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Convert engine feed to NewsItem format, sorted by recency
  const allLiveItems = engineFeed
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 30)
    .map(item => ({
      id: item.id,
      title: item.headline,
      source: item.source,
      time: timeAgo(item.publishedAt),
      impact: confidenceToImpact(item.confidence),
      sector: item.sectors[0] || 'General',
      category: DIRECTION_LABEL[item.direction] || 'News',
      readTime: '2 min',
      url: item.url,
      urgency: item.urgency,
      direction: item.direction,
      // Category tags derived from sectors for filter matching
      sectorTags: item.sectors.map((s: string) => s.toLowerCase()),
    }));

  // Apply category filter (RCA-M07 fix: filter predicate was missing)
  const FILTER_MAP: Record<string, string[]> = {
    'All': [],
    'RBI': ['rbi', 'monetary policy', 'interest rate', 'central bank'],
    'Results': ['earnings', 'results', 'quarterly', 'profit', 'revenue'],
    'Macro': ['macro', 'gdp', 'inflation', 'economy', 'fiscal', 'budget'],
    'Global': ['global', 'fed', 'us market', 'china', 'world', 'international'],
  };

  const liveItems = activeFilter === 'All'
    ? allLiveItems.slice(0, 8)
    : allLiveItems.filter(item => {
        const keywords = FILTER_MAP[activeFilter] ?? [];
        const itemText = `${item.title} ${item.sector} ${item.sectorTags.join(' ')}`.toLowerCase();
        return keywords.some(kw => itemText.includes(kw));
      }).slice(0, 8);

  const breakingItems = liveItems.filter(i => i.urgency === 'breaking');

  return (
    <div
      className="flex flex-col"
      style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '20px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-red-400" />
          <h3 className="text-[14px] font-bold text-white/90">Breaking News</h3>
          {breakingItems.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              {breakingItems.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
            {loadingFeed
              ? <WifiOff size={10} />
              : <Wifi size={10} />}
            {loadingFeed ? 'Loading' : 'Live'}
          </span>
          <button
            onClick={handleRefresh}
            className="p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {CATEGORY_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
            style={{
              background: activeFilter === f ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
              color: activeFilter === f ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              border: activeFilter === f ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loadingFeed && liveItems.length === 0 && (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(n => (
            <div key={n} className="animate-pulse flex gap-3">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="flex-1">
                <div className="h-3 rounded mb-1.5" style={{ background: 'rgba(255,255,255,0.08)', width: '40%' }} />
                <div className="h-4 rounded mb-1" style={{ background: 'rgba(255,255,255,0.06)', width: '100%' }} />
                <div className="h-4 rounded" style={{ background: 'rgba(255,255,255,0.04)', width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      {!loadingFeed && liveItems.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[5px] top-2 bottom-2 w-px"
            style={{ background: 'linear-gradient(180deg, rgba(139,92,246,0.3) 0%, rgba(255,255,255,0.04) 100%)' }}
          />

          <div className="flex flex-col gap-0 pl-5">
            {liveItems.map((item, idx) => {
              const impact = IMPACT_COLORS[item.impact];
              const isBreaking = item.urgency === 'breaking';
              return (
                <div
                  key={item.id}
                  className="relative pb-5 group"
                >
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{
                      background: impact.dot,
                      borderColor: '#0d1117',
                      boxShadow: isBreaking ? `0 0 8px ${impact.dot}` : 'none',
                    }}
                  />
                  {isBreaking && (
                    <div
                      className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full animate-ping"
                      style={{ background: impact.dot, opacity: 0.4 }}
                    />
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {isBreaking && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                        ⚡ Breaking
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-white/50">{item.time}</span>
                    <span className="text-[10px] text-white/25">·</span>
                    <span className="text-[10px] font-semibold text-white/40">{item.source}</span>
                  </div>

                  {/* Headline */}
                  <p
                    className="text-[13px] font-semibold text-white/80 leading-snug mb-2 cursor-pointer group-hover:text-white/95 transition-colors"
                    onClick={() => onAnalyze({
                      id: item.id, title: item.title, source: item.source,
                      time: item.time, impact: item.impact, sector: item.sector,
                      category: item.category, readTime: item.readTime,
                    })}
                  >
                    {item.title}
                  </p>

                  {/* Tags + actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}
                    >
                      {item.sector}
                    </span>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: impact.bg, color: impact.text }}
                    >
                      {item.impact} confidence
                    </span>

                    {/* Actions — show on hover */}
                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onAnalyze({
                          id: item.id, title: item.title, source: item.source,
                          time: item.time, impact: item.impact, sector: item.sector,
                          category: item.category, readTime: item.readTime,
                        })}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                        style={{ background: 'rgba(139,92,246,0.1)' }}
                      >
                        <Brain size={10} /> AI Summary
                      </button>
                      {(item as any).url && (
                        <a
                          href={(item as any).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-white/25 hover:text-white/60 transition-colors"
                        >
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loadingFeed && liveItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-[13px] font-semibold text-white/30">No news yet</p>
          <p className="text-[11px] text-white/20 text-center">Live items appear here during market hours</p>
        </div>
      )}
    </div>
  );
}
