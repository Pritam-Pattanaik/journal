import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Search, Filter, ChevronLeft, ChevronRight, Target, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { api } from '../../lib/api';
import AnimatedNumber from '../../components/admin/AnimatedNumber';
import { SkeletonCard, SkeletonTable, SkeletonChart } from '../../components/admin/SkeletonLoader';

interface Trade {
  id: string;
  userId: string;
  userName: string;
  symbol: string;
  market: string;
  type: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  status: string;
  entryDate: string;
  exitDate: string;
}

interface TradeStats {
  totalTrades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

interface TradesResponse {
  trades: Trade[];
  total: number;
  stats: TradeStats;
}

const MARKETS = ['ALL', 'EQUITY', 'F&O', 'COMMODITY', 'CURRENCY', 'CRYPTO'];
const STATUSES = ['ALL', 'OPEN', 'CLOSED', 'CANCELLED'];
const PIE_COLORS = ['#6366f1', '#22c55e', '#ef4444', '#eab308', '#8b5cf6', '#ec4899'];

export default function AdminTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [market, setMarket] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const fetchTrades = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (debouncedSearch) params.set('userId', debouncedSearch);
      if (market !== 'ALL') params.set('market', market);
      if (status !== 'ALL') params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const data = await api.get<TradesResponse>(`/admin/trades?${params}`);
      setTrades(data.trades || []);
      setTotal(data.total || 0);
      setStats(data.stats || null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, market, status, startDate, endDate]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Market distribution for pie chart
  const marketDistribution = trades.reduce((acc: Record<string, number>, t) => {
    const m = t.market || 'Other';
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(marketDistribution).map(([name, value]) => ({ name, value }));

  const totalPages = Math.ceil(total / limit);

  const statCards = [
    { label: 'Total Trades', value: stats?.totalTrades || 0, prefix: '', suffix: '', decimals: 0, color: 'text-brand-500', icon: TrendingUp },
    { label: 'Win Rate', value: stats?.winRate || 0, prefix: '', suffix: '%', decimals: 1, color: 'text-green-500', icon: Target },
    { label: 'Avg P&L', value: stats?.avgPnl || 0, prefix: '₹', suffix: '', decimals: 2, color: (stats?.avgPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500', icon: BarChart3 },
    { label: 'Total P&L', value: stats?.totalPnl || 0, prefix: '₹', suffix: '', decimals: 2, color: (stats?.totalPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500', icon: TrendingUp },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-brand-500" />
          Trade Explorer
        </h1>
        <p className="text-text-secondary text-sm mt-1">Platform-wide trade analysis and monitoring</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">{error}</div>
      )}

      {/* Stat Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-surface rounded-xl border border-border-color p-6 hover:border-brand-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary text-sm font-medium">{card.label}</span>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div className={`text-2xl font-bold ${card.color}`}>
                  <AnimatedNumber value={card.value} prefix={card.prefix} suffix={card.suffix} decimals={card.decimals} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border-color p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by user ID..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-base border border-border-color rounded-lg text-text-primary text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-text-secondary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select value={market} onChange={(e) => { setMarket(e.target.value); setPage(1); }}
              className="bg-base border border-border-color text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500">
              {MARKETS.map((m) => <option key={m} value={m}>{m === 'ALL' ? 'All Markets' : m}</option>)}
            </select>
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-base border border-border-color text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="bg-base border border-border-color text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" />
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="bg-base border border-border-color text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Table */}
        <div className="lg:col-span-2">
          {loading ? (
            <SkeletonTable rows={10} cols={6} />
          ) : (
            <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Symbol</th>
                      <th className="px-4 py-3 font-medium">Market</th>
                      <th className="px-4 py-3 font-medium">Dir</th>
                      <th className="px-4 py-3 font-medium">Entry</th>
                      <th className="px-4 py-3 font-medium">Exit</th>
                      <th className="px-4 py-3 font-medium text-right">P&L</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {trades.map((t) => (
                      <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap text-xs">{new Date(t.entryDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-text-primary text-xs font-medium">{t.userName || t.userId?.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-text-primary font-medium">{t.symbol}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{t.market}</td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            t.direction === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>{t.direction}</span>
                        </td>
                        <td className="px-4 py-3 text-text-secondary text-xs">₹{Number(t.entryPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{t.exitPrice ? `₹${Number(t.exitPrice).toLocaleString()}` : '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-medium text-sm ${(t.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {(t.pnl || 0) >= 0 ? '+' : ''}₹{Number(t.pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            t.status === 'CLOSED' ? 'bg-green-500/10 text-green-500' :
                            t.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-gray-500/10 text-gray-500'
                          }`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trades.length === 0 && (
                  <div className="p-8 text-center text-text-secondary">No trades found matching your criteria.</div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border-color">
                  <span className="text-text-secondary text-sm">
                    {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                      className="p-2 rounded-lg bg-base border border-border-color text-text-secondary hover:bg-surface-hover disabled:opacity-40 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-text-primary text-sm font-medium px-2">{page} / {totalPages}</span>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                      className="p-2 rounded-lg bg-base border border-border-color text-text-secondary hover:bg-surface-hover disabled:opacity-40 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Distribution Chart */}
        <div>
          {loading ? <SkeletonChart /> : (
            <div className="bg-surface rounded-xl border border-border-color p-6">
              <h3 className="text-text-primary font-semibold mb-4">Market Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-text-secondary">No data</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
