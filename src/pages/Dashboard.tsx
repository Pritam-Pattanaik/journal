import React, { useState, useMemo } from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { TrendingUp, Target, Scale, Shield, Flame, Zap, TrendingDown, ArrowUpRight, BarChart3, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTradeStore } from '../stores/tradeStore';
import {
  computeStats, computeCumulativePnl, computeStrategyPnl,
  computeDisciplineDistribution, computeCurrentStreak,
  formatCurrency, formatPercent,
} from '../lib/analytics';
import StatCard from '../components/dashboard/StatCard';
import RecentTrades from '../components/dashboard/RecentTrades';
import CalendarHeatmap from '../components/dashboard/CalendarHeatmap';
import GoalWidget from '../components/dashboard/GoalWidget';

// Lazy load Recharts components to chunk split them
const PnLCurve = React.lazy(() => import('../components/dashboard/PnLCurve'));
const DisciplinePie = React.lazy(() => import('../components/dashboard/DisciplinePie'));
const StrategyBar = React.lazy(() => import('../components/dashboard/StrategyBar'));
import { StaggerContainer, StaggerItem, NumberCounter } from '../components/ui/Motion';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';
import { getDisciplineInfo } from '../lib/disciplineUtils';

type DateFilter = 'week' | 'month' | 'last_month' | 'all';

