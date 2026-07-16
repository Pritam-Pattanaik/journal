import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Trash2, Users, ShieldCheck, Shield, User, AlertTriangle, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { SkeletonTable } from '../../components/admin/SkeletonLoader';

interface SystemUser {
  id: string;
  email: string;
  fullName: string | null;
  role: 'USER' | 'SUB_ADMIN' | 'ADMIN' | 'SUPER_ADMIN';
  createdAt: string;
  totalTrades: number;
  netPnl: number;
}

interface UsersResponse {
  users: SystemUser[];
  total: number;
  page: number;
  limit: number;
}

const ROLES = ['ALL', 'USER', 'SUB_ADMIN', 'ADMIN', 'SUPER_ADMIN'] as const;
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Join Date' },
  { value: 'fullName', label: 'Name' },
  { value: 'totalTrades', label: 'Trades' },
  { value: 'netPnl', label: 'Net P&L' },
];

const roleBadge = (role: string) => {
  const styles: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
    ADMIN: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    SUB_ADMIN: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
    USER: 'bg-green-500/10 text-green-500 border border-green-500/20',
  };
  return styles[role] || styles.USER;
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<SystemUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order,
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);

      const data = await api.get<UsersResponse>(`/admin/users/list?${params}`);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, sort, order]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as SystemUser['role'] } : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      await api.delete(`/admin/users/${deleteModal.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.id));
      setTotal((prev) => prev - 1);
      setDeleteModal(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Users className="w-7 h-7 text-brand-500" />
          User Management
        </h1>
        <p className="text-text-secondary text-sm mt-1">Manage all platform users, roles, and access</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="bg-surface rounded-xl border border-border-color p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-base border border-border-color rounded-lg text-text-primary text-sm outline-none focus:border-brand-500 transition-colors placeholder:text-text-secondary"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-secondary" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-base border border-border-color text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-base border border-border-color text-text-primary rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-base border border-border-color rounded-lg text-text-secondary text-sm hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            {order === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={10} cols={7} />
      ) : (
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
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
                          {u.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-4 h-4" /> :
                           u.role === 'ADMIN' || u.role === 'SUB_ADMIN' ? <Shield className="w-4 h-4" /> :
                           <User className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-text-primary whitespace-nowrap">{u.fullName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-text-secondary">{u.totalTrades || 0}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        (u.netPnl || 0) > 0 ? 'text-green-500' : (u.netPnl || 0) < 0 ? 'text-red-500' : 'text-text-secondary'
                      }`}>
                        {(u.netPnl || 0) > 0 ? '+' : ''}₹{Number(u.netPnl || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/app/admin/users/${u.id}`)}
                            className="p-1.5 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-brand-500 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.id === currentUser?.id}
                            className="bg-base border border-border-color text-text-primary rounded-lg px-2 py-1 text-xs outline-none focus:border-brand-500 disabled:opacity-50"
                          >
                            <option value="USER">User</option>
                            <option value="SUB_ADMIN">Sub Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                          </select>
                          <button
                            onClick={() => setDeleteModal(u)}
                            disabled={u.id === currentUser?.id}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center text-text-secondary">No users found matching your criteria.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border-color">
              <span className="text-text-secondary text-sm">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} users
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-base border border-border-color text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-brand-500 text-white'
                          : 'bg-base border border-border-color text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-base border border-border-color text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface rounded-xl border border-border-color p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Delete User</h3>
              <button
                onClick={() => setDeleteModal(null)}
                className="ml-auto p-1 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to delete <span className="font-medium text-text-primary">{deleteModal.fullName || deleteModal.email}</span>?
              This action cannot be undone and will remove all their data.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-lg border border-border-color text-text-secondary hover:text-text-primary hover:bg-surface-hover text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
