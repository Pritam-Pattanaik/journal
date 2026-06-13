import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useStrategyStore } from '../stores/strategyStore';
import { formatCurrency, formatPercent } from '../lib/analytics';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function Strategies() {
  const { strategies, fetchStrategies, loading } = useStrategyStore();

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  return (
    <div className="space-y-4 page-enter font-ui">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-tv-lg font-bold text-primary">
            Strategies
          </h2>
          <p className="text-tv-sm text-secondary">
            Manage your setups, trading rules, and view individual strategy performance metrics.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-[14px] w-[14px]" />}
          onClick={() => alert('New Strategy setup is scheduled for Phase 2 implementation.')}
        >
          New Strategy
        </Button>
      </div>

      {loading && strategies.length === 0 ? (
        <div className="text-secondary text-sm">Loading strategies...</div>
      ) : strategies.length === 0 ? (
        <div className="text-secondary text-sm">No strategies found. Click New Strategy to add one.</div>
      ) : null}

      {/* Grid List */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[14px]">
        {strategies.map((strat) => {
          // Fallbacks for UI if backend returns null
          const totalPnl = strat.totalPnl || 0;
          const isProfitable = totalPnl >= 0;
          const winRate = strat.winRate || 0;
          const tradeCount = strat.tradeCount || 0;
          const avgPnl = strat.avgPnl || 0;
          
          return (
            <div
              key={strat.id}
              className="card flex flex-col justify-between min-h-[200px]"
            >
              {/* Header: Name and Status Badge */}
              <div className="flex items-start justify-between border-b border-tv-border pb-2.5">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-tv-md font-semibold text-primary truncate">
                    {strat.name}
                  </span>
                  <span className="text-tv-xs text-muted truncate mt-0.5 capitalize">
                    Timeframe: {strat.timeframe || 'N/A'}
                  </span>
                </div>
                <Badge variant={isProfitable ? 'win' : 'loss'}>
                  {isProfitable ? 'Profitable' : 'Losing'}
                </Badge>
              </div>

              {/* Description */}
              {strat.description && (
                <p className="text-tv-sm text-secondary leading-relaxed my-3 line-clamp-2">
                  {strat.description}
                </p>
              )}

              {/* Stats Grid (2x2) */}
              <div className="grid grid-cols-2 gap-3 my-3">
                <div>
                  <span className="label-section block mb-0.5">Total P&L</span>
                  <span className={`font-mono text-tv-md font-semibold ${isProfitable ? 'text-profit' : 'text-loss'}`}>
                    {isProfitable ? '+' : ''}
                    {formatCurrency(totalPnl)}
                  </span>
                </div>

                <div>
                  <span className="label-section block mb-0.5">Win Rate</span>
                  <span className="font-mono text-tv-md font-semibold text-accent-light">
                    {formatPercent(winRate)}
                  </span>
                </div>

                <div>
                  <span className="label-section block mb-0.5">Trades</span>
                  <span className="font-mono text-tv-md font-semibold text-primary">
                    {tradeCount}
                  </span>
                </div>

                <div>
                  <span className="label-section block mb-0.5">Avg P&L</span>
                  <span className={`font-mono text-tv-md font-semibold ${avgPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {avgPnl >= 0 ? '+' : ''}
                    {formatCurrency(avgPnl)}
                  </span>
                </div>
              </div>

              {/* Win Rate Progress Bar */}
              <div className="space-y-1.5 mt-2">
                <div className="h-1 w-full bg-loss/30 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-profit rounded-full"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted uppercase tracking-wider">
                  <span>Losses ({100 - winRate}%)</span>
                  <span>Wins ({winRate}%)</span>
                </div>
              </div>

              {/* Market Badges / Tags */}
              <div className="flex flex-wrap gap-1.5 pt-3 mt-auto border-t border-tv-border">
                {strat.market?.map((m) => (
                  <Badge key={m} variant="accent">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
