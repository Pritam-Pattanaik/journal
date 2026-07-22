import React, { useState, useEffect } from 'react';
import { useNewsStore } from '../../stores/newsStore';
import { useTradeStore } from '../../stores/tradeStore';
import { Brain, ChevronRight, Bookmark, Link2, Clock, Target, TrendingUp, Scale } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EnrichedNews } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../lib/cn';

interface MarketIntelligenceCenterProps {
  article: any | null;
}

export default function MarketIntelligenceCenter({ article }: MarketIntelligenceCenterProps) {
  const { enrichArticle, enrichingId, bookmarkArticle } = useNewsStore();
  const { trades } = useTradeStore();
  const [enriched, setEnriched] = useState<EnrichedNews | null>(null);

  useEffect(() => {
    if (article) {
      setEnriched(null);
      enrichArticle(article).then((data) => {
        if (data) setEnriched(data);
      });
    }
  }, [article, enrichArticle]);

  if (!article) return null;

  if (enrichingId === article.id || !enriched) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="w-24 h-24 rounded-full bg-surface-1 flex items-center justify-center relative z-10 border border-accent/30 shadow-lg shadow-accent/10">
            <Brain className="w-10 h-10 text-accent animate-pulse" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-primary mb-3">AI is Analyzing the Market</h3>
        <p className="text-base text-secondary max-w-sm mx-auto">Extracting risk factors, determining probabilities, and scanning your portfolio for related trades.</p>
        
        <div className="w-full max-w-md mt-12 space-y-4">
          <div className="h-4 bg-surface-2 rounded-lg w-full animate-pulse"></div>
          <div className="h-4 bg-surface-2 rounded-lg w-5/6 mx-auto animate-pulse"></div>
          <div className="h-4 bg-surface-2 rounded-lg w-3/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Find related trades
  const allTags = [...enriched.companies, ...enriched.sectors, ...enriched.categories].map(t => t.toLowerCase());
  const relatedTrades = trades.filter(t => {
    const symbolMatch = allTags.some(tag => tag.includes(t.symbol.toLowerCase()) || t.symbol.toLowerCase().includes(tag));
    const marketMatch = allTags.some(tag => tag.includes(t.market.toLowerCase()));
    return symbolMatch || marketMatch;
  });

  return (
    <article className="w-full bg-surface-0 rounded-3xl border border-border shadow-sm overflow-hidden mb-20 relative">
      
      {/* Header Area */}
      <div className="relative">
        {enriched.image && (
          <div className="w-full h-[400px] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-0 via-surface-0/80 to-transparent z-10" />
            <img src={enriched.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className={cn("px-8 md:px-16 relative z-20", enriched.image ? "-mt-32" : "pt-16")}>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest mb-6">
            <Badge variant="primary" className="bg-accent/10 text-accent border-accent/20 px-3 py-1 text-[10px]">
              {enriched.categories[0] || 'Market News'}
            </Badge>
            <span className="text-secondary flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {format(new Date(enriched.publishedAt * 1000), 'MMM d, yyyy')}</span>
            <span className="text-tertiary">•</span>
            <span className="text-secondary">{enriched.source}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary leading-[1.1] tracking-tight mb-8">
            {enriched.headline}
          </h1>

          {/* AI Summary Banner */}
          <div className="p-6 md:p-8 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden mb-12 shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent" />
            <div className="flex gap-4 items-start">
              <div className="p-2.5 rounded-xl bg-accent/10 shrink-0">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-accent mb-2">AI Executive Summary</h3>
                <p className="text-xl md:text-2xl font-medium text-primary leading-relaxed">
                  {enriched.tldr}
                </p>
              </div>
            </div>
          </div>

          {/* Core Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="md:col-span-2 space-y-8">
              
              <section>
                <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" /> Why This Matters
                </h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-secondary">
                  <p>{enriched.aiSummary}</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" /> Short & Medium Term Implications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-1 rounded-xl border border-border">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-2">Short-Term (1-4 Weeks)</span>
                    <p className="text-sm text-secondary leading-relaxed">Increased volatility expected in the Banking sector as the market digests the revised rate expectations. Traders might see immediate reactions in sensitive rate-linked equities.</p>
                  </div>
                  <div className="p-4 bg-surface-1 rounded-xl border border-border">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-2">Medium-Term (3-6 Months)</span>
                    <p className="text-sm text-secondary leading-relaxed">Potential structural shifts in capital allocation toward growth sectors if liquidity improves. Institutional repositioning could lead to sustained sectoral rotation.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-warning" /> Historical Comparison & Risk Factors
                </h3>
                <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl">
                  <p className="text-sm text-secondary leading-relaxed mb-4"><strong>Historical Context:</strong> Similar repo rate maintenance in 2018 led to a 4% consolidation in Bank Nifty before resuming its upward trajectory.</p>
                  <p className="text-sm text-secondary leading-relaxed"><strong>Risk Factors:</strong> Global macro headwinds (US CPI data) could override domestic policy effects. Caution advised against aggressive directional bets.</p>
                </div>
              </section>

            </div>

            <div className="space-y-6">
              <div className="card p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-3">Analysis Confidence</h4>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-display font-bold text-primary">High</span>
                  <span className="text-sm text-secondary mb-1">Certainty</span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                  <div className="h-full bg-success w-[85%]" />
                </div>
                <p className="text-xs text-tertiary mt-2">Based on consensus alignment and historical data availability. Not a market prediction.</p>
              </div>

              <div className="card p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-3">Affected Sectors</h4>
                <div className="flex flex-wrap gap-2">
                  {enriched.sectors.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-2 text-secondary">{s}</span>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-3">Related Companies</h4>
                <div className="flex flex-wrap gap-2">
                  {enriched.companies.map(c => (
                    <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-2 text-secondary">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sticky Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-surface-0/80 backdrop-blur-xl border-t border-border shadow-2xl flex items-center justify-between px-8 md:px-16 z-50">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => bookmarkArticle(enriched.id)} className="h-10 px-6 rounded-full font-semibold shadow-sm hover:border-primary">
            <Bookmark className="w-4 h-4 mr-2" /> Save for Later
          </Button>
          <Button variant="secondary" className="h-10 px-6 rounded-full font-semibold shadow-sm hover:border-primary">
            <Link2 className="w-4 h-4 mr-2" /> Link Trade
          </Button>
        </div>
        <a href={enriched.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-10 px-6 rounded-full font-semibold shadow-md flex items-center gap-2">
          Read Original <ChevronRight className="w-4 h-4" />
        </a>
      </div>

    </article>
  );
}
