/**
 * NewsEngineFeed — AI Market Intelligence Feed
 * Complete redesign: premium card layout, smooth animations, filter bar, OHLC-style badges
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNewsStore, EngineFeedItem } from '../../stores/newsStore';
import { RefreshCw, Zap, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronDown, ExternalLink, Activity } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────

const DIR = {
  positive: { label: 'Bullish',  icon: TrendingUp,   color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)'  },
  negative: { label: 'Bearish',  icon: TrendingDown,  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'   },
  neutral:  { label: 'Neutral',  icon: Minus,         color: '#6b7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
  mixed:    { label: 'Mixed',    icon: Activity,      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)'  },
} as const;

const CONF = {
  high:   { label: 'High',    dot: '#10b981' },
  medium: { label: 'Medium',  dot: '#f59e0b' },
  low:    { label: 'Low',     dot: '#6b7280' },
} as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Feed Card ────────────────────────────────────────────────────────────────

function FeedCard({ item, expanded, onToggle }: { item: EngineFeedItem; expanded: boolean; onToggle: () => void }) {
  const dir  = DIR[item.direction]  ?? DIR.neutral;
  const conf = CONF[item.confidence] ?? CONF.low;
  const DirIcon = dir.icon;
  const isBreaking = item.urgency === 'breaking';

  return (
    <div
      onClick={onToggle}
      className="group relative cursor-pointer rounded-xl border transition-all duration-200"
      style={{
        background: isBreaking
          ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(15,15,25,0.9) 100%)'
          : 'rgba(255,255,255,0.025)',
        borderColor: isBreaking ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)',
        marginBottom: '8px',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = isBreaking
          ? 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(20,20,35,0.95) 100%)'
          : 'rgba(255,255,255,0.05)';
        (e.currentTarget as HTMLElement).style.borderColor = isBreaking
          ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = isBreaking
          ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(15,15,25,0.9) 100%)'
          : 'rgba(255,255,255,0.025)';
        (e.currentTarget as HTMLElement).style.borderColor = isBreaking ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Breaking side stripe */}
      {isBreaking && (
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-red-500 to-red-400" />
      )}

      <div className="px-4 py-3" style={{ paddingLeft: isBreaking ? '18px' : '16px' }}>
        {/* Top row: source + time + badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isBreaking && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
              Breaking
            </span>
          )}
          <span className="text-[11px] font-semibold text-white/40 bg-white/[0.05] px-2 py-0.5 rounded-md">
            {item.source}
          </span>
          <span className="text-[11px] text-white/25">{timeAgo(item.publishedAt)}</span>

          {/* Direction badge */}
          <span
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border"
            style={{ color: dir.color, background: dir.bg, borderColor: dir.border }}
          >
            <DirIcon size={10} />
            {dir.label}
          </span>

          {/* Confidence dot */}
          <span className="inline-flex items-center gap-1 text-[11px] text-white/30">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: conf.dot }} />
            {conf.label}
          </span>
        </div>

        {/* Headline */}
        <p className="text-[13.5px] font-semibold text-white/85 leading-snug mb-2.5">
          {item.headline}
        </p>

        {/* Sector pills */}
        {item.sectors.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {item.sectors.slice(0, 4).map(s => (
              <span
                key={s}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,92,246,0.1)', color: 'rgba(167,139,250,0.85)', border: '1px solid rgba(139,92,246,0.18)' }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Expand toggle */}
        <div className="flex items-center gap-1 text-[11px] text-white/25 mt-1">
          <ChevronDown
            size={12}
            className="transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
          <span>{expanded ? 'Collapse' : 'View AI Analysis'}</span>
        </div>
      </div>

      {/* Expanded analysis */}
      {expanded && (
        <div
          className="px-4 pb-4 border-t"
          style={{
            paddingLeft: isBreaking ? '18px' : '16px',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          <div className="pt-3">
            {/* Rationale */}
            <p className="text-[13px] text-white/65 leading-relaxed mb-3">{item.rationale}</p>

            {/* Historical analogues */}
            {item.historicalAnalogues?.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2">Historical Context</p>
                <div className="flex flex-col gap-1.5">
                  {item.historicalAnalogues.slice(0, 2).map((a, i) => (
                    <p
                      key={i}
                      className="text-[12px] text-white/50 pl-3 leading-relaxed"
                      style={{ borderLeft: '2px solid rgba(139,92,246,0.3)' }}
                    >
                      {a}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Source link */}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-violet-400/80 hover:text-violet-300 transition-colors mb-3"
              >
                View Source <ExternalLink size={10} />
              </a>
            )}

            {/* Disclaimer */}
            <div className="rounded-lg p-2.5 mt-1" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
              <p className="text-[10px] text-amber-400/60 leading-relaxed m-0">{item.disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NewsEngineFeed({ compact = false }: { compact?: boolean }) {
  const {
    engineFeed, loadingFeed, feedError, selectedSector,
    availableSectors, fetchEngineFeed, fetchAvailableSectors, setSelectedSector,
  } = useNewsStore();

  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [dirFilter,  setDirFilter]           = useState('all');
  const [isRefreshing, setIsRefreshing]      = useState(false);

  useEffect(() => {
    fetchAvailableSectors();
    fetchEngineFeed({ limit: compact ? 10 : 30 });
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEngineFeed({ limit: compact ? 10 : 30, sector: selectedSector || undefined });
    setTimeout(() => setIsRefreshing(false), 600);
  }, [fetchEngineFeed, selectedSector, compact]);

  const filteredFeed = dirFilter === 'all'
    ? engineFeed
    : engineFeed.filter(i => i.direction === dirFilter);

  const breakingCount = engineFeed.filter(i => i.urgency === 'breaking').length;
  const counts = {
    all: engineFeed.length,
    positive: engineFeed.filter(i => i.direction === 'positive').length,
    negative: engineFeed.filter(i => i.direction === 'negative').length,
    mixed:    engineFeed.filter(i => i.direction === 'mixed').length,
  };

  return (
    <div className="flex flex-col h-full">

      {/* ─── Stats bar ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',    val: counts.all,      color: 'text-white/70' },
          { label: 'Bullish',  val: counts.positive, color: 'text-emerald-400' },
          { label: 'Bearish',  val: counts.negative, color: 'text-red-400' },
          { label: 'Mixed',    val: counts.mixed,    color: 'text-amber-400' },
        ].map(({ label, val, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className={`text-xl font-bold font-mono tabular-nums ${color}`}>{val}</p>
            <p className="text-[10px] text-white/30 font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ─── Filter row ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Direction filter */}
        <div className="flex items-center rounded-xl p-1 gap-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['all', 'positive', 'negative', 'mixed'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150"
              style={{
                background: dirFilter === d ? 'rgba(139,92,246,0.25)' : 'transparent',
                color: dirFilter === d ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              }}
            >
              {d === 'all' ? `All (${counts.all})` : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ─── Sector pills ──────────────────────────────────────────────── */}
      {!compact && availableSectors.length > 0 && (
        <div
          className="flex gap-2 mb-4 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {[null, ...availableSectors].map(s => (
            <button
              key={s ?? '__all__'}
              onClick={() => setSelectedSector(s)}
              className="flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 whitespace-nowrap"
              style={{
                background: selectedSector === s ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedSector === s ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                border: selectedSector === s ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {s ?? 'All Sectors'}
            </button>
          ))}
        </div>
      )}

      {/* ─── Feed content ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>

        {/* Loading skeleton */}
        {loadingFeed && (
          <div className="flex flex-col gap-2">
            {[1,2,3,4].map(n => (
              <div key={n} className="rounded-xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-16 rounded-md" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-4 w-12 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div className="h-4 w-full rounded-md mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-4 w-3/4 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loadingFeed && feedError && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-red-400 mb-1">Pipeline Unavailable</p>
              <p className="text-xs text-white/30">The AI engine is starting up. Try again shortly.</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 rounded-lg text-xs font-bold text-violet-400 transition-colors"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loadingFeed && !feedError && filteredFeed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Zap size={24} className="text-violet-400/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/50 mb-1">No items yet</p>
              <p className="text-xs text-white/25 max-w-xs">
                {selectedSector ? `No ${dirFilter === 'all' ? '' : dirFilter + ' '}items for ${selectedSector} yet.` : 'The pipeline is warming up. Items appear during market hours.'}
              </p>
            </div>
          </div>
        )}

        {/* Feed items */}
        {!loadingFeed && filteredFeed.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(prev => prev === item.id ? null : item.id)}
          />
        ))}
      </div>

      {/* ─── Disclaimer footer ─────────────────────────────────────────── */}
      {filteredFeed.length > 0 && (
        <div className="mt-4 rounded-lg px-3 py-2" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
          <p className="text-[10px] text-amber-400/50 leading-relaxed">
            ⚠️ All analysis is for educational purposes only and does not constitute investment advice. TradeVault is not a SEBI-registered Research Analyst.
          </p>
        </div>
      )}
    </div>
  );
}
