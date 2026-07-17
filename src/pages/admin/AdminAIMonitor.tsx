import { useState, useEffect } from 'react';
import { Brain, BarChart3, Clock, User, FileText, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { api } from '../../lib/api';
import AnimatedNumber from '../../components/admin/AnimatedNumber';
import { SkeletonCard, SkeletonTable, SkeletonChart } from '../../components/admin/SkeletonLoader';

interface AiInsight {
  id: string;
  userId: string;
  type: string | null;
  content: string;
  tradesAnalyzedCount: number | null;
  createdAt: string | null;
  user: { email: string; fullName: string | null };
}

interface AiData {
  insights: AiInsight[];
  total: number;
  page: number;
  limit: number;
  stats: {
    totalInsights: number;
    byType: Record<string, number>;
  };
}

const TYPE_COLORS: Record<string, string> = {
  analysis: '#6366f1',
  trade_feedback: '#22c55e',
  weekly_digest: '#eab308',
  pattern_detection: '#ef4444',
  coaching: '#8b5cf6',
  other: '#64748b',
};

const TYPE_LABELS: Record<string, string> = {
  analysis: 'Deep Analysis',
  trade_feedback: 'Trade Feedback',
  weekly_digest: 'Weekly Digest',
  pattern_detection: 'Pattern Detection',
  coaching: 'Coaching',
};

export default function AdminAIMonitor() {
  const [data, setData] = useState<AiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const result = await api.get<AiData>(`/admin/ai-insights?page=${page}&limit=${limit}`);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, [page]);

  const pieData = data ? Object.entries(data.stats.byType).map(([key, value]) => ({
    name: TYPE_LABELS[key] || key,
    value,
    color: TYPE_COLORS[key] || TYPE_COLORS.other,
  })) : [];

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  if (loading && !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonChart />
        <SkeletonTable rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Coach Monitor</h1>
          <p className="text-text-secondary text-sm">Track AI usage, insights generated, and API activity</p>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/50 text-danger p-4 rounded-lg">{error}</div>
      )}

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface rounded-xl border border-border-color p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">Total Insights</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-500" />
                </div>
              </div>
              <AnimatedNumber value={data.stats.totalInsights} className="text-2xl font-bold text-text-primary" />
            </div>
            <div className="bg-surface rounded-xl border border-border-color p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">Analysis Runs</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <AnimatedNumber value={data.stats.byType?.analysis || 0} className="text-2xl font-bold text-purple-500" />
            </div>
            <div className="bg-surface rounded-xl border border-border-color p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">Trade Feedback</span>
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-success" />
                </div>
              </div>
              <AnimatedNumber value={data.stats.byType?.trade_feedback || 0} className="text-2xl font-bold text-success" />
            </div>
          </div>

          {/* Chart + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            {pieData.length > 0 && (
              <div className="bg-surface rounded-xl border border-border-color p-6">
                <h3 className="text-sm font-medium text-text-secondary mb-4">Insights by Type</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3} stroke="none">
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgb(var(--color-surface))', border: '1px solid rgb(var(--color-border))', borderRadius: 'var(--radius-lg)', color: 'rgb(var(--color-text-primary))' }} />
                  <Legend wrapperStyle={{ color: 'rgb(var(--color-text-secondary))', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-surface rounded-xl border border-border-color p-6">
              <h3 className="text-sm font-medium text-text-secondary mb-4">Type Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(data.stats.byType).map(([type, count]) => {
                  const pct = data.stats.totalInsights > 0 ? (count / data.stats.totalInsights * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-primary capitalize">{TYPE_LABELS[type] || type}</span>
                        <span className="text-text-secondary">{count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.other }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(data.stats.byType).length === 0 && (
                  <p className="text-text-secondary text-sm">No insights recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Insights Table */}
          <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
            <div className="px-6 py-4 border-b border-border-color">
              <h3 className="text-sm font-medium text-text-primary">Recent AI Insights</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Content</th>
                    <th className="px-6 py-3 font-medium text-right">Trades Analyzed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color">
                  {data.insights.map((insight) => (
                    <tr key={insight.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-3 text-text-secondary text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {insight.createdAt ? new Date(insight.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center">
                            <User className="w-3 h-3 text-brand-500" />
                          </div>
                          <span className="text-text-primary text-xs">{insight.user?.fullName || insight.user?.email || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
                          backgroundColor: (TYPE_COLORS[insight.type || 'other'] || TYPE_COLORS.other) + '1a',
                          color: TYPE_COLORS[insight.type || 'other'] || TYPE_COLORS.other,
                        }}>
                          {TYPE_LABELS[insight.type || ''] || insight.type || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-text-secondary text-xs max-w-xs truncate">{insight.content?.substring(0, 100)}...</td>
                      <td className="px-6 py-3 text-right text-text-secondary text-xs">{insight.tradesAnalyzedCount ?? '—'}</td>
                    </tr>
                  ))}
                  {data.insights.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">No AI insights found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border-color flex items-center justify-between">
                <span className="text-text-secondary text-xs">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors">Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-xs rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
