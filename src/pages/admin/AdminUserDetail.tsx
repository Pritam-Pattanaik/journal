import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Shield, ShieldCheck, TrendingUp, BookOpen, Link, Brain, BarChart3 } from 'lucide-react';
import { api } from '../../lib/api';
import { SkeletonCard, SkeletonTable } from '../../components/admin/SkeletonLoader';

interface UserDetail {
  id: string;
  email: string;
  fullName: string | null;
  role: 'USER' | 'SUB_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  trades: any[];
  strategies: any[];
  journal: any[];
  brokerConnections: any[];
  aiInsights: any[];
}

const tabs = [
  { key: 'trades', label: 'Trades', icon: TrendingUp },
  { key: 'strategies', label: 'Strategies', icon: BarChart3 },
  { key: 'journal', label: 'Journal', icon: BookOpen },
  { key: 'brokerConnections', label: 'Broker Connections', icon: Link },
  { key: 'aiInsights', label: 'AI Insights', icon: Brain },
] as const;

const roleBadge = (role: string) => {
  const styles: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    ADMIN: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    SUB_ADMIN: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    USER: 'bg-green-500/10 text-green-500 border border-green-500/20',
  };
  return styles[role] || styles.USER;
};

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserDetail | null>(null);
  const [activeTab, setActiveTab] = useState<string>('trades');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await api.get<UserDetail>(`/admin/users/${id}/detail`);
        setUserData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  const renderTradesTab = () => {
    const trades = userData?.trades || [];
    if (trades.length === 0) return <EmptyState label="No trades found" />;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
            <tr>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Symbol</th>
              <th className="px-6 py-4 font-medium">Market</th>
              <th className="px-6 py-4 font-medium">Direction</th>
              <th className="px-6 py-4 font-medium">Entry</th>
              <th className="px-6 py-4 font-medium">Exit</th>
              <th className="px-6 py-4 font-medium text-right">P&L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {trades.map((t: any, i: number) => (
              <tr key={i} className="hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{new Date(t.entryDate || t.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-text-primary font-medium">{t.symbol}</td>
                <td className="px-6 py-4 text-text-secondary">{t.market || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.direction === 'LONG' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>{t.direction || '-'}</span>
                </td>
                <td className="px-6 py-4 text-text-secondary">₹{Number(t.entryPrice || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-text-secondary">₹{Number(t.exitPrice || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${(t.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(t.pnl || 0) >= 0 ? '+' : ''}₹{Number(t.pnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStrategiesTab = () => {
    const strategies = userData?.strategies || [];
    if (strategies.length === 0) return <EmptyState label="No strategies found" />;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.map((s: any, i: number) => (
          <div key={i} className="bg-base rounded-lg border border-border-color p-4 hover:border-brand-500/30 transition-colors">
            <h4 className="text-text-primary font-medium mb-1">{s.name || 'Unnamed Strategy'}</h4>
            <p className="text-text-secondary text-sm mb-3 line-clamp-2">{s.description || 'No description'}</p>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span>Win Rate: <span className="text-green-500 font-medium">{s.winRate || 0}%</span></span>
              <span>Trades: {s.tradeCount || 0}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderJournalTab = () => {
    const entries = userData?.journal || [];
    if (entries.length === 0) return <EmptyState label="No journal entries found" />;
    return (
      <div className="space-y-3">
        {entries.map((j: any, i: number) => (
          <div key={i} className="bg-base rounded-lg border border-border-color p-4 hover:border-brand-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-text-primary font-medium">{j.title || 'Untitled'}</h4>
              <span className="text-text-secondary text-xs">{new Date(j.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-text-secondary text-sm line-clamp-3">{j.content || j.notes || 'No content'}</p>
            {j.mood && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs bg-brand-500/10 text-brand-500">{j.mood}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderBrokersTab = () => {
    const connections = userData?.brokerConnections || [];
    if (connections.length === 0) return <EmptyState label="No broker connections found" />;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
            <tr>
              <th className="px-6 py-4 font-medium">Broker</th>
              <th className="px-6 py-4 font-medium">Client ID</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Last Synced</th>
              <th className="px-6 py-4 font-medium">Connected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {connections.map((b: any, i: number) => (
              <tr key={i} className="hover:bg-surface-hover transition-colors">
                <td className="px-6 py-4 text-text-primary font-medium">{b.broker || b.brokerName || '-'}</td>
                <td className="px-6 py-4 text-text-secondary font-mono text-xs">{b.clientId || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    b.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>{b.status || 'unknown'}</span>
                </td>
                <td className="px-6 py-4 text-text-secondary">{b.lastSynced ? new Date(b.lastSynced).toLocaleString() : 'Never'}</td>
                <td className="px-6 py-4 text-text-secondary">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAITab = () => {
    const insights = userData?.aiInsights || [];
    if (insights.length === 0) return <EmptyState label="No AI insights found" />;
    return (
      <div className="space-y-3">
        {insights.map((a: any, i: number) => (
          <div key={i} className="bg-base rounded-lg border border-border-color p-4 hover:border-brand-500/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                a.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                a.type === 'suggestion' ? 'bg-blue-500/10 text-blue-500' :
                'bg-purple-500/10 text-purple-500'
              }`}>{a.type || 'insight'}</span>
              <span className="text-text-secondary text-xs">{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-text-secondary text-sm">{a.content || a.message || 'No content'}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trades': return renderTradesTab();
      case 'strategies': return renderStrategiesTab();
      case 'journal': return renderJournalTab();
      case 'brokerConnections': return renderBrokersTab();
      case 'aiInsights': return renderAITab();
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-surface-hover rounded animate-pulse"></div>
        <SkeletonCard />
        <SkeletonTable rows={5} cols={5} />
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <button onClick={() => navigate('/app/admin/users')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">
          {error || 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/app/admin/users')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Users
      </button>

      {/* User Header */}
      <div className="bg-surface rounded-xl border border-border-color p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
            {userData.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-8 h-8" /> :
             userData.role === 'ADMIN' || userData.role === 'SUB_ADMIN' ? <Shield className="w-8 h-8" /> :
             <User className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{userData.fullName || 'Anonymous User'}</h1>
              <span className={`px-2.5 py-1 rounded text-xs font-medium ${roleBadge(userData.role)}`}>
                {userData.role}
              </span>
            </div>
            <div className="flex items-center gap-4 text-text-secondary text-sm">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{userData.email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />Joined {new Date(userData.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border-color overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = (userData as any)[tab.key]?.length || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-brand-500 border-brand-500'
                  : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border-color'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-brand-500/10 text-brand-500' : 'bg-surface-hover text-text-secondary'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-text-secondary">{label}</p>
    </div>
  );
}
