import { useState, useEffect } from 'react';
import { ScrollText, Search, Calendar, Shield, UserMinus, Settings, RefreshCw, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { SkeletonTable } from '../../components/admin/SkeletonLoader';

interface AuditLog {
  id: string;
  adminId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: string | null;
  timestamp: string;
  admin?: { email: string; fullName: string | null } | null;
}

interface AuditData {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Shield }> = {
  CHANGE_ROLE: { label: 'Role Change', color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Shield },
  DELETE_USER: { label: 'User Deleted', color: 'text-red-500', bgColor: 'bg-red-500/10', icon: UserMinus },
  UPDATE_SETTING: { label: 'Setting Updated', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', icon: Settings },
  MANUAL_SYNC: { label: 'Manual Sync', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', icon: RefreshCw },
};

export default function AdminAuditLogs() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (actionFilter) params.set('action', actionFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const result = await api.get<AuditData>(`/admin/audit-logs?${params.toString()}`);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter, startDate, endDate]);

  const parseDetails = (details: string | null): Record<string, any> => {
    if (!details) return {};
    try { return JSON.parse(details); } catch { return {}; }
  };

  const formatDetailString = (action: string, details: Record<string, any>): string => {
    switch (action) {
      case 'CHANGE_ROLE':
        return `${details.oldRole || '?'} → ${details.newRole || '?'}`;
      case 'DELETE_USER':
        return `Deleted: ${details.email || details.fullName || 'Unknown user'}`;
      case 'UPDATE_SETTING':
        return `${details.key}: ${details.value}`;
      default:
        return JSON.stringify(details).substring(0, 80);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
          <p className="text-text-secondary text-sm">Track all administrative actions on the platform</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border-color p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-text-secondary text-xs mb-1.5 font-medium">Action Type</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border-color text-text-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-500 appearance-none"
              >
                <option value="">All Actions</option>
                <option value="CHANGE_ROLE">Role Changes</option>
                <option value="DELETE_USER">User Deletions</option>
                <option value="UPDATE_SETTING">Setting Updates</option>
                <option value="MANUAL_SYNC">Manual Syncs</option>
              </select>
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-text-secondary text-xs mb-1.5 font-medium">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border-color text-text-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-text-secondary text-xs mb-1.5 font-medium">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border-color text-text-primary rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
          {(actionFilter || startDate || endDate) && (
            <button
              onClick={() => { setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      {loading && !data ? (
        <SkeletonTable rows={10} cols={5} />
      ) : data && (
        <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
                <tr>
                  <th className="px-6 py-3 font-medium">Timestamp</th>
                  <th className="px-6 py-3 font-medium">Admin</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                  <th className="px-6 py-3 font-medium">Target</th>
                  <th className="px-6 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {data.logs.map((log) => {
                  const config = ACTION_CONFIG[log.action] || { label: log.action, color: 'text-gray-400', bgColor: 'bg-gray-500/10', icon: ScrollText };
                  const ActionIcon = config.icon;
                  const details = parseDetails(log.details);
                  return (
                    <tr key={log.id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-3 text-text-secondary text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-text-primary text-xs">{log.admin?.fullName || log.admin?.email || 'System'}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.bgColor} ${config.color}`}>
                          <ActionIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-text-secondary text-xs capitalize">{log.targetType}</span>
                        {log.targetId && <span className="text-text-secondary text-xs ml-1 font-mono opacity-60">({log.targetId.substring(0, 8)}...)</span>}
                      </td>
                      <td className="px-6 py-3 text-text-secondary text-xs max-w-xs truncate">
                        {formatDetailString(log.action, details)}
                      </td>
                    </tr>
                  );
                })}
                {data.logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                      {actionFilter || startDate || endDate ? 'No logs match the current filters.' : 'No audit logs recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border-color flex items-center justify-between">
              <span className="text-text-secondary text-xs">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-xs rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-xs rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
