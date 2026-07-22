import React, { useEffect } from 'react';
import { useNewsStore } from '../../stores/newsStore';
import { Clock, Globe, Loader2, Search, ArrowRight, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';

interface NewsListProps {
  onSelectArticle: (article: any) => void;
  selectedArticleId: string | null;
}

export default function NewsList({ onSelectArticle, selectedArticleId }: NewsListProps) {
  const { news, loadingNews, fetchNews } = useNewsStore();
  const [activeTab, setActiveTab] = React.useState<'today' | 'yesterday' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchNews('general');
  }, [fetchNews]);

  const filteredNews = React.useMemo(() => {
    if (!news) return [];
    const now = Date.now() / 1000;
    const day = 86400;
    
    return news.filter(item => {
      const diff = now - item.publishedAt;
      if (activeTab === 'today') return diff <= day;
      if (activeTab === 'yesterday') return diff > day && diff <= day * 2;
      if (activeTab === 'week') return diff <= day * 7;
      if (activeTab === 'month') return diff <= day * 30;
      return true;
    });
  }, [news, activeTab]);

  if (loadingNews) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-16 h-16 bg-surface-1 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-border">
        <Loader2 className="animate-spin text-accent w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-primary mb-2">Scanning Global Markets</h3>
      <p className="text-secondary">Fetching the latest high-impact news...</p>
    </div>
  );

  if (!news || news.length === 0) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 bg-surface-1 rounded-full flex items-center justify-center mb-6 shadow-sm border border-border">
        <Globe className="w-10 h-10 text-tertiary opacity-50" />
      </div>
      <h3 className="text-2xl font-bold text-primary mb-3">No Market News Found</h3>
      <p className="text-secondary max-w-md">We couldn't fetch the latest updates. Check your connection or try again later.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {(['today', 'yesterday', 'week', 'month'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 text-sm font-bold uppercase tracking-wider rounded-full transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-accent text-white shadow-md shadow-accent/20" 
                  : "text-tertiary hover:text-primary hover:bg-surface-2"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* News Grid */}
      {filteredNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-tertiary opacity-50 mb-4" />
          <p className="text-lg text-secondary font-medium">No news in this timeframe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onSelectArticle(item)}
              className="group cursor-pointer flex flex-col bg-surface-0 rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300 overflow-hidden relative"
            >
              {item.image ? (
                <div className="w-full h-48 overflow-hidden bg-surface-2 relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-0/80 to-transparent z-10" />
                  <img 
                    src={item.image} 
                    alt="" 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-500" 
                  />
                  {idx === 0 && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 bg-danger/90 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-sm backdrop-blur-sm">
                      <Zap className="w-3 h-3" /> Breaking
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 bg-surface-1 flex items-center justify-center relative">
                  <Globe className="w-12 h-12 text-tertiary opacity-20" />
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest mb-3">
                  <span className="text-accent">{item.source}</span>
                  <span className="text-tertiary">•</span>
                  <span className="flex items-center gap-1.5 text-secondary">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(item.publishedAt * 1000), 'MMM d, HH:mm')}
                  </span>
                </div>
                
                <h4 className="text-xl font-display font-bold text-primary leading-tight mb-4 group-hover:text-accent transition-colors line-clamp-3">
                  {item.headline}
                </h4>
                
                <div className="mt-auto pt-4 flex items-center justify-between text-sm text-tertiary border-t border-border/50 group-hover:border-accent/20 transition-colors">
                  <span className="font-medium group-hover:text-primary transition-colors">Read analysis</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform text-accent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