const filterLabels: { key: DateFilter; label: string }[] = [
  { key: 'week',       label: 'Week' },
  { key: 'month',      label: 'Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'all',        label: 'All Time' },
];

export default function Dashboard() {
  const { trades, loading } = useTradeStore();
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');

  const filteredTrades = useMemo(() => {
    if (dateFilter === 'all') return trades;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return trades.filter(trade => {
      const d = trade.isCarryForward && trade.exitTime ? new Date(trade.exitTime) : new Date(trade.date);
      if (dateFilter === 'week') {
        const day = today.getDay();
        const start = new Date(today); start.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
        return d >= start;
      } else if (dateFilter === 'month') {
        return d >= new Date(today.getFullYear(), today.getMonth(), 1);
      } else if (dateFilter === 'last_month') {
        const f = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const l = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        return d >= f && d <= l;
      }
      return true;
    });
  }, [trades, dateFilter]);

  const stats = computeStats(filteredTrades);
  const pnlData = computeCumulativePnl(filteredTrades);
  const stratData = computeStrategyPnl(filteredTrades);
  const discData = computeDisciplineDistribution(filteredTrades);
  const streak = computeCurrentStreak(trades);

  const streakConfig = {
    WIN:  { text: `${streak.count} Win Streak`, icon: Flame, color: 'text-success', bg: 'bg-success/10 border-success/20' },
    LOSS: { text: `${streak.count} Loss Streak`, icon: TrendingDown, color: 'text-danger', bg: 'bg-danger/10 border-danger/20' },
    NONE: { text: 'No Active Streak', icon: Zap, color: 'text-secondary', bg: 'bg-surface-1 border-border' },
  }[streak.type] ?? { text: 'No Streak', icon: Zap, color: 'text-secondary', bg: 'bg-surface-1 border-border' };

  const StreakIcon = streakConfig.icon;

  // Today's Performance
  const todayTrades = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return trades.filter(t => new Date(t.isCarryForward && t.exitTime ? t.exitTime : t.date) >= startOfToday);
  }, [trades]);
  const todayStats = computeStats(todayTrades);

  if (!loading && trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-surface-1 border border-border flex items-center justify-center shadow-sm">
          <BarChart3 className="w-10 h-10 text-secondary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-primary tracking-tight">No Trades Yet</h2>
          <p className="text-secondary mt-2 leading-relaxed">
            Your dashboard is looking a bit empty. Log your first trade or connect a broker to start tracking your performance.
          </p>
        </div>
        <a href="/app/trades" aria-label="Go to Trades Page" className="px-6 py-3 bg-primary text-inverse font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
          Go to Trades
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-20">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-secondary font-medium">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {/* Streak badge moved next to date */}
              <div className={cn(
                'hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border',
                streakConfig.bg, streakConfig.color
              )}>
                <StreakIcon size={10} />
                {streakConfig.text}
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-surface-1 border border-border shadow-xs w-max">
          {filterLabels.map(({ key, label }) => {
            const active = dateFilter === key;
            return (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={cn(
                  'relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 outline-none whitespace-nowrap focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none',
                  active ? 'text-white' : 'text-secondary hover:text-primary'
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={`Filter by ${label}`}
              >
                {active && (
                  <motion.div
                    layoutId="dashFilterTab"
                    className="absolute inset-0 bg-iris rounded-lg shadow-sm"
                    transition={{ duration: 0.15, ease: 'easeInOut' }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Today's Performance (Subtle Banner) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-tertiary" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-tertiary">Today</p>
          </div>
          <div className="w-px h-3 bg-border" />
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : todayTrades.length > 0 ? (
            <div className="flex items-center gap-3">
              <span className={cn('font-mono text-sm font-bold', todayStats.totalPnl >= 0 ? 'text-success' : 'text-danger')}>
                {todayStats.totalPnl >= 0 ? '+' : ''}<NumberCounter value={todayStats.totalPnl} format={(v) => formatCurrency(v)} duration={1} />
              </span>
              <span className="text-border text-xs">•</span>
              <span className="text-secondary text-xs font-semibold"><NumberCounter value={todayTrades.length} duration={1} /> trades</span>
              <span className="text-border text-xs">•</span>
              <span className="text-secondary text-xs font-semibold"><NumberCounter value={todayStats.winRate} format={(v) => formatPercent(v)} duration={1} /> WR</span>
            </div>
          ) : (
            <p className="text-xs font-medium text-tertiary flex items-center gap-1.5">
              No trades today
            </p>
          )}
        </div>
      </motion.div>

      {/* ── 4 Stat Cards ── */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" staggerChildren={0.07}>
        <StaggerItem>
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <StatCard label="Net P&L" value={formatCurrency(stats.totalPnl)} subLabel="After charges"
              icon={TrendingUp} colorType="pnl" rawValue={stats.totalPnl} />
          )}
        </StaggerItem>
        <StaggerItem>
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <StatCard label="Win Rate" value={formatPercent(stats.winRate)} subLabel={`${stats.totalTrades} trades`}
              icon={Target} colorType="winrate" rawValue={stats.winRate} />
          )}
        </StaggerItem>
        <StaggerItem>
          {loading ? <Skeleton className="h-36 w-full" /> : (
            <StatCard label="Avg R:R" value={`1:${stats.avgRR.toFixed(2)}`} subLabel="Win/Loss ratio"
              icon={Scale} colorType="rr" rawValue={stats.avgRR} />
          )}
        </StaggerItem>
        <StaggerItem>
          {loading ? <Skeleton className="h-36 w-full" /> : (() => {
            const discInfo = getDisciplineInfo(Math.round(stats.avgDiscipline));
            const discLabel = discInfo ? discInfo.label : 'Unrated';
            return (
              <StatCard label="Discipline" value={`${stats.avgDiscipline.toFixed(1)}/5`} subLabel={discLabel}
                icon={Shield} colorType="discipline" rawValue={stats.avgDiscipline} />
            );
          })()}
        </StaggerItem>
      </StaggerContainer>

      {/* ── 75 / 25 Main Layout ── */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── Left 75% ── */}
        <div className="w-full xl:w-[75%] flex flex-col gap-6">

          {/* Equity Curve Card — EXPLICIT HEIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Equity Curve</p>
                <p className={cn('text-[22px] font-bold font-mono tabular-nums mt-1 leading-none tracking-tight',
                  stats.totalPnl >= 0 ? 'text-success' : 'text-danger')}>
                  {stats.totalPnl >= 0 ? '+' : ''}<NumberCounter value={stats.totalPnl} format={(v) => formatCurrency(v)} duration={1.2} />
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-iris bg-iris/8 border border-iris/15 px-2.5 py-1 rounded-lg">
                <ArrowUpRight size={10} />
                Cumulative P&L
              </div>
            </div>
            {/* CRITICAL: Explicit pixel height — NOT flex-1 */}
            <div className="h-[280px] w-full relative">
              <ErrorBoundary>
                <React.Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <PnLCurve data={pnlData} />
                </React.Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>

          {/* Strategy Performance — EXPLICIT HEIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Strategy Performance</p>
              <span className="text-[10px] font-bold text-secondary tabular-nums">{stratData.length} strategies</span>
            </div>
            {/* CRITICAL: Explicit pixel height */}
            <div className="h-[180px] w-full relative">
              <ErrorBoundary>
                <React.Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <StrategyBar data={stratData} />
                </React.Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>

          {/* Calendar Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            <ErrorBoundary>
              <CalendarHeatmap trades={trades} />
            </ErrorBoundary>
          </motion.div>
        </div>

        {/* ── Right 25% ── */}
        <div className="w-full xl:w-[25%] flex flex-col gap-6">

          {/* Discipline Pie — EXPLICIT HEIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-4">Discipline Profile</p>
            {/* CRITICAL: Explicit pixel height */}
            <div className="h-[220px] w-full relative">
              <ErrorBoundary>
                <React.Suspense fallback={<Skeleton className="w-full h-full" />}>
                  <DisciplinePie data={discData} />
                </React.Suspense>
              </ErrorBoundary>
            </div>
          </motion.div>

          {/* Recent Trades */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card p-6 flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Recent Execution</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-success select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-50"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                LIVE
              </div>
            </div>
            <ErrorBoundary>
              <RecentTrades trades={trades} />
            </ErrorBoundary>
          </motion.div>

          {/* Goals */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col h-full"
          >
            <ErrorBoundary>
              <GoalWidget />
            </ErrorBoundary>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
