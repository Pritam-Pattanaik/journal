import React, { useEffect, useState } from 'react';
import { Plus, Target,    Loader2 } from 'lucide-react';
import { useStrategyStore } from '../stores/strategyStore';
import { formatCurrency, formatPercent } from '../lib/analytics';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/cn';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem, NumberCounter } from '../components/ui/Motion';
import { StrategyFormModal } from '../components/trade/StrategyFormModal';

export default function Strategies() {
  const { strategies, fetchStrategies, loading } = useStrategyStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-primary tracking-tight">Strategy Vault</h1>
          <p className="text-xs text-tertiary mt-1">Track your setups, rules, and performance by strategy.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          className="w-max"
        >
          <Plus size={14} /> New Strategy
        </Button>
      </motion.div>

      {loading && strategies.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-iris" />
        </div>
      ) : strategies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="card p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-iris/10 border border-iris/20 flex items-center justify-center mx-auto mb-5">
            <Target className="w-7 h-7 text-iris" strokeWidth={1.8} />
          </div>
          <h3 className="font-display text-xl font-bold text-primary mb-2">No Strategies Defined</h3>
          <p className="text-sm text-secondary max-w-md mx-auto mb-6 leading-relaxed">
            Create your first strategy to start tracking edge per setup. The AI Coach uses these to score your discipline.
          </p>
          <Button onClick={() => setModalOpen(true)} className="mx-auto">
            <Plus size={14} /> Create First Strategy
          </Button>
        </motion.div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" staggerChildren={0.07}>
          {strategies.map((strat) => {
            const totalPnl = strat.totalPnl || 0;
            const isProfitable = totalPnl >= 0;
            const winRate = strat.winRate || 0;
            const tradeCount = strat.tradeCount || 0;
            const avgPnl = strat.avgPnl || 0;

            return (
              <StaggerItem key={strat.id}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="card-raised p-6 flex flex-col justify-between min-h-[260px] cursor-default group relative overflow-hidden"
                >
                  {/* Top stripe */}
                  <div className={cn('absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r', isProfitable ? 'from-success to-success/20' : 'from-danger to-danger/20')} />

                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
                    <div className="min-w-0 pr-4">
                      <span className="font-display text-base font-bold text-primary truncate tracking-tight block group-hover:text-iris transition-colors duration-200">
                        {strat.name}
                      </span>
                      {strat.timeframe && (
                        <span className="mt-1 inline-block px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-[10px] font-bold text-tertiary uppercase tracking-widest">
                          {strat.timeframe}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                      isProfitable ? "bg-success/8 text-success border-success/20" : "bg-danger/8 text-danger border-danger/20"
                    )}>
                      {isProfitable ? 'Profitable' : 'Losing'}
                    </div>
                  </div>

                  {/* Description */}
                  {strat.description ? (
                    <p className="text-xs text-tertiary leading-relaxed mb-4 line-clamp-2">{strat.description}</p>
                  ) : (
                    <div className="mb-4 h-5" />
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Net P&L', value: <>{isProfitable ? '+' : ''}<NumberCounter value={totalPnl} format={(v) => formatCurrency(v)} duration={1} /></>, className: isProfitable ? 'text-success' : 'text-danger' },
                      { label: 'Win Rate', value: <NumberCounter value={winRate} format={(v) => formatPercent(v)} duration={1} />, className: 'text-iris' },
                      { label: 'Trades', value: <NumberCounter value={tradeCount} duration={1} />, className: 'text-primary' },
                      { label: 'Avg/Trade', value: <>{avgPnl >= 0 ? '+' : ''}<NumberCounter value={avgPnl} format={(v) => formatCurrency(v)} duration={1} /></>, className: avgPnl >= 0 ? 'text-success' : 'text-danger' },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted mb-0.5">{m.label}</p>
                        <p className={cn('text-sm font-bold font-mono tabular-nums', m.className)}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Win-rate bar */}
                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-danger">Loss {(100 - winRate).toFixed(0)}%</span>
                      <span className="text-success">Win {winRate.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-surface-2">
                      <div className="h-full bg-success/80 transition-all duration-1000 ease-out rounded-l-full" style={{ width: `${winRate}%` }} />
                      <div className="h-full bg-danger/80 transition-all duration-1000 ease-out rounded-r-full" style={{ width: `${100 - winRate}%` }} />
                    </div>
                  </div>

                  {/* Market tags */}
                  {strat.market && strat.market.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-4 mt-4 border-t border-border">
                      {strat.market.map(m => (
                        <span key={m} className="px-2 py-0.5 rounded-lg bg-surface-2 border border-border text-[9px] font-bold text-muted uppercase tracking-widest">{m}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
      
      <StrategyFormModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
