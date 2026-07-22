import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { notify } from '../lib/notify';
import { Shield, ShieldAlert, ShieldCheck, User, Users } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/cn';
import { EmptyState } from '../components/ui/EmptyState';

interface SystemUser {
  id: string;
  email: string;
  fullName: string | null;
  role: 'USER' | 'SUB_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  totalTrades: number;
  netPnl: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.get<SystemUser[]>('/admin/users');
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const data = await api.patch<SystemUser>(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.role } : u)));
      notify.success('User role updated successfully');
    } catch (err: any) {
      notify.error(err.message || 'Failed to update role');
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  // Shared cell/header styles using current design tokens
  const thStyles = 'px-6 py-4 text-[10px] font-bold text-tertiary uppercase tracking-widest text-left whitespace-nowrap';
  const tdStyles = 'px-6 py-4 whitespace-nowrap border-b border-border';

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 page-enter font-ui pb-20">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Access Control</h1>
          <p className="text-sm text-secondary mt-1">Manage system users, roles, and administrative privileges.</p>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-1 border-b border-border">
                <th className={thStyles}>User Identity</th>
                <th className={thStyles}>Email Address</th>
                <th className={thStyles}>System Role</th>
                <th className={thStyles}>Member Since</th>
                <th className={thStyles}>Volume</th>
                <th className={cn(thStyles, 'text-right')}>Net P&L</th>
                {isSuperAdmin && <th className={cn(thStyles, 'text-right')}>Privileges</th>}
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-1/50 transition-colors group">
                  <td className={tdStyles}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-tertiary group-hover:bg-surface-3 group-hover:text-secondary transition-colors">
                        {u.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-4 h-4" /> :
                         u.role === 'ADMIN' || u.role === 'SUB_ADMIN' ? <Shield className="w-4 h-4" /> :
                         <User className="w-4 h-4" />}
                      </div>
                      <span className="font-bold text-primary tracking-tight">{u.fullName || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className={cn(tdStyles, 'text-secondary font-medium')}>{u.email}</td>
                  <td className={tdStyles}>
                    <span className={cn(
                      'px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest border',
                      u.role === 'SUPER_ADMIN' ? 'bg-iris/10 text-iris border-iris/20' :
                      u.role === 'ADMIN' ? 'bg-accent/10 text-accent border-accent/20' :
                      u.role === 'SUB_ADMIN' ? 'bg-warning/10 text-warning border-warning/20' :
                      'bg-surface-2 text-tertiary border-border',
                    )}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={cn(tdStyles, 'text-secondary font-mono text-[13px]')}>
                    {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className={cn(tdStyles, 'text-primary font-mono text-[13px]')}>
                    {u.totalTrades || 0}
                  </td>
                  <td className={cn(tdStyles, 'text-right font-mono text-[13px] font-bold')}>
                    <span className={cn(
                      (u.netPnl || 0) > 0 ? 'text-success' :
                      (u.netPnl || 0) < 0 ? 'text-danger' : 'text-tertiary',
                    )}>
                      {(u.netPnl || 0) > 0 ? '+' : ''}₹{Number(u.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className={cn(tdStyles, 'text-right')}>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user?.id}
                        className="bg-canvas border border-border text-primary rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-accent/50 disabled:opacity-50 appearance-none cursor-pointer hover:border-border-hover transition-colors"
                      >
                        <option value="USER">User</option>
                        <option value="SUB_ADMIN">Sub Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="p-8">
              <EmptyState 
                icon={Users} 
                title="No users found" 
                description="There are currently no users matching your criteria." 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
