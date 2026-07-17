import React, { useState, useMemo } from 'react';
import { TrendingUp, Target, Scale, Shield, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeStore } from '../stores/tradeStore';
import {
  computeStats,
  computeCumulativePnl,
  computeStrategyPnl,
  computeDisciplineDistribution,
  computeCurrentStreak,
  formatCurrency,
  formatPercent,
} from '../lib/analytics';
import StatCard from '../components/dashboard/StatCard';
import PnLCurve from '../components/dashboard/PnLCurve';
import DisciplinePie from '../components/dashboard/DisciplinePie';
import StrategyBar from '../components/dashboard/StrategyBar';
import RecentTrades from '../components/dashboard/RecentTrades';
import CalendarHeatmap from '../components/dashboard/CalendarHeatmap';
import { GlareCard } from '../components/ui/GlareCard';
import { cn } from '../lib/cn';

type DateFilter = 'week' | 'month' | 'last_month' | 'all';

const filterLabels: { key: DateFilter; label: string }[] = [
  { key: 'week',       label: 'This Week' },
  { key: 'month',      label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'all',        label: 'All Time' },
];

export default function Dashboard() {
  const { trades } = useTradeStore();
  const [dateFilter, setDateFilter] = useState<DateFilter>('week');

  const filteredTrades = useMemo(() => {
    if (dateFilter === 'all') return trades;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return trades.filter(trade => {
      const tradeDate = trade.isCarryForward && trade.exitTime ? new Date(trade.exitTime) : new Date(trade.date);
      if (dateFilter === 'week') {
        const firstDayOfWeek = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        firstDayOfWeek.setDate(diff);
        return tradeDate >= firstDayOfWeek;
      } else if (dateFilter === 'month') {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return tradeDate >= firstDayOfMonth;
      } else if (dateFilter === 'last_month') {
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return tradeDate >= firstDayOfLastMonth && tradeDate <= lastDayOfLastMonth;
      }
      return true;
    });
  }, [trades, dateFilter]);

  const stats                  = computeStats(filteredTrades);
  const pnlCurveData           = computeCumulativePnl(filteredTrades);
  const strategyPnlData        = computeStrategyPnl(filteredTrades);
  const disciplineDistribution = computeDisciplineDistribution(filteredTrades);
  const streak                 = computeCurrentStreak(trades);

  const streakColor =
    streak.type === 'WIN'  ? 'text-success' :
    streak.type === 'LOSS' ? 'text-danger' :
    'text-secondary';

  const streakLabel =
    streak.type === 'WIN'  ? `${streak.count} Win Streak` :
    streak.type === 'LOSS' ? `${streak.count} Loss Streak` :
    'No Active Streak';

  return (
    <div className="flex flex-col gap-6 w-full pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Animated Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-1 border border-black/10 dark:border-white/10 w-max shadow-sm">
          {filterLabels.map(({ key, label }) => {
            const isActive = dateFilter === key;
            return (
              <button
                key={key}
                onClick={() => setDateFilter(key)}
                className={cn(
                  "relative px-4 py-1.5 rounded-lg text-sm font-bold transition-colors outline-none",
                  isActive ? "text-canvas" : "text-secondary hover:text-primary"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterTab"
                    className="absolute inset-0 bg-primary rounded-lg"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimal Streak Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-1 border border-black/10 dark:border-white/10 shadow-sm">
          <Flame size={16} className={cn(streakColor, "opacity-80")} />
          <span className="text-sm font-bold text-primary tracking-tight">{streakLabel}</span>
        </div>
      </div>

      {/* Grid Layout (Bento Box) */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Row 1: Stat Cards */}
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Net P&L"
            value={formatCurrency(stats.totalPnl)}
            subLabel="After brokerage & charges"
            icon={TrendingUp}
            colorType="pnl"
            rawValue={stats.totalPnl}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Win Rate"
            value={formatPercent(stats.winRate)}
            subLabel={`From ${stats.totalTrades} total trades`}
            icon={Target}
            colorType="winrate"
            rawValue={stats.winRate}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Avg R:R"
            value={`1:${stats.avgRR.toFixed(2)}`}
            subLabel="Average Win vs Avg Loss"
            icon={Scale}
            colorType="rr"
            rawValue={stats.avgRR}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <StatCard
            label="Avg Discipline"
            value={`${stats.avgDiscipline.toFixed(1)}/5.0`}
            subLabel="Based on rated trades"
            icon={Shield}
            colorType="discipline"
            rawValue={stats.avgDiscipline}
          />
        </div>

        {/* Row 2: Equity Curve + Discipline Pie */}
        <div className="col-span-12 xl:col-span-8">
          <div className="h-full min-h-[380px] p-6 flex flex-col relative rounded-2xl glass-panel">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold tracking-widest text-secondary uppercase">Equity Curve</h3>
             </div>
             <PnLCurve data={pnlCurveData} />
          </div>
        </div>
        <div className="col-span-12 xl:col-span-4">
          <div className="h-full min-h-[380px] p-6 flex flex-col relative rounded-2xl glass-panel">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold tracking-widest text-secondary uppercase">Discipline Profile</h3>
            </div>
            <DisciplinePie data={disciplineDistribution} />
          </div>
        </div>

        {/* Row 3: Strategy Bar + Recent Trades */}
        <div className="col-span-12 xl:col-span-5">
          <div className="h-full min-h-[400px] p-6 flex flex-col relative rounded-2xl glass-panel">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold tracking-widest text-secondary uppercase">Strategy Performance</h3>
            </div>
            <StrategyBar data={strategyPnlData} />
          </div>
        </div>
        <div className="col-span-12 xl:col-span-7">
          <div className="h-full min-h-[400px] p-6 flex flex-col relative rounded-2xl glass-panel overflow-hidden">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold tracking-widest text-secondary uppercase">Recent Execution</h3>
            </div>
            <RecentTrades trades={trades} />
          </div>
        </div>

        {/* Row 4: Calendar Heatmap */}
        <div className="col-span-12">
          <div className="p-6 flex flex-col relative rounded-2xl glass-panel">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold tracking-widest text-secondary uppercase">Consistency Map</h3>
            </div>
            <CalendarHeatmap trades={trades} />
          </div>
        </div>
      </div>
    </div>
  );
}
