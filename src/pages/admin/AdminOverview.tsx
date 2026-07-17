import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Link, Brain, ArrowUpRight, ArrowDownRight, Activity, Clock } from 'lucide-react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../lib/api';
import AnimatedNumber from '../../components/admin/AnimatedNumber';
import { SkeletonCard, SkeletonChart } from '../../components/admin/SkeletonLoader';

interface Stats {
  totalUsers: number;
  totalTrades: number;
  totalPnl: number;
  activeBrokers: number;
  aiInsights: number;
  userGrowth: number;
  tradeGrowth: number;
}

interface ChartData {
  userSignups: { date: string; count: number }[];
  tradeVolume: { date: string; count: number; pnl: number }[];
}

interface ActivityItem {
  type: string;
  description: string;
  timestamp: string;
  userId: string;
  userName: string;
}

const kpiConfig = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, prefix: '', suffix: '', decimals: 0, color: 'text-info', bg: 'bg-info/10', growthKey: 'userGrowth' },
  { key: 'totalTrades', label: 'Total Trades', icon: TrendingUp, prefix: '', suffix: '', decimals: 0, color: 'text-purple-500', bg: 'bg-purple-500/10', growthKey: 'tradeGrowth' },
  { key: 'totalPnl', label: 'Net P&L', icon: DollarSign, prefix: '₹', suffix: '', decimals: 2, color: 'text-success', bg: 'bg-success/10', growthKey: null },
  { key: 'activeBrokers', label: 'Active Brokers', icon: Link, prefix: '', suffix: '', decimals: 0, color: 'text-warning', bg: 'bg-warning/10', growthKey: null },
  { key: 'aiInsights', label: 'AI Insights', icon: Brain, prefix: '', suffix: '', decimals: 0, color: 'text-indigo-500', bg: 'bg-indigo-500/10', growthKey: null },
];

const periods = ['daily', 'weekly', 'monthly'] as const;

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [statsData, activityData] = await Promise.all([
          api.get<Stats>('/admin/stats'),
          api.get<{ activities: ActivityItem[] }>('/admin/stats/activity'),
        ]);
        setStats(statsData);
        setActivities(activityData.activities || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setChartLoading(true);
        const data = await api.get<ChartData>(`/admin/stats/charts?period=${period}`);
        setChartData(data);
      } catch (err: any) {
        console.error('Failed to fetch chart data:', err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchCharts();
  }, [period]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup': return <Users className="w-4 h-4 text-info" />;
      case 'trade': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'ai_insight': return <Brain className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-text-secondary" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard Overview</h1>
          <p className="text-text-secondary text-sm mt-1">Platform analytics and key metrics</p>
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpiConfig.map((kpi) => {
            const Icon = kpi.icon;
            const val = (stats as any)[kpi.key] || 0;
            const growth = kpi.growthKey ? (stats as any)[kpi.growthKey] : null;
            return (
              <div key={kpi.key} className="bg-surface rounded-xl border border-border-color p-6 hover:border-brand-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-text-secondary text-sm font-medium">{kpi.label}</span>
                  <div className={`${kpi.bg} ${kpi.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-text-primary">
                  <AnimatedNumber value={val} prefix={kpi.prefix} suffix={kpi.suffix} decimals={kpi.decimals} />
                </div>
                {growth !== null && (
                  <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${growth >= 0 ? 'text-success' : 'text-danger'}`}>
                    {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.abs(growth)}% from last period</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Period Selector + Charts */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-text-secondary text-sm mr-2">Period:</span>
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-brand-500 text-white'
                : 'bg-surface border border-border-color text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups Chart */}
        {chartLoading ? <SkeletonChart /> : (
          <div className="bg-surface rounded-xl border border-border-color p-6">
            <h3 className="text-text-primary font-semibold mb-4">User Signups</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData?.userSignups || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', color: '#fff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trade Volume Chart */}
        {chartLoading ? <SkeletonChart /> : (
          <div className="bg-surface rounded-xl border border-border-color p-6">
            <h3 className="text-text-primary font-semibold mb-4">Trade Volume</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.tradeVolume || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', color: '#fff' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-xl border border-border-color p-6">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-500" />
          Recent Activity
        </h3>
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-surface-hover rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-hover rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-surface-hover rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    <span className="text-text-secondary">{activity.description}</span>
                  </p>
                  <p className="text-text-secondary text-xs mt-0.5">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
