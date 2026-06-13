import React from 'react';
import {
  TrendingUp,
  Target,
  Scale,
  Shield
} from 'lucide-react';
import { useTradeStore } from '../stores/tradeStore';
import {
  computeStats,
  computeCumulativePnl,
  computeStrategyPnl,
  computeDisciplineDistribution,
  computeCurrentStreak,
  formatCurrencyFull,
  formatPercent
} from '../lib/analytics';
import StatCard from '../components/dashboard/StatCard';
import PnLCurve from '../components/dashboard/PnLCurve';
import DisciplinePie from '../components/dashboard/DisciplinePie';
import StrategyBar from '../components/dashboard/StrategyBar';
import RecentTrades from '../components/dashboard/RecentTrades';
import CalendarHeatmap from '../components/dashboard/CalendarHeatmap';

export default function Dashboard() {
  const { trades } = useTradeStore();
  const stats = computeStats(trades);
  const pnlCurveData = computeCumulativePnl(trades);
  const strategyPnlData = computeStrategyPnl(trades);
  const disciplineDistribution = computeDisciplineDistribution(trades);
  const streak = computeCurrentStreak(trades);

  return (
    <div className="space-y-5">
      {/* Date Range & Streak Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 stagger-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
           <button className="filter-pill active shrink-0">This Week</button>
           <button className="filter-pill shrink-0">This Month</button>
           <button className="filter-pill shrink-0">All Time</button>
        </div>
        <div className="text-tv-sm text-secondary font-mono bg-surface border border-tv-border px-3 py-1.5 rounded-tv-lg whitespace-nowrap">
           Current Streak:{' '}
           {streak.type === 'WIN' ? (
             <span className="text-profit font-bold">{streak.count} Winning Days</span>
           ) : streak.type === 'LOSS' ? (
             <span className="text-loss font-bold">{streak.count} Losing Days</span>
           ) : (
             <span className="text-secondary font-bold">None</span>
           )}
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] stagger-2">
        <StatCard
          label="Net P&L"
          value={formatCurrencyFull(stats.totalPnl)}
          subLabel="After brokerage & charges"
          icon={TrendingUp}
          colorType="pnl"
          rawValue={stats.totalPnl}
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(stats.winRate)}
          subLabel={`From ${stats.totalTrades} total trades`}
          icon={Target}
          colorType="winrate"
          rawValue={stats.winRate}
        />
        <StatCard
          label="Avg R:R"
          value={`1:${stats.avgRR.toFixed(2)}`}
          subLabel="Average Win vs Avg Loss"
          icon={Scale}
          colorType="rr"
          rawValue={stats.avgRR}
        />
        <StatCard
          label="Avg Discipline"
          value={`${stats.avgDiscipline.toFixed(1)}/5.0`}
          subLabel="Based on rated trades"
          icon={Shield}
          colorType="discipline"
          rawValue={stats.avgDiscipline}
        />
      </div>

      {/* Row 2: Equity Curve & Discipline Pie */}
      <div className="flex flex-col lg:flex-row gap-[14px] stagger-3">
        <div className="lg:flex-[2] w-full">
          <PnLCurve data={pnlCurveData} />
        </div>
        <div className="lg:flex-[1] w-full">
          <DisciplinePie data={disciplineDistribution} />
        </div>
      </div>

      {/* Row 3: Strategy Bar & Recent Trades */}
      <div className="flex flex-col lg:flex-row gap-[14px] stagger-4">
        <div className="lg:flex-[1] w-full">
          <StrategyBar data={strategyPnlData} />
        </div>
        <div className="lg:flex-[1.2] w-full">
          <RecentTrades trades={trades} />
        </div>
      </div>

      {/* Row 4: Calendar Heatmap */}
      <div className="w-full stagger-5">
        <CalendarHeatmap trades={trades} />
      </div>
    </div>
  );
}
