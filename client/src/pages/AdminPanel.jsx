import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import api from '../utils/api.js';
import { formatDate, LANGUAGE_MAP } from '../utils/helpers.js';
import toast from 'react-hot-toast';
import {
  Shield, Users, BarChart2, RefreshCw, Trash2, Search,
  UserCheck, UserX, Code2, Loader2, Activity, Trophy,
  FileText, Megaphone, Settings, TrendingUp, Plus, Pencil,
  X, Check, ChevronDown, Star, Calendar, Zap, Database,
  Cpu, MemoryStick, Clock, Globe, Eye, AlertCircle, Medal,
  BookOpen, Filter, Download, ToggleLeft, ToggleRight, Server
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area, PieChart, Pie,
} from 'recharts';

const LANG_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#06b6d4', '#f97316'];
const DIFF_COLORS = { easy: 'text-green-500 bg-green-500/10', medium: 'text-yellow-500 bg-yellow-500/10', hard: 'text-red-500 bg-red-500/10' };
const STATUS_COLORS = { upcoming: 'text-blue-500 bg-blue-500/10', live: 'text-green-500 bg-green-500/10', ended: 'text-dark-400 bg-dark-400/10', cancelled: 'text-red-500 bg-red-500/10' };

const TABS = [
  { id: 'overview',      icon: BarChart2,  label: 'Overview'      },
  { id: 'users',         icon: Users,      label: 'Users'         },
  { id: 'challenges',    icon: Trophy,     label: 'Challenges'    },
  { id: 'submissions',   icon: Code2,      label: 'Submissions'   },
  { id: 'reports',       icon: FileText,   label: 'Reports'       },
  { id: 'contests',      icon: Medal,      label: 'Contests'      },
  { id: 'announcements', icon: Megaphone,  label: 'Announcements' },
  { id: 'analytics',     icon: TrendingUp, label: 'Analytics'     },
  { id: 'system',        icon: Server,     label: 'System'        },
];

const CHALLENGE_CATEGORIES = [
  'arrays','strings','linked-lists','trees','graphs','dynamic-programming',
  'recursion','sorting','binary-search','hashing','two-pointers',
  'sliding-window','math','greedy','backtracking','stack-queue',
  'heap','trie','bit-manipulation','other',
];

/* ─── small reusable pill badge ─── */
const Badge = ({ label, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${className}`}>{label}</span>
);

/* ─── stat card ─── */
const StatCard = ({ label, value, icon: Icon, gradient, bg }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${bg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <p className={`text-3xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value ?? 0}</p>
    <p className="text-sm font-semibold text-dark-700 dark:text-dark-200 mt-1">{label}</p>
  </div>
);

