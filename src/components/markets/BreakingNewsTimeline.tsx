import React from 'react';
import { Clock, ExternalLink, Bookmark, Brain, Flame } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

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

const NEWS_MOCK: NewsItem[] = [
  { id: '1', title: 'RBI maintains status quo on repo rate, changes stance to neutral', source: 'Reuters', time: '10:00 AM', impact: 'high', sector: 'Banking', category: 'RBI', readTime: '3 min' },
  { id: '2', title: 'TCS Q1 results exceed street estimates, declares ₹10 dividend', source: 'Bloomberg', time: '09:15 AM', impact: 'high', sector: 'IT', category: 'Results', readTime: '5 min' },
  { id: '3', title: 'Crude oil prices surge 2% amid Middle East tensions', source: 'Financial Times', time: '08:30 AM', impact: 'medium', sector: 'Energy', category: 'Commodities', readTime: '2 min' },
  { id: '4', title: 'Auto sales show marginal decline in June due to monsoon delays', source: 'Economic Times', time: 'Yesterday', impact: 'low', sector: 'Auto', category: 'Economy', readTime: '4 min' },
];

interface BreakingNewsTimelineProps {
  onAnalyze: (item: NewsItem) => void;
}

export default function BreakingNewsTimeline({ onAnalyze }: BreakingNewsTimelineProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-danger" />
          <h3 className="font-display font-bold text-primary">Breaking News</h3>
        </div>
        <div className="flex gap-2">
          <Badge variant="default" className="text-[10px] cursor-pointer hover:bg-surface-2 transition-colors">All</Badge>
          <Badge variant="default" className="text-[10px] cursor-pointer hover:bg-surface-2 transition-colors">RBI</Badge>
          <Badge variant="default" className="text-[10px] cursor-pointer hover:bg-surface-2 transition-colors">Results</Badge>
        </div>
      </div>

      <div className="relative border-l border-border ml-3 space-y-6 pb-4">
        {NEWS_MOCK.map((item, i) => (
          <div key={item.id} className="relative pl-6 group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-surface-0 ${item.impact === 'high' ? 'bg-danger' : item.impact === 'medium' ? 'bg-warning' : 'bg-success'} shadow-sm`} />
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-tertiary">
                <span className="text-secondary">{item.time}</span>
                <span>•</span>
                <span>{item.source}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.readTime}</span>
              </div>
              
              <h4 className="text-[15px] font-bold text-primary leading-tight group-hover:text-accent transition-colors cursor-pointer" onClick={() => onAnalyze(item)}>
                {item.title}
              </h4>
              
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-2 text-secondary">{item.sector}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-2 text-secondary">{item.category}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" className="h-7 text-[11px] gap-1.5" onClick={() => onAnalyze(item)}>
                  <Brain className="w-3.5 h-3.5 text-accent" /> AI Summary
                </Button>
                <button className="p-1.5 text-tertiary hover:text-secondary hover:bg-surface-2 rounded-md transition-colors" title="Bookmark">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-tertiary hover:text-secondary hover:bg-surface-2 rounded-md transition-colors" title="Original Source">
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
