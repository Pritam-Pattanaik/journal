import React, { useEffect } from 'react';
import { Plus, Target, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useStrategyStore } from '../stores/strategyStore';
import { formatCurrency, formatPercent } from '../lib/analytics';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { notify } from '../lib/notify';
import { cn } from '../lib/cn';

export default function Strategies() {
  const { strategies, fetchStrategies, loading } = useStrategyStore();

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const labelStyles = "text-[10px] font-bold text-tertiary uppercase tracking-widest block mb-1";

  return (
    <div className="space-y-8 page-enter font-ui pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Strategy Vault
          </h2>
          <p className="text-sm text-secondary mt-1">
            Manage your setups, trading rules, and view individual strategy performance metrics.
          </p>
        </div>
        <Button
          variant="primary"
          className="h-10 px-4 font-semibold shadow-sm"
          onClick={() => notify.info('New Strategy setup is scheduled for Phase 2 implementation.')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Strategy
        </Button>
      </div>

      {loading && strategies.length === 0 ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : strategies.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center border-dashed border-black/20 dark:border-white/20">
          <Target className="w-12 h-12 text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-bold text-primary mb-2">No Strategies Found</h3>
          <p className="text-sm text-secondary max-w-md mx-auto">
            You haven't defined any trading strategies yet. Create your first strategy to start tracking edge and discipline.
          </p>
          <Button
            variant="primary"
            className="mt-6 font-semibold"
            onClick={() => notify.info('New Strategy setup is scheduled for Phase 2 implementation.')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Strategy
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {strategies.map((strat) => {
            const totalPnl = strat.totalPnl || 0;
            const isProfitable = totalPnl >= 0;
            const winRate = strat.winRate || 0;
            const tradeCount = strat.tradeCount || 0;
            const avgPnl = strat.avgPnl || 0;
            
            return (
              <div
                key={strat.id}
                className="glass-panel bg-surface-1 p-6 rounded-2xl flex flex-col justify-between min-h-[280px] group transition-all hover:-translate-y-1 hover:shadow-md border-black/5 dark:border-white/5"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-black/10 dark:border-white/10 pb-4 mb-4">
                  <div className="flex flex-col min-w-0 pr-4">
                    <span className="text-lg font-bold text-primary truncate tracking-tight group-hover:text-accent transition-colors">
                      {strat.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-bold text-secondary uppercase tracking-widest">
                        {strat.timeframe || 'Any Timeframe'}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                    isProfitable ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20"
                  )}>
                    {isProfitable ? 'Profitable' : 'Losing'}
                  </div>
                </div>

                {/* Description */}
                {strat.description ? (
                  <p className="text-sm text-tertiary leading-relaxed mb-6 line-clamp-2 h-10">
                    {strat.description}
                  </p>
                ) : (
                  <div className="h-10 mb-6" /> // spacer
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                  <div>
                    <span className={labelStyles}>Total Net P&L</span>
                    <span className={cn(
                      "font-mono text-lg font-bold tracking-tight",
                      isProfitable ? "text-success" : "text-danger"
                    )}>
                      {isProfitable ? '+' : ''}{formatCurrency(totalPnl)}
                    </span>
                  </div>

                  <div>
                    <span className={labelStyles}>Win Rate</span>
                    <span className="font-mono text-lg font-bold text-primary tracking-tight">
                      {formatPercent(winRate)}
                    </span>
                  </div>

                  <div>
                    <span className={labelStyles}>Total Trades</span>
                    <span className="font-mono text-lg font-bold text-primary tracking-tight">
                      {tradeCount}
                    </span>
                  </div>

                  <div>
                    <span className={labelStyles}>Avg P&L / Trade</span>
                    <span className={cn(
                      "font-mono text-lg font-bold tracking-tight",
                      avgPnl >= 0 ? "text-success" : "text-danger"
                    )}>
                      {avgPnl >= 0 ? '+' : ''}{formatCurrency(avgPnl)}
                    </span>
                  </div>
                </div>

                {/* Win Rate Progress Bar */}
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-danger">Losses {100 - winRate}%</span>
                    <span className="text-success">Wins {winRate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-danger/20 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-success transition-all duration-1000 ease-out"
                      style={{ width: `${winRate}%` }}
                    />
                    <div 
                      className="h-full bg-danger transition-all duration-1000 ease-out"
                      style={{ width: `${100 - winRate}%` }}
                    />
                  </div>
                </div>

                {/* Tags Footer */}
                {strat.market && strat.market.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-5 mt-5 border-t border-black/10 dark:border-white/10">
                    {strat.market.map((m) => (
                      <span key={m} className="px-2.5 py-1 rounded bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-bold text-tertiary uppercase tracking-widest">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
