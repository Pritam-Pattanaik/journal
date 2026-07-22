import React, { useEffect } from 'react';
import { useNewsStore } from '../../stores/newsStore';
import { Clock, Activity, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NewsFeed() {
  const { news, loadingNews, fetchNews } = useNewsStore();

  useEffect(() => {
    fetchNews('general');
  }, [fetchNews]);

  if (loadingNews) return <div className="card p-6 flex justify-center h-[300px] items-center"><Loader2 className="animate-spin text-tertiary" /></div>;

  if (!news || news.length === 0) return (
    <div className="card p-6 h-[300px] flex flex-col items-center justify-center text-center">
      <Activity className="w-8 h-8 text-tertiary mb-3 opacity-50" />
      <p className="text-sm font-medium text-secondary">No Market News Available</p>
      <p className="text-xs text-tertiary mt-1">Unable to fetch the latest updates.</p>
    </div>
  );

  return (
    <div className="card p-6 max-h-[400px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 text-secondary">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest">Market News</h3>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-border">
        {news.slice(0, 10).map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group bg-surface-1 p-3 rounded-lg border border-border-subtle hover:border-accent/30 transition-all"
          >
            <div className="flex gap-3">
              {item.image && (
                <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-surface-2 border border-border">
                  <img src={item.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              <div className="flex flex-col justify-between">
                <h4 className="text-xs font-semibold text-primary line-clamp-2 group-hover:text-accent transition-colors leading-relaxed">
                  {item.headline}
                </h4>
                <div className="flex items-center gap-2 mt-2 text-[9px] text-tertiary font-bold uppercase tracking-widest">
                  <span className="text-secondary truncate max-w-[80px]">{item.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.publishedAt * 1000), 'MMM d')}
                  </span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
