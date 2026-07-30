import React, { useState, useEffect } from 'react';
import { ArrowLeft, Zap, TrendingUp, BarChart2 } from 'lucide-react';
import MarketOverviewHero from '../components/markets/MarketOverviewHero';
import InteractiveMarketChart from '../components/markets/InteractiveMarketChart';
import MarketAISummary from '../components/markets/MarketAISummary';
import MarketBreadth from '../components/markets/MarketBreadth';
import SectorHeatmap from '../components/markets/SectorHeatmap';
import EconomicCalendar from '../components/markets/EconomicCalendar';
import BreakingNewsTimeline, { NewsItem } from '../components/markets/BreakingNewsTimeline';
import MarketIntelligenceCenter from '../components/markets/MarketIntelligenceCenter';
import { NewsEngineFeed } from '../components/markets/NewsEngineFeed';
import { DigestPanel } from '../components/markets/DigestPanel';
import Watchlist from '../components/markets/Watchlist';
import MarketSnapshots from '../components/markets/MarketSnapshots';

type MarketTab = 'overview' | 'engine' | 'digest';

const TAB_CONFIG: { id: MarketTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'overview',  label: 'Market Overview',    icon: <TrendingUp size={14} /> },
  { id: 'engine',   label: 'AI Intelligence',    icon: <Zap size={14} />,        badge: 'Live' },
  { id: 'digest',   label: "Today's Digest",     icon: <BarChart2 size={14} /> },
];

export default function Markets() {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [activeTab, setActiveTab] = useState<MarketTab>('overview');

  // Check URL params for tab on mount (allows deep-linking from notifications)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as MarketTab;
    if (tab && ['overview', 'engine', 'digest'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (selectedArticle) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedArticle]);

  if (selectedArticle) {
    return (
      <div className="w-full min-h-screen bg-canvas pb-24">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-sm font-medium text-tertiary hover:text-primary transition-colors mb-8 group"
          >
            <div className="p-1.5 rounded-md bg-surface-2 group-hover:bg-surface-3 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Market Intelligence Hub
          </button>

          <MarketIntelligenceCenter article={{
            id: selectedArticle.id,
            headline: selectedArticle.title,
            source: selectedArticle.source,
            url: '',
            publishedAt: Date.now() / 1000 - 3600,
            summary: "Market analysis requested..."
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-canvas pb-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ─── Tab Navigation ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          padding: '4px', width: 'fit-content',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              id={`markets-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s ease',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.2) 100%)'
                  : 'transparent',
                color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.45)',
                boxShadow: activeTab === tab.id ? '0 2px 8px rgba(139,92,246,0.15)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span style={{
                  fontSize: '10px', padding: '1px 6px', borderRadius: '20px',
                  background: 'rgba(16,185,129,0.15)', color: '#10b981',
                  fontWeight: 700, letterSpacing: '0.3px',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Market Overview Tab ─────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in">
            <MarketOverviewHero />

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-8">
              {/* Left Main Column */}
              <div className="xl:col-span-8 flex flex-col gap-6">
                <InteractiveMarketChart />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <MarketAISummary type="market-summary" />
                  <MarketBreadth />
                </div>

                <div className="mt-2">
                  <SectorHeatmap />
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="xl:col-span-4 flex flex-col gap-6">
                <div className="h-[300px]">
                  <Watchlist />
                </div>
                <MarketSnapshots />
                <MarketAISummary type="daily-brief" />
                <BreakingNewsTimeline onAnalyze={setSelectedArticle} />
                <EconomicCalendar />
              </div>
            </div>
          </div>
        )}

        {/* ─── AI Intelligence Engine Tab ──────────────────────────────────── */}
        {activeTab === 'engine' && (
          <div className="animate-in fade-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 mb-5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(59,130,246,0.03) 100%)', border: '1px solid rgba(139,92,246,0.14)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">⚡</span>
                  <h2 className="text-[18px] font-bold text-white/90 m-0">AI Market Intelligence Engine</h2>
                </div>
                <p className="text-[13px] text-white/45 leading-relaxed m-0">
                  Continuous NSE/BSE/RBI monitoring with AI sector-level impact analysis.
                  All analysis is educational only — not investment advice.
                </p>
              </div>
              <div className="flex-shrink-0 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-[11px] font-bold tracking-wider text-emerald-400">EDUCATIONAL MODE</span>
              </div>
            </div>

            {/* Feed */}
            <div className="rounded-2xl px-6 py-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', minHeight: '60vh' }}>
              <NewsEngineFeed />
            </div>
          </div>
        )}

        {/* ─── Today's Digest Tab ──────────────────────────────────────────── */}
        {activeTab === 'digest' && (
          <div className="animate-in fade-in">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 py-5 mb-5 rounded-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(139,92,246,0.03) 100%)', border: '1px solid rgba(59,130,246,0.14)' }}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">📰</span>
                  <h2 className="text-[18px] font-bold text-white/90 m-0">Pre-Market Digest</h2>
                </div>
                <p className="text-[13px] text-white/45 leading-relaxed m-0">
                  Published at 7:30 AM IST on trading days. AI-generated sector impact summary.
                </p>
              </div>
            </div>

            {/* Content — max readable width */}
            <div className="max-w-3xl rounded-2xl px-6 py-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <DigestPanel />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
