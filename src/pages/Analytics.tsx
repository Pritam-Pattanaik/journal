import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { useTradeStore } from '../stores/tradeStore';
import { ExpectancyClient } from '../lib/expectancyClient';
import type { ExpectancyMetrics } from '../workers/expectancyWorker';
import { Activity, AlertCircle, Clock, ShieldAlert, TrendingDown, Cpu, Sparkles } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/analytics';
import { AsyncStateBoundary } from '../components/ui/AsyncStateBoundary';

export default function Analytics() {
  const { mistakes, session, risk, loading, fetchAnalytics } = useAnalyticsStore();
  const { trades, fetchTrades } = useTradeStore();
  const [workerMetrics, setWorkerMetrics] = useState<ExpectancyMetrics | null>(null);

  useEffect(() => {
    fetchAnalytics();
    if (trades.length === 0) fetchTrades();
  }, [fetchAnalytics, fetchTrades, trades.length]);

  // Execute high-speed background Web Worker quantitative calculations
  useEffect(() => {
    let isMounted = true;
    if (trades && trades.length > 0) {
      ExpectancyClient.analyze(trades).then((res) => {
        if (isMounted) setWorkerMetrics(res);
      });
    }
    return () => { isMounted = false; };
  }, [trades]);

  if (loading) return <div className="flex justify-center items-center h-full min-h-[400px]"><Activity className="animate-spin text-primary w-6 h-6" /></div>;

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <AsyncStateBoundary isLoading={loading}>
      <div className="flex flex-col gap-6 w-full pb-20 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-display font-bold text-primary tracking-tight">Analytics Deep Dive</h1>
            <p className="text-secondary mt-1">Detailed mathematical breakdown of your trading performance.</p>
          </div>
          {workerMetrics && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-1 border border-border text-xs font-semibold text-iris shadow-2xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>Web Worker 1,000x Monte Carlo Active</span>
            </div>
          )}
        </div>

        {/* ── Core Expectancy Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 bg-surface border border-border rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Expectancy</span>
            </div>
            <p className="text-2xl font-bold font-mono text-primary">
              {workerMetrics ? formatCurrency(workerMetrics.expectancyDollar) : (risk?.expectancy ? formatCurrency(risk.expectancy) : '$0.00')}
            </p>
          </div>

          <div className="p-5 bg-surface border border-border rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Profit Factor</span>
            </div>
            <p className="text-2xl font-bold font-mono text-primary">
              {workerMetrics ? workerMetrics.profitFactor.toFixed(2) : (risk?.profitFactor ? risk.profitFactor.toFixed(2) : '0.00')}
            </p>
          </div>

          <div className="p-5 bg-surface border border-border rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Avg Win / Loss</span>
            </div>
            <p className="text-2xl font-bold font-mono">
              <span className="text-success">{formatCurrency(risk?.avgWin || 0)}</span>
              <span className="text-tertiary text-lg font-sans mx-1">/</span>
              <span className="text-danger">{formatCurrency(risk?.avgLoss || 0)}</span>
            </p>
          </div>

          <div className="p-5 bg-surface border border-border rounded-xl shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-tertiary">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Win Rate</span>
            </div>
            <p className="text-2xl font-bold font-mono text-primary">
              {workerMetrics ? formatPercent(workerMetrics.winRate) : formatPercent(risk?.winRate || 0)}
            </p>
          </div>
        </div>

        {/* ── Monte Carlo & Drawdown Risk Vault Card ── */}
        {workerMetrics && (
          <div className="p-6 bg-surface-1 border border-border rounded-2xl shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning uppercase tracking-wider">
                <TrendingDown className="w-4 h-4" />
                <span>95th Percentile Monte Carlo Drawdown Simulation</span>
              </div>
              <h3 className="text-xl font-display font-bold text-primary">
                Max Probable Drawdown Barrier: <span className="font-mono text-danger font-extrabold">{formatCurrency(workerMetrics.monteCarlo95thDrawdown)}</span>
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                Calculated across 500 stochastic permutations of your recorded trade outcome history via dedicated multi-threaded Web Workers. Ensure prop equity buffer stays comfortably above this threshold.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-surface-0 rounded-xl border border-border min-w-[180px] text-center">
              <span className="text-xs font-semibold text-tertiary uppercase mb-1">R-Multiple Expectancy</span>
              <span className="text-2xl font-mono font-bold text-success">
                +{workerMetrics.expectancyR.toFixed(2)}R
              </span>
              <span className="text-[10px] font-medium text-secondary mt-1">Per Execution Avg</span>
            </div>
          </div>
        )}

        {/* ── Mistake Analysis & Day Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs">
            <h2 className="text-lg font-bold font-ui text-primary mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-iris" />
              <span>Mistake Attribution Analysis</span>
            </h2>
            {mistakes?.length === 0 ? (
              <p className="text-tertiary text-sm">No mistakes recorded in current evaluation sample.</p>
            ) : (
              <div className="space-y-3">
                {mistakes?.map((m: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-surface-1 rounded-lg border border-border-subtle hover:border-border transition-colors">
                    <div>
                      <p className="font-bold text-sm text-primary">{m.mistake}</p>
                      <p className="text-xs text-tertiary font-medium mt-0.5">{m.count} occurrences</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-0.5">PnL Impact</p>
                      <p className="font-mono text-sm text-danger font-bold">{formatCurrency(m.pnlImpact)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs">
            <h2 className="text-lg font-bold font-ui text-primary mb-4">Performance by Day</h2>
            {session?.byWeekday ? (
              <div className="space-y-3">
                {Object.keys(session.byWeekday).map((dayStr) => {
                  const day = parseInt(dayStr);
                  const data = session.byWeekday[day];
                  return (
                    <div key={day} className="flex items-center justify-between p-3.5 bg-surface-1 rounded-lg border border-border-subtle hover:border-border transition-colors">
                      <span className="font-bold text-sm text-primary">{weekdays[day]}</span>
                      <div className="text-right flex items-center">
                        <span className="text-xs font-medium text-tertiary mr-4">{data.count} trades</span>
                        <span className={`font-mono text-sm font-bold ${data.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                          {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-tertiary text-sm">No session data available for selected period.</p>
            )}
          </div>
        </div>
      </div>
    </AsyncStateBoundary>
  );
}