/* ─── confirmation modal ─── */
const ConfirmModal = ({ open, message, onConfirm, onCancel, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card p-6 w-full max-w-sm">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-center text-dark-700 dark:text-dark-200 font-semibold mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════════════════════════════════ */
function OverviewTab({ stats, loading }) {
  const chartData = stats?.submissionsByLang?.map((l, i) => ({
    name: LANGUAGE_MAP[l._id]?.label || l._id,
    count: l.count,
    fill: LANG_COLORS[i % LANG_COLORS.length],
  })) || [];

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Users',      value: stats?.totalUsers,       icon: Users,    gradient: 'from-purple-500 to-primary-500', bg: 'bg-gradient-to-br from-purple-500 to-primary-600' },
          { label: 'Analyses',         value: stats?.totalSubmissions, icon: Code2,    gradient: 'from-primary-500 to-blue-500',   bg: 'bg-gradient-to-br from-primary-500 to-blue-600'   },
          { label: 'Reports',          value: stats?.totalReports,     icon: FileText, gradient: 'from-green-500 to-teal-500',     bg: 'bg-gradient-to-br from-green-500 to-teal-600'     },
          { label: 'Challenges',       value: stats?.totalChallenges,  icon: Trophy,   gradient: 'from-yellow-500 to-orange-500',  bg: 'bg-gradient-to-br from-yellow-500 to-orange-600'  },
          { label: 'Contests',         value: stats?.totalContests,    icon: Medal,    gradient: 'from-pink-500 to-rose-500',      bg: 'bg-gradient-to-br from-pink-500 to-rose-600'      },
        ].map(p => <StatCard key={p.label} {...p} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
}

/* ═══════════════════════════════════════════════════════════════
   USERS TAB
═══════════════════════════════════════════════════════════════ */
function UsersTab() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
    setActing(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      toast.success('User deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setActing(null); setConfirm(null); }
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

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <ConfirmModal
        open={!!confirm}
        message="Delete this user and ALL their data? This cannot be undone."
        onConfirm={() => handleDelete(confirm)}
        onCancel={() => setConfirm(null)}
        loading={acting === confirm}
      />
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-10" />
        </div>
        <button onClick={fetchUsers} className="btn-secondary py-2.5 px-4 text-sm">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
                {['User', 'Role', 'XP', 'Analyses', 'Solved', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {loading ? [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
              )) : filtered.map(u => (
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
                    <select value={u.role} onChange={e => handleRole(u._id, e.target.value)} disabled={acting === u._id}
                      className="text-xs font-semibold px-2 py-1 rounded-lg bg-dark-100 dark:bg-dark-700 border border-dark-200 dark:border-dark-600 text-dark-700 dark:text-dark-200 cursor-pointer">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-4"><span className="text-sm font-bold text-yellow-500">{u.xp || 0}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-bold text-primary-500">{u.analysisCount || 0}</span></td>
                  <td className="px-5 py-4"><span className="text-sm font-bold text-green-500">{u.solvedChallenges?.length || 0}</span></td>
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
                      <button onClick={() => setConfirm(u._id)} disabled={acting === u._id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <p className="text-center text-dark-400 py-12">No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHALLENGE FORM MODAL
═══════════════════════════════════════════════════════════════ */
const EMPTY_CHALLENGE = {
  title: '', description: '', difficulty: 'medium', category: 'arrays',
  tags: '', companies: '', hints: '', constraints: '',
  points: 10, timeLimit: 2000, memoryLimit: 256, isActive: true,
  examples: [{ input: '', output: '', explanation: '' }],
  testCases: [{ input: '', expectedOutput: '', isHidden: false, explanation: '' }],
  starterCode: { javascript: '// Write your solution here\n', python: '# Write your solution here\n', java: '// Write your solution here\n', cpp: '// Write your solution here\n' },
};

function ChallengeModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_CHALLENGE);
  const [saving, setSaving] = useState(false);
  const [activeCodeLang, setActiveCodeLang] = useState('javascript');

  useEffect(() => { setForm(initial || EMPTY_CHALLENGE); }, [initial]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required.'); return;
    }

    // Filter out completely empty examples and test cases
    const filteredExamples = form.examples
      ?.map(ex => ({
        input: ex.input?.trim() || '',
        output: ex.output?.trim() || '',
        explanation: ex.explanation?.trim() || '',
      }))
      .filter(ex => ex.input || ex.output || ex.explanation) || [];

    const filteredTestCases = form.testCases
      ?.map(tc => ({
        input: tc.input?.trim() || '',
        expectedOutput: tc.expectedOutput?.trim() || '',
        isHidden: !!tc.isHidden,
        explanation: tc.explanation?.trim() || '',
      }))
      .filter(tc => tc.input) || [];

    if (filteredTestCases.length === 0) {
      toast.error('At least one testcase with a valid input is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        examples: filteredExamples,
        testCases: filteredTestCases,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags,
        companies: typeof form.companies === 'string' ? form.companies.split(',').map(c => c.trim()).filter(Boolean) : form.companies,
        hints: typeof form.hints === 'string' ? form.hints.split('\n').map(h => h.trim()).filter(Boolean) : form.hints,
        constraints: typeof form.constraints === 'string' ? form.constraints.split('\n').map(c => c.trim()).filter(Boolean) : form.constraints,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      // The error is already handled by onSave but we catch to keep the modal open
      console.error(err);
    } finally { setSaving(false); }
  };

  const addExample   = () => set('examples', [...form.examples, { input: '', output: '', explanation: '' }]);
  const addTestCase  = () => set('testCases', [...form.testCases, { input: '', expectedOutput: '', isHidden: false, explanation: '' }]);
  const removeExample  = i => set('examples', form.examples.filter((_, idx) => idx !== i));
  const removeTestCase = i => set('testCases', form.testCases.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-700">
          <h2 className="text-xl font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {initial ? 'Edit Challenge' : 'Create New Challenge'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field" placeholder="Two Sum" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Description *</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} className="input-field resize-none" placeholder="Given an array of integers…" />
          </div>

          {/* Difficulty / Category / Points */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="input-field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="input-field">
                {CHALLENGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Points</label>
              <input type="number" value={form.points} onChange={e => set('points', Number(e.target.value))} className="input-field" />
            </div>
          </div>

          {/* Tags / Companies */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Tags (comma separated)</label>
              <input value={typeof form.tags === 'string' ? form.tags : form.tags?.join(', ')} onChange={e => set('tags', e.target.value)} className="input-field" placeholder="arrays, hash-map" />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Companies (comma separated)</label>
              <input value={typeof form.companies === 'string' ? form.companies : form.companies?.join(', ')} onChange={e => set('companies', e.target.value)} className="input-field" placeholder="Google, Amazon" />
            </div>
          </div>

          {/* Hints / Constraints */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Hints (one per line)</label>
              <textarea value={typeof form.hints === 'string' ? form.hints : form.hints?.join('\n')} onChange={e => set('hints', e.target.value)} rows={3} className="input-field resize-none text-sm" placeholder="Try using a hash map…" />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Constraints (one per line)</label>
              <textarea value={typeof form.constraints === 'string' ? form.constraints : form.constraints?.join('\n')} onChange={e => set('constraints', e.target.value)} rows={3} className="input-field resize-none text-sm" placeholder="2 ≤ nums.length ≤ 10⁴" />
            </div>
          </div>

          {/* Examples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide">Examples</label>
              <button onClick={addExample} className="text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1 font-semibold"><Plus className="w-3 h-3" />Add</button>
            </div>
            <div className="space-y-3">
              {form.examples.map((ex, i) => (
                <div key={i} className="bg-dark-50 dark:bg-dark-800 rounded-xl p-3 relative">
                  <button onClick={() => removeExample(i)} className="absolute top-2 right-2 p-1 text-dark-400 hover:text-red-400"><X className="w-3 h-3" /></button>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] font-bold text-dark-400 uppercase">Input</label>
                      <input value={ex.input} onChange={e => { const arr = [...form.examples]; arr[i].input = e.target.value; set('examples', arr); }} className="input-field mt-1 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-dark-400 uppercase">Output</label>
                      <input value={ex.output} onChange={e => { const arr = [...form.examples]; arr[i].output = e.target.value; set('examples', arr); }} className="input-field mt-1 text-xs" />
                    </div>
                  </div>
                  <label className="text-[10px] font-bold text-dark-400 uppercase">Explanation</label>
                  <input value={ex.explanation} onChange={e => { const arr = [...form.examples]; arr[i].explanation = e.target.value; set('examples', arr); }} className="input-field mt-1 text-xs" />
                </div>
              ))}
            </div>
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide">Test Cases</label>
              <button onClick={addTestCase} className="text-xs text-primary-500 hover:text-primary-400 flex items-center gap-1 font-semibold"><Plus className="w-3 h-3" />Add</button>
            </div>
            <div className="space-y-3">
              {form.testCases.map((tc, i) => (
                <div key={i} className="bg-dark-50 dark:bg-dark-800 rounded-xl p-3 relative">
                  <button onClick={() => removeTestCase(i)} className="absolute top-2 right-2 p-1 text-dark-400 hover:text-red-400"><X className="w-3 h-3" /></button>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="text-[10px] font-bold text-dark-400 uppercase">Input</label>
                      <input value={tc.input} onChange={e => { const arr = [...form.testCases]; arr[i].input = e.target.value; set('testCases', arr); }} className="input-field mt-1 text-xs font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-dark-400 uppercase">Expected Output</label>
                      <input value={tc.expectedOutput} onChange={e => { const arr = [...form.testCases]; arr[i].expectedOutput = e.target.value; set('testCases', arr); }} className="input-field mt-1 text-xs font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id={`hidden-${i}`} checked={tc.isHidden} onChange={e => { const arr = [...form.testCases]; arr[i].isHidden = e.target.checked; set('testCases', arr); }} className="rounded" />
                    <label htmlFor={`hidden-${i}`} className="text-xs text-dark-500 dark:text-dark-400">Hidden test case</label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Starter Code */}
          <div>
            <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-2">Starter Code</label>
            <div className="flex gap-2 mb-2">
              {['javascript', 'python', 'java', 'cpp'].map(lang => (
                <button key={lang} onClick={() => setActiveCodeLang(lang)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${activeCodeLang === lang ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'}`}>
                  {lang}
                </button>
              ))}
            </div>
            <textarea
              value={form.starterCode?.[activeCodeLang] || ''}
              onChange={e => set('starterCode', { ...form.starterCode, [activeCodeLang]: e.target.value })}
              rows={6} className="input-field font-mono text-sm resize-none" />
          </div>

          {/* Time/Memory + Active */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Time Limit (ms)</label>
              <input type="number" value={form.timeLimit} onChange={e => set('timeLimit', Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-dark-600 dark:text-dark-300 uppercase tracking-wide mb-1.5">Memory Limit (MB)</label>
              <input type="number" value={form.memoryLimit} onChange={e => set('memoryLimit', Number(e.target.value))} className="input-field" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
                <span className="text-sm font-semibold text-dark-700 dark:text-dark-200">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-dark-200 dark:border-dark-700">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {initial ? 'Save Changes' : 'Create Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHALLENGES TAB
═══════════════════════════════════════════════════════════════ */
function ChallengesTab() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory]     = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [confirm, setConfirm]       = useState(null);
  const [acting, setActing]         = useState(null);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search)     params.set('search', search);
      if (difficulty) params.set('difficulty', difficulty);
      if (category)   params.set('category', category);
      const res = await api.get(`/admin/challenges?${params}`);
      setChallenges(res.data.challenges);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load challenges.'); }
    finally { setLoading(false); }
  }, [page, search, difficulty, category]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const handleCreate = async (data) => {
    try {
      const res = await api.post('/admin/challenges', data);
      toast.success('Challenge created!');
      setChallenges(c => [res.data.challenge, ...c]);
      setTotal(t => t + 1);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create challenge.';
      toast.error(errMsg);
      throw err;
    }
  };

  const handleUpdate = async (data) => {
    try {
      const res = await api.put(`/admin/challenges/${editItem._id}`, data);
      toast.success('Challenge updated!');
      setChallenges(c => c.map(x => x._id === editItem._id ? res.data.challenge : x));
      setEditItem(null);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update challenge.';
      toast.error(errMsg);
      throw err;
    }
  };

  const handleDelete = async (id) => {
    setActing(id);
    try {
      await api.delete(`/admin/challenges/${id}`);
      setChallenges(c => c.filter(x => x._id !== id));
      setTotal(t => t - 1);
      toast.success('Challenge deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setActing(null); setConfirm(null); }
  };

  const handleToggle = async (id) => {
    setActing(id);
    try {
      const res = await api.patch(`/admin/challenges/${id}/toggle`);
      setChallenges(c => c.map(x => x._id === id ? { ...x, isActive: res.data.challenge.isActive } : x));
      toast.success(res.data.message);
    } catch { toast.error('Failed.'); }
    finally { setActing(null); }
  };

  const handleSetDaily = async (id) => {
    try {
      await api.patch(`/admin/challenges/${id}/daily`, { date: new Date().toISOString() });
      toast.success('Set as today\'s daily challenge!');
    } catch { toast.error('Failed to set daily challenge.'); }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!confirm} message="Delete this challenge permanently?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={acting === confirm} />
      <ChallengeModal
        open={modalOpen || !!editItem}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={editItem ? handleUpdate : handleCreate}
        initial={editItem ? {
          ...editItem,
          tags: editItem.tags?.join(', ') || '',
          companies: editItem.companies?.join(', ') || '',
          hints: editItem.hints?.join('\n') || '',
          constraints: editItem.constraints?.join('\n') || '',
        } : null}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search challenges…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
        </div>
        <select value={difficulty} onChange={e => { setDifficulty(e.target.value); setPage(1); }} className="input-field w-36">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="input-field w-44">
          <option value="">All Categories</option>
          {CHALLENGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setModalOpen(true)} className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2 ml-auto">
          <Plus className="w-4 h-4" />New Challenge
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
          <span className="text-sm font-semibold text-dark-600 dark:text-dark-300">{total} challenges total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700">
                {['Title', 'Difficulty', 'Category', 'Attempts', 'Accept%', 'Points', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {loading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
              )) : challenges.map(c => (
                <tr key={c._id} className="hover:bg-dark-50 dark:hover:bg-dark-800/60 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 max-w-[200px] truncate">{c.title}</p>
                      {c.isDailyChallenge && <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" />Daily</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={c.difficulty} className={DIFF_COLORS[c.difficulty]} />
                  </td>
                  <td className="px-5 py-4 text-xs text-dark-500 dark:text-dark-400">{c.category}</td>
                  <td className="px-5 py-4 text-sm font-bold text-dark-700 dark:text-dark-200">{c.totalAttempts}</td>
                  <td className="px-5 py-4 text-sm font-bold text-primary-500">{c.acceptanceRate}%</td>
                  <td className="px-5 py-4 text-sm font-bold text-yellow-500">{c.points}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-dark-100 dark:bg-dark-800 text-dark-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditItem(c)} title="Edit" className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleToggle(c._id)} disabled={acting === c._id} title={c.isActive ? 'Deactivate' : 'Activate'} className="p-1.5 rounded-lg text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors disabled:opacity-50">
                        {acting === c._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : c.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => handleSetDaily(c._id)} title="Set as Daily Challenge" className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-colors">
                        <Star className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirm(c._id)} title="Delete" className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && challenges.length === 0 && <p className="text-center text-dark-400 py-12">No challenges found.</p>}
        </div>
        {/* Pagination */}
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-dark-200 dark:border-dark-700">
            <span className="text-sm text-dark-400">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBMISSIONS TAB
═══════════════════════════════════════════════════════════════ */
function SubmissionsTab() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [language, setLanguage]       = useState('');
  const [isDeleteRequestedFilter, setIsDeleteRequestedFilter] = useState('');
  const [confirm, setConfirm]         = useState(null);
  const [acting, setActing]           = useState(null);
  const [detail, setDetail]           = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage]               = useState(1);
  const [total, setTotal]             = useState(0);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search)   params.set('search', search);
      if (language) params.set('language', language);
      if (isDeleteRequestedFilter) params.set('isDeleteRequested', isDeleteRequestedFilter);
      const res = await api.get(`/admin/submissions?${params}`);
      setSubmissions(res.data.submissions);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load submissions.'); }
    finally { setLoading(false); }
  }, [page, search, language, isDeleteRequestedFilter]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const viewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/submissions/${id}`);
      setDetail(res.data.submission);
    } catch { toast.error('Failed to load submission.'); }
    finally { setDetailLoading(false); }
  };

  const handleDelete = async (id) => {
    setActing(id);
    try {
      await api.delete(`/admin/submissions/${id}`);
      setSubmissions(s => s.filter(x => x._id !== id));
      setTotal(t => t - 1);
      if (detail?._id === id) setDetail(null);
      toast.success('Submission deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setActing(null); setConfirm(null); }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!confirm} message="Delete this submission permanently?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={acting === confirm} />

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-dark-200 dark:border-dark-700">
              <h3 className="font-bold text-dark-800 dark:text-dark-100">{detail.title || 'Untitled Analysis'}</h3>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-3 text-center">
                  <p className="text-xs text-dark-400 mb-1">Quality Score</p>
                  <p className="text-2xl font-black text-primary-500">{detail.qualityScore}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xs text-dark-400 mb-1">Language</p>
                  <p className="text-sm font-bold text-dark-700 dark:text-dark-200">{LANGUAGE_MAP[detail.language]?.label || detail.language}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xs text-dark-400 mb-1">Errors Found</p>
                  <p className="text-2xl font-black text-red-400">{detail.errors?.length || 0}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-dark-500 uppercase tracking-wide mb-2">Original Code</p>
                <pre className="bg-dark-900 text-dark-100 p-4 rounded-xl text-xs overflow-x-auto max-h-60 font-mono">{detail.originalCode}</pre>
              </div>
              {detail.summary && (
                <div>
                  <p className="text-xs font-bold text-dark-500 uppercase tracking-wide mb-2">Summary</p>
                  <p className="text-sm text-dark-600 dark:text-dark-300">{detail.summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search submissions…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
        </div>
        <select value={language} onChange={e => { setLanguage(e.target.value); setPage(1); }} className="input-field w-40">
          <option value="">All Languages</option>
          {Object.entries(LANGUAGE_MAP).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
        </select>
        <select value={isDeleteRequestedFilter} onChange={e => { setIsDeleteRequestedFilter(e.target.value); setPage(1); }} className="input-field w-48">
          <option value="">All Submissions</option>
          <option value="true">⚠️ Deletion Pending</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
          <span className="text-sm font-semibold text-dark-600 dark:text-dark-300">{total} submissions total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700">
                {['User', 'Title', 'Language', 'Score', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {loading ? [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
              )) : submissions.map(s => (
                <tr key={s._id} className="hover:bg-dark-50 dark:hover:bg-dark-800/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-dark-800 dark:text-dark-200">{s.userId?.name || 'Anonymous'}</p>
                    <p className="text-xs text-dark-400">{s.userId?.email || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-dark-700 dark:text-dark-200 max-w-[160px] truncate">{s.title || 'Untitled'}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-dark-600 dark:text-dark-300">{LANGUAGE_MAP[s.language]?.label || s.language}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-black ${s.qualityScore >= 80 ? 'text-green-500' : s.qualityScore >= 60 ? 'text-yellow-500' : 'text-red-400'}`}>{s.qualityScore}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={s.status} className={s.status === 'completed' ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-dark-100 dark:bg-dark-800 text-dark-400'} />
                    {s.isDeleteRequested && (
                      <span className="block mt-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full w-max">
                        Delete Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-dark-400">{formatDate(s.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => viewDetail(s._id)} disabled={detailLoading} className="p-1.5 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirm(s._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && submissions.length === 0 && <p className="text-center text-dark-400 py-12">No submissions found.</p>}
        </div>
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-dark-200 dark:border-dark-700">
            <span className="text-sm text-dark-400">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REPORTS TAB
═══════════════════════════════════════════════════════════════ */
function ReportsTab() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [confirm, setConfirm]   = useState(null);
  const [acting, setActing]     = useState(null);
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports-list?page=${page}&limit=15`);
      setReports(res.data.reports);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load reports.'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = async (id) => {
    setActing(id);
    try {
      await api.delete(`/admin/reports-list/${id}`);
      setReports(r => r.filter(x => x._id !== id));
      setTotal(t => t - 1);
      toast.success('Report deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setActing(null); setConfirm(null); }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!confirm} message="Delete this report permanently?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={acting === confirm} />
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
          <span className="text-sm font-semibold text-dark-600 dark:text-dark-300">{total} reports total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200 dark:border-dark-700">
                {['User', 'Submission', 'File', 'Size', 'Downloads', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-5 py-3"><div className="skeleton h-8 rounded-lg" /></td></tr>
              )) : reports.map(r => (
                <tr key={r._id} className="hover:bg-dark-50 dark:hover:bg-dark-800/60 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-dark-800 dark:text-dark-200">{r.userId?.name || '—'}</p>
                    <p className="text-xs text-dark-400">{r.userId?.email || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-dark-500 dark:text-dark-400">{r.submissionId?.title || '—'}</td>
                  <td className="px-5 py-4 text-xs text-dark-600 dark:text-dark-300 max-w-[160px] truncate">{r.fileName}</td>
                  <td className="px-5 py-4 text-xs text-dark-400">{r.fileSize ? `${(r.fileSize / 1024).toFixed(1)} KB` : '—'}</td>
                  <td className="px-5 py-4 text-sm font-bold text-primary-500">{r.downloadCount}</td>
                  <td className="px-5 py-4 text-xs text-dark-400">{formatDate(r.createdAt)}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => setConfirm(r._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && reports.length === 0 && <p className="text-center text-dark-400 py-12">No reports found.</p>}
        </div>
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-dark-200 dark:border-dark-700">
            <span className="text-sm text-dark-400">Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTESTS TAB
═══════════════════════════════════════════════════════════════ */
function ContestModal({ open, onClose, onSave, initial }) {
  const now = new Date();
  const pad = (d) => d.toISOString().slice(0, 16);
  const EMPTY = {
    title: '', description: '', type: 'weekly', difficulty: 'mixed',
    startTime: pad(now), endTime: pad(new Date(now.getTime() + 90 * 60000)),
    duration: 90, isPrivate: false, maxParticipants: 10000,
    rules: '', prizes: '',
  };
  const [form, setForm] = useState(initial || EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial || EMPTY); }, [initial]);
  if (!open) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required.'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        rules: typeof form.rules === 'string' ? form.rules.split('\n').map(r => r.trim()).filter(Boolean) : form.rules,
      };
      await onSave(payload);
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-200 dark:border-dark-700">
          <h2 className="text-xl font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
            <Medal className="w-5 h-5 text-yellow-500" />{initial ? 'Edit Contest' : 'Create Contest'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label-sm">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field mt-1" placeholder="Weekly Challenge #12" />
          </div>
          <div>
            <label className="label-sm">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="input-field mt-1 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-sm">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field mt-1">
                {['weekly','daily','special','company','custom'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-sm">Difficulty</label>
              <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className="input-field mt-1">
                {['beginner','intermediate','advanced','mixed'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-sm">Start Time</label>
              <input type="datetime-local" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="input-field mt-1" />
            </div>
            <div>
              <label className="label-sm">End Time</label>
              <input type="datetime-local" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="input-field mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-sm">Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={e => set('duration', Number(e.target.value))} className="input-field mt-1" />
            </div>
            <div>
              <label className="label-sm">Max Participants</label>
              <input type="number" value={form.maxParticipants} onChange={e => set('maxParticipants', Number(e.target.value))} className="input-field mt-1" />
            </div>
          </div>
          <div>
            <label className="label-sm">Rules (one per line)</label>
            <textarea value={typeof form.rules === 'string' ? form.rules : form.rules?.join('\n')} onChange={e => set('rules', e.target.value)} rows={3} className="input-field mt-1 resize-none text-sm" placeholder="No external libraries allowed…" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPrivate} onChange={e => set('isPrivate', e.target.checked)} className="rounded" />
            <span className="text-sm font-semibold text-dark-700 dark:text-dark-200">Private Contest</span>
          </label>
        </div>
        <div className="flex gap-3 p-6 border-t border-dark-200 dark:border-dark-700">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {initial ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContestsTab() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [confirm, setConfirm]     = useState(null);
  const [acting, setActing]       = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/contests');
      setContests(res.data.contests);
    } catch { toast.error('Failed to load contests.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreate = async (data) => {
    const res = await api.post('/admin/contests', data);
    toast.success('Contest created!');
    setContests(c => [res.data.contest, ...c]);
  };

  const handleUpdate = async (data) => {
    const res = await api.put(`/admin/contests/${editItem._id}`, data);
    toast.success('Contest updated!');
    setContests(c => c.map(x => x._id === editItem._id ? res.data.contest : x));
    setEditItem(null);
  };

  const handleDelete = async (id) => {
    setActing(id);
    try {
      await api.delete(`/admin/contests/${id}`);
      setContests(c => c.filter(x => x._id !== id));
      toast.success('Contest deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setActing(null); setConfirm(null); }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!confirm} message="Delete this contest permanently?" onConfirm={() => handleDelete(confirm)} onCancel={() => setConfirm(null)} loading={acting === confirm} />
      <ContestModal open={modalOpen || !!editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={editItem ? handleUpdate : handleCreate}
        initial={editItem ? { ...editItem, startTime: editItem.startTime?.slice(0,16), endTime: editItem.endTime?.slice(0,16), rules: editItem.rules?.join('\n') || '' } : null} />

      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)} className="btn-primary py-2.5 px-4 text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />New Contest
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-3">
          {contests.length === 0 && <p className="text-center text-dark-400 py-12">No contests yet.</p>}
          {contests.map(c => (
            <div key={c._id} className="glass-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                <Medal className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-dark-800 dark:text-dark-100 truncate">{c.title}</p>
                  <Badge label={c.status} className={STATUS_COLORS[c.status] || 'bg-dark-100 text-dark-400'} />
                  <Badge label={c.type} className="bg-dark-100 dark:bg-dark-800 text-dark-500 dark:text-dark-400" />
                  {c.isPrivate && <Badge label="Private" className="bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400" />}
                </div>
                <div className="flex items-center gap-4 text-xs text-dark-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.startTime).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration} min</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.participants?.length || 0} / {c.maxParticipants}</span>
                  <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{c.challenges?.length || 0} problems</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditItem(c)} className="p-2 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirm(c._id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANNOUNCEMENTS TAB
═══════════════════════════════════════════════════════════════ */
function AnnouncementsTab() {
  const [form, setForm] = useState({ title: '', message: '', type: 'info', scope: 'all', targetUserId: '' });
  const [sending, setSending] = useState(false);
  const [users, setUsers]     = useState([]);

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error('Title and message required.'); return; }
    if (form.scope === 'user' && !form.targetUserId) { toast.error('Please select a user.'); return; }
    setSending(true);
    try {
      const res = await api.post('/admin/announcements', form);
      toast.success(res.data.message);
      setForm({ title: '', message: '', type: 'info', scope: 'all', targetUserId: '' });
    } catch { toast.error('Failed to send announcement.'); }
    finally { setSending(false); }
  };

  const TYPE_STYLES = {
    info:    { bg: 'from-blue-500/10 to-blue-600/5',    border: 'border-blue-500/20',    icon: '📢', dot: 'bg-blue-500'    },
    warning: { bg: 'from-yellow-500/10 to-yellow-600/5', border: 'border-yellow-500/20', icon: '⚠️', dot: 'bg-yellow-500' },
    success: { bg: 'from-green-500/10 to-green-600/5',   border: 'border-green-500/20',  icon: '✅', dot: 'bg-green-500'  },
  };
  const cur = TYPE_STYLES[form.type];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Compose */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-purple-500" />Compose Announcement
        </h3>
        <div>
          <label className="label-sm">Title</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} className="input-field mt-1" placeholder="Platform Maintenance Notice" />
        </div>
        <div>
          <label className="label-sm">Message</label>
          <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={5} className="input-field mt-1 resize-none" placeholder="We will be performing scheduled maintenance on…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-sm">Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} className="input-field mt-1">
              <option value="info">📢 Info</option>
              <option value="warning">⚠️ Warning</option>
              <option value="success">✅ Success</option>
            </select>
          </div>
          <div>
            <label className="label-sm">Send To</label>
            <select value={form.scope} onChange={e => set('scope', e.target.value)} className="input-field mt-1">
              <option value="all">🌍 All Users</option>
              <option value="admins">🛡️ Admins Only</option>
              <option value="user">👤 Specific User</option>
            </select>
          </div>
        </div>
        {form.scope === 'user' && (
          <div>
            <label className="label-sm">Target User</label>
            <select value={form.targetUserId} onChange={e => set('targetUserId', e.target.value)} className="input-field mt-1">
              <option value="">Select user…</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
        )}
        <button onClick={handleSend} disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send Announcement'}
        </button>
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100">Preview</h3>
        <div className={`rounded-2xl border p-5 bg-gradient-to-br ${cur.bg} ${cur.border}`}>
          <div className="flex items-start gap-3">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cur.dot}`} />
            <div>
              <p className="font-bold text-dark-800 dark:text-dark-100 text-sm">{cur.icon} {form.title || 'Announcement Title'}</p>
              <p className="text-sm text-dark-600 dark:text-dark-300 mt-1">{form.message || 'Your announcement message will appear here…'}</p>
              <p className="text-xs text-dark-400 mt-2">Scope: {form.scope === 'all' ? 'All Users' : form.scope === 'admins' ? 'Admins Only' : 'Specific User'}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h4 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4">Audience Summary</h4>
          <div className="space-y-3">
            {[
              { label: 'Scope', value: form.scope === 'all' ? 'All active users' : form.scope === 'admins' ? 'Admins only' : 'Specific user' },
              { label: 'Type', value: form.type.charAt(0).toUpperCase() + form.type.slice(1) },
              { label: 'Channel', value: 'In-app notification' },
              { label: 'Auto-expires', value: '30 days' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-dark-400">{label}</span>
                <span className="font-semibold text-dark-700 dark:text-dark-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANALYTICS TAB
═══════════════════════════════════════════════════════════════ */
function AnalyticsTab() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics?days=${days}`);
      setData(res.data.data);
    } catch { toast.error('Failed to load analytics.'); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-dark-800 dark:text-dark-100">Platform Analytics</span>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${days === d ? 'bg-primary-500 text-white' : 'bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-600'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'New Users',      value: data?.userGrowth?.reduce((a, b) => a + b.count, 0) || 0, icon: Users,    color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Analyses Done',  value: data?.submissionTrends?.reduce((a, b) => a + b.count, 0) || 0, icon: Code2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Weekly Active',  value: data?.weeklyActiveUsers || 0, icon: Zap,   color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Avg Score',      value: Math.round(data?.submissionTrends?.reduce((a, b) => a + b.avgScore, 0) / (data?.submissionTrends?.length || 1)) || 0, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-dark-400 font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4">User Growth (last {days}d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data?.userGrowth || []}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="_id" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2} fill="url(#ug)" name="New Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Submission Trends */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4">Submission Trends (last {days}d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.submissionTrends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="_id" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Submissions" />
              <Line type="monotone" dataKey="avgScore" stroke="#22c55e" strokeWidth={2} dot={false} name="Avg Score" />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Language Distribution Pie */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4">Language Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data?.languageDist || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${LANGUAGE_MAP[_id]?.label || _id} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {(data?.languageDist || []).map((_, i) => <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} formatter={(v, n) => [v, LANGUAGE_MAP[n]?.label || n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4">Top Users by XP</h3>
          <div className="space-y-2.5">
            {data?.topUsers?.slice(0, 8).map((u, i) => (
              <div key={u._id} className="flex items-center gap-3">
                <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-dark-300 text-white' : i === 2 ? 'bg-orange-500 text-white' : 'bg-dark-100 dark:bg-dark-700 text-dark-500 dark:text-dark-400'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-dark-700 dark:text-dark-200 truncate">{u.name}</p>
                </div>
                <div className="flex gap-3 text-right text-[10px]">
                  <span className="font-bold text-yellow-500">{u.xp} XP</span>
                  <span className="text-green-500">{u.solved} solved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Challenge Acceptance */}
      {data?.challengeStats?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4">Hardest Challenges (Lowest Acceptance)</h3>
          <div className="space-y-3">
            {data.challengeStats.map(c => (
              <div key={c._id} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-dark-700 dark:text-dark-200 truncate">{c.title}</p>
                  <p className="text-[10px] text-dark-400">{c.totalAttempts} attempts · {c.totalSolved} solved</p>
                </div>
                <div className="flex items-center gap-2 w-40">
                  <div className="flex-1 h-1.5 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all" style={{ width: `${c.acceptanceRate}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-red-400 w-8">{c.acceptanceRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM TAB
═══════════════════════════════════════════════════════════════ */
function SystemTab() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/system');
      setData(res.data.data);
    } catch { toast.error('Failed to load system info.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
    </div>
  );

  const memPercent = data?.memory?.percent || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'DB Users',       value: data?.db?.users,       icon: Users,    color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'DB Submissions', value: data?.db?.submissions, icon: Code2,    color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
          { label: 'DB Challenges',  value: data?.db?.challenges,  icon: Trophy,   color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'DB Contests',    value: data?.db?.contests,    icon: Medal,    color: 'text-green-500',  bg: 'bg-green-500/10'  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-black ${color}`}>{value ?? '—'}</p>
              <p className="text-xs text-dark-400 font-semibold">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4 flex items-center gap-2">
            <MemoryStick className="w-4 h-4 text-blue-500" />Memory Usage
          </h3>
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-dark-400">Used: {data?.memory?.used} MB</span>
              <span className={`font-bold ${memPercent > 80 ? 'text-red-500' : memPercent > 60 ? 'text-yellow-500' : 'text-green-500'}`}>{memPercent}%</span>
            </div>
            <div className="h-3 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${memPercent > 80 ? 'bg-gradient-to-r from-red-500 to-rose-400' : memPercent > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-green-500 to-emerald-400'}`}
                style={{ width: `${memPercent}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Total', value: `${data?.memory?.total} MB` },
              { label: 'Used',  value: `${data?.memory?.used} MB`  },
              { label: 'Free',  value: `${data?.memory?.free} MB`  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-dark-50 dark:bg-dark-800 rounded-xl p-2">
                <p className="text-xs text-dark-400">{label}</p>
                <p className="text-sm font-bold text-dark-700 dark:text-dark-200">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CPU & OS */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-500" />Server Info
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Platform',        value: data?.platform },
              { label: 'Node.js',         value: data?.nodeVersion },
              { label: 'CPU Cores',       value: data?.cpu?.cores },
              { label: 'OS Uptime',       value: `${data?.osUptime}h` },
              { label: 'Server Uptime',   value: `${data?.serverUptime} min` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-dark-100 dark:border-dark-700 last:border-0">
                <span className="text-sm text-dark-400">{label}</span>
                <span className="text-sm font-semibold text-dark-700 dark:text-dark-200">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-bold text-dark-700 dark:text-dark-200 mb-1">Overall Status</h3>
        <p className="text-xs text-dark-400 mb-4">All systems are operational.</p>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-semibold text-green-500">Healthy — All services running normally</span>
          <button onClick={fetchHealth} className="ml-auto btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN ADMIN PANEL
═══════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const [stats, setStats]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.stats);
    } catch { toast.error('Failed to load admin data.'); }
    finally { setStatsLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <Shield className="w-7 h-7 text-purple-500" />Admin Panel
              </h1>
              <p className="page-subtitle">Full platform control & analytics</p>
            </div>
            <button onClick={fetchStats} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Refresh Stats
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 mb-6 border-b border-dark-200 dark:border-dark-700 overflow-x-auto pb-0 scrollbar-hide">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-all -mb-[1px] whitespace-nowrap flex-shrink-0 ${tab === id ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview'      && <OverviewTab stats={stats} loading={statsLoading} />}
          {tab === 'users'         && <UsersTab />}
          {tab === 'challenges'    && <ChallengesTab />}
          {tab === 'submissions'   && <SubmissionsTab />}
          {tab === 'reports'       && <ReportsTab />}
          {tab === 'contests'      && <ContestsTab />}
          {tab === 'announcements' && <AnnouncementsTab />}
          {tab === 'analytics'     && <AnalyticsTab />}
          {tab === 'system'        && <SystemTab />}
        </main>
      </div>
    </div>
  );
}
