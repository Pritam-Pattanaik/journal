import React, { useEffect } from 'react';
import { useAnalyticsStore } from '../stores/analyticsStore';
import { Activity, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/analytics';

export default function Analytics() {
  const { mistakes, session, risk, loading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) return <div className="flex justify-center items-center h-full"><Activity className="animate-spin text-primary" /></div>;

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex flex-col gap-6 w-full pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight">Analytics Deep Dive</h1>
          <p className="text-secondary mt-1">Detailed breakdown of your trading performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-tertiary">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Expectancy</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {risk?.expectancy ? formatCurrency(risk.expectancy) : '$0.00'}
          </p>
        </div>
        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-tertiary">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Profit Factor</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {risk?.profitFactor ? risk.profitFactor.toFixed(2) : '0.00'}
          </p>
        </div>
        <div className="p-5 bg-surface border border-border rounded-xl">
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
        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-tertiary">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Win Rate</span>
          </div>
          <p className="text-2xl font-bold font-mono">
            {formatPercent(risk?.winRate || 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold font-ui mb-4">Mistake Analysis</h2>
          {mistakes?.length === 0 ? (
            <p className="text-tertiary text-sm">No mistakes recorded.</p>
          ) : (
            <div className="space-y-4">
              {mistakes?.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-1 rounded-lg border border-border-subtle">
                  <div>
                    <p className="font-bold text-primary">{m.mistake}</p>
                    <p className="text-xs text-tertiary">{m.count} occurrences</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-tertiary font-bold uppercase tracking-widest mb-0.5">PnL Impact</p>
                    <p className="font-mono text-danger font-bold">{formatCurrency(m.pnlImpact)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold font-ui mb-4">Performance by Day</h2>
          {session?.byWeekday ? (
            <div className="space-y-3">
              {Object.keys(session.byWeekday).map((dayStr) => {
                const day = parseInt(dayStr);
                const data = session.byWeekday[day];
                return (
                  <div key={day} className="flex items-center justify-between p-3 bg-surface-1 rounded-lg border border-border-subtle">
                    <span className="font-bold text-primary">{weekdays[day]}</span>
                    <div className="text-right">
                      <span className="text-xs text-tertiary mr-3">{data.count} trades</span>
                      <span className={`font-mono font-bold ${data.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-tertiary text-sm">No session data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
