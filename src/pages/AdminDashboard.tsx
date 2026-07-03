import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { api } from '../lib/api';

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
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-surface-hover rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-surface-hover rounded"></div>
              <div className="h-4 bg-surface-hover rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary text-sm">Manage system users and access levels</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-surface rounded-xl border border-border-color overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-hover/50 text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium">Trades</th>
                <th className="px-6 py-4 font-medium text-right">Net P&L</th>
                {isSuperAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
                        {u.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-4 h-4" /> : 
                         u.role === 'ADMIN' || u.role === 'SUB_ADMIN' ? <Shield className="w-4 h-4" /> : 
                         <User className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-text-primary">{u.fullName || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                      u.role === 'ADMIN' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                      u.role === 'SUB_ADMIN' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                      'bg-green-500/10 text-green-500 border border-green-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {u.totalTrades || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${
                      (u.netPnl || 0) > 0 ? 'text-green-500' :
                      (u.netPnl || 0) < 0 ? 'text-red-500' : 'text-text-secondary'
                    }`}>
                      {(u.netPnl || 0) > 0 ? '+' : ''}₹{Number(u.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user?.id} // Don't let super admin change their own role here
                        className="bg-background border border-border-color text-text-primary rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500 disabled:opacity-50"
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
            <div className="p-8 text-center text-text-secondary">
              No users found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
