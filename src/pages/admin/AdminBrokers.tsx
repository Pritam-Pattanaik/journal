import { useState, useEffect } from 'react';
import { Link2, Wifi, WifiOff, Clock, Users, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import AnimatedNumber from '../../components/admin/AnimatedNumber';
import { SkeletonCard, SkeletonTable } from '../../components/admin/SkeletonLoader';

interface BrokerConnection {
  id: string;
  userId: string;
  broker: string;
  clientId: string | null;
  isActive: boolean | null;
  lastSyncedAt: string | null;
  createdAt: string | null;
  user: { email: string; fullName: string | null };
}

interface BrokerData {
  connections: BrokerConnection[];
  stats: { total: number; active: number; inactive: number };
}

export default function AdminBrokers() {
  const [data, setData] = useState<BrokerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const result = await api.get<BrokerData>('/admin/brokers');
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch broker connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrokers(); }, []);

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const getTimeSince = (date: string | null) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ${mins}m ago`;
    return `${mins}m ago`;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Broker Connections</h1>
            <p className="text-text-secondary text-sm">Monitor all broker integrations across users</p>
          </div>
        </div>
        <button onClick={fetchBrokers} className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 text-brand-500 rounded-lg hover:bg-brand-500/20 transition-colors text-sm font-medium">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">{error}</div>
      )}

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-border-color p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Total Connections</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <AnimatedNumber value={data.stats.total} className="text-2xl font-bold text-text-primary" />
          </div>
          <div className="bg-surface rounded-xl border border-border-color p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Active</span>
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <AnimatedNumber value={data.stats.active} className="text-2xl font-bold text-green-500" />
          </div>
          <div className="bg-surface rounded-xl border border-border-color p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary text-sm">Inactive</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <WifiOff className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <AnimatedNumber value={data.stats.inactive} className="text-2xl font-bold text-red-500" />
          </div>
        </div>
      )}

      {/* Connections Table */}
      {data && (
        <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Broker</th>
                  <th className="px-6 py-4 font-medium">Client ID</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Last Synced</th>
                  <th className="px-6 py-4 font-medium">Connected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {data.connections.map((conn) => (
                  <tr key={conn.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-text-primary">{conn.user.fullName || 'Anonymous'}</span>
                        <p className="text-text-secondary text-xs">{conn.user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        conn.broker === 'zerodha' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                        conn.broker === 'angelone' ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
                        conn.broker === 'dhan' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {conn.broker?.toUpperCase() || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-xs">{conn.clientId || '—'}</td>
                    <td className="px-6 py-4">
                      {conn.isActive ? (
                        <span className="flex items-center gap-1.5 text-green-500 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                          <span className="w-2 h-2 rounded-full bg-red-400"></span> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                        <Clock className="w-3 h-3" />
                        {getTimeSince(conn.lastSyncedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-xs">{formatDate(conn.createdAt)}</td>
                  </tr>
                ))}
                {data.connections.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">No broker connections found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
