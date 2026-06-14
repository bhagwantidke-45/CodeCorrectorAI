import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import api from '../utils/api.js';
import { formatDate, LANGUAGE_MAP } from '../utils/helpers.js';
import toast from 'react-hot-toast';
import {
  Shield, Users, BarChart2, RefreshCw, Trash2, Search,
  UserCheck, UserX, ChevronDown, Code2, Loader2, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const LANG_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#06b6d4', '#f97316'];

export default function AdminPanel() {
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState(null);
  const [tab, setTab]       = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);
      setStats(sRes.data.stats);
      setUsers(uRes.data.users);
    } catch { toast.error('Failed to load admin data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id) => {
    setActing(id);
    try {
      const res = await api.patch(`/admin/users/${id}/toggle`);
      setUsers(u => u.map(x => x._id === id ? { ...x, isActive: res.data.user.isActive } : x));
      toast.success(res.data.message);
    } catch { toast.error('Action failed.'); }
    finally { setActing(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user and ALL their data?')) return;
    setActing(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      toast.success('User deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setActing(null); }
  };

  const handleRole = async (id, role) => {
    setActing(id);
    try {
      const res = await api.patch(`/admin/users/${id}/role`, { role });
      setUsers(u => u.map(x => x._id === id ? { ...x, role: res.data.user.role } : x));
      toast.success(`Role updated to ${role}.`);
    } catch { toast.error('Role update failed.'); }
    finally { setActing(null); }
  };

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = stats?.submissionsByLang?.map((l, i) => ({
    name: LANGUAGE_MAP[l._id]?.label || l._id,
    count: l.count,
    fill: LANG_COLORS[i % LANG_COLORS.length],
  })) || [];

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <Shield className="w-7 h-7 text-purple-500" />Admin Panel
              </h1>
              <p className="page-subtitle">Platform management and analytics</p>
            </div>
            <button onClick={fetchData} className="btn-secondary py-2 px-4 text-sm">
              <RefreshCw className="w-4 h-4" />Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-dark-200 dark:border-dark-700">
            {[{ id: 'overview', icon: BarChart2, label: 'Overview' }, { id: 'users', icon: Users, label: 'Users' }, { id: 'activity', icon: Activity, label: 'Activity' }].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-[1px] ${tab === id ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Overview */}
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: 'Total Users',      value: stats?.totalUsers,       icon: Users,    gradient: 'from-purple-500 to-primary-500', bg: 'bg-gradient-to-br from-purple-500 to-primary-600' },
                      { label: 'Total Analyses',   value: stats?.totalSubmissions, icon: Code2,    gradient: 'from-primary-500 to-blue-500',   bg: 'bg-gradient-to-br from-primary-500 to-blue-600' },
                      { label: 'Reports Generated',value: stats?.totalReports,     icon: BarChart2,gradient: 'from-green-500 to-teal-500',     bg: 'bg-gradient-to-br from-green-500 to-teal-600' },
                    ].map(({ label, value, icon: Icon, gradient, bg }) => (
                      <div key={label} className="stat-card">
                        <div className="flex items-center justify-between">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${bg}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className={`text-3xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value ?? 0}</p>
                          <p className="text-sm font-semibold text-dark-700 dark:text-dark-200">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Language chart */}
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-4">Submissions by Language</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} barSize={28}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} cursor={{ fill: 'rgba(168,85,247,0.1)' }} />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Submissions">
                            {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recent users */}
                    <div className="glass-card p-6">
                      <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-4">Recent Users</h3>
                      <div className="space-y-3">
                        {stats?.recentUsers?.map(u => (
                          <div key={u._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {u.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate">{u.name}</p>
                              <p className="text-xs text-dark-400 truncate">{u.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-primary-500">{u.analysisCount} analyses</p>
                              <p className="text-xs text-dark-400 capitalize">{u.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users */}
              {tab === 'users' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
                      className="input-field pl-10 max-w-sm" />
                  </div>
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
                            {['User', 'Role', 'Analyses', 'Status', 'Joined', 'Actions'].map(h => (
                              <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                          {filteredUsers.map(u => (
                            <tr key={u._id} className="hover:bg-dark-50 dark:hover:bg-dark-800/60 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {u.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-dark-800 dark:text-dark-200">{u.name}</p>
                                    <p className="text-xs text-dark-400">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <select value={u.role} onChange={e => handleRole(u._id, e.target.value)}
                                  disabled={acting === u._id}
                                  className="text-xs font-semibold px-2 py-1 rounded-lg bg-dark-100 dark:bg-dark-700 border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 cursor-pointer">
                                  <option value="user">user</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td className="px-5 py-4">
                                <span className="text-sm font-bold text-primary-500">{u.analysisCount || 0}</span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                                  {u.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                  {u.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-xs text-dark-400">{formatDate(u.createdAt)}</td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => handleToggle(u._id)} disabled={acting === u._id}
                                    className={`p-2 rounded-lg transition-colors ${u.isActive ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30'} disabled:opacity-50`}>
                                    {acting === u._id ? <Loader2 className="w-4 h-4 animate-spin" /> : u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                  </button>
                                  <button onClick={() => handleDelete(u._id)} disabled={acting === u._id}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity */}
              {tab === 'activity' && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />Recent Activity (Firebase)
                  </h3>
                  {stats?.recentActivity?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentActivity.map((a) => (
                        <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800">
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-dark-700 dark:text-dark-200 capitalize">{a.action?.replace(/_/g, ' ')}</span>
                            {a.userId && <span className="text-xs text-dark-400 ml-2">User: {a.userId}</span>}
                          </div>
                          {a.timestamp && <span className="text-xs text-dark-400">{new Date(a.timestamp?.seconds * 1000).toLocaleString()}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-dark-400 py-10">No Firebase activity logs yet. Ensure Firestore is configured.</p>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
