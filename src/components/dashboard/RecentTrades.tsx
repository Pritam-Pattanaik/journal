import React from 'react';
import { Link } from 'react-router-dom';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { ArrowRight } from 'lucide-react';

interface RecentTradesProps {
  trades: Trade[];
}

export default React.memo(function RecentTrades({ trades }: RecentTradesProps) {
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full">

      <div className="flex-1 overflow-hidden">
        {recentTrades.length === 0 ? (
          <div className="flex items-center justify-center min-h-[160px] text-sm text-tertiary">
            No recent trades recorded
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTrades.map((trade) => {
              const isProfit = trade.netPnl >= 0;
              return (
                <div 
                  key={trade.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-1 border border-border-subtle hover:border-border hover:bg-surface-2 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col text-center shrink-0 w-8">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{formatDate(trade.date).split(' ')[0]}</span>
                      <span className="text-xs font-semibold text-secondary">{formatDate(trade.date).split(' ')[1]}</span>
                    </div>
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-semibold text-primary truncate group-hover:text-accent transition-colors">
                        {trade.symbol}
                      </p>
                      <div className="flex items-center mt-0.5">
                        <Badge variant="primary" className="text-[9px] py-0 px-1.5 h-4">{trade.market}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "shrink-0 font-display text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg",
                    isProfit ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
                  )}>
                    {isProfit ? '+' : ''}{formatCurrency(trade.netPnl)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <Link
          to="/app/trades"
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-secondary hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-iris rounded-lg"
        >
          View All Trades
          <ArrowRight size={12} strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
});
