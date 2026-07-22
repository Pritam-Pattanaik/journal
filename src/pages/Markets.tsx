import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import MarketOverviewHero from '../components/markets/MarketOverviewHero';
import InteractiveMarketChart from '../components/markets/InteractiveMarketChart';
import MarketAISummary from '../components/markets/MarketAISummary';
import MarketBreadth from '../components/markets/MarketBreadth';
import SectorHeatmap from '../components/markets/SectorHeatmap';
import EconomicCalendar from '../components/markets/EconomicCalendar';
import BreakingNewsTimeline, { NewsItem } from '../components/markets/BreakingNewsTimeline';
import MarketIntelligenceCenter from '../components/markets/MarketIntelligenceCenter';

export default function Markets() {
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Scroll to top when an article is selected
  useEffect(() => {
    if (selectedArticle) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedArticle]);

  return (
    <div className="w-full min-h-screen bg-canvas pb-24">
      {selectedArticle ? (
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
          
          {/* MarketIntelligenceCenter expects an article object with id, headline etc, 
              we adapt our mock NewsItem to it for the sake of MVP */}
          <MarketIntelligenceCenter article={{
            id: selectedArticle.id,
            headline: selectedArticle.title,
            source: selectedArticle.source,
            url: '',
            publishedAt: Date.now() / 1000 - 3600, 
            summary: "Market analysis requested..."
          }} />
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in">
          
          {/* Top Hero Section */}
          <MarketOverviewHero />

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-8">
            
            {/* Left Main Column (Chart + News) */}
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
            
            {/* Right Sidebar Column */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              
              <MarketAISummary type="daily-brief" />
              
              <BreakingNewsTimeline onAnalyze={setSelectedArticle} />
              
              <EconomicCalendar />

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
