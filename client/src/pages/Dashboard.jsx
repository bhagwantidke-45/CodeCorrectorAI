import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatsCard from '../components/StatsCard.jsx';
import api from '../utils/api.js';
import { formatDate, LANGUAGE_MAP, getScoreColor, getScoreLabel } from '../utils/helpers.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Zap, BarChart2, Code2, FileText, Clock, TrendingUp,
  AlertTriangle, ArrowRight, RefreshCw
} from 'lucide-react';

const LANG_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#06b6d4', '#f97316'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/submissions/stats');
      setStats(res.data.stats);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const chartData = stats?.byLanguage?.map(l => ({
    name: LANGUAGE_MAP[l._id]?.label || l._id,
    count: l.count,
    avgScore: Math.round(l.avgScore || 0),
  })) || [];

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">
                Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
              </h1>
              <p className="page-subtitle">Here's your code quality overview</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchStats} className="btn-secondary py-2 px-4 text-sm">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
              <Link to="/analyze" className="btn-primary py-2 px-4 text-sm">
                <Zap className="w-4 h-4" />New Analysis
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard icon={Zap} label="Total Analyses" value={stats?.totalAnalyses || 0}
                  sub="All time" gradient="from-primary-500 to-purple-500"
                  iconBg="bg-gradient-to-br from-primary-500 to-purple-600" />
                <StatsCard icon={TrendingUp} label="Avg Quality Score" value={`${stats?.averageQualityScore || 0}`}
                  sub="Out of 100" gradient="from-green-500 to-emerald-500"
                  iconBg="bg-gradient-to-br from-green-500 to-emerald-600" />
                <StatsCard icon={Code2} label="Languages Used" value={stats?.byLanguage?.length || 0}
                  sub="Different languages" gradient="from-blue-500 to-cyan-500"
                  iconBg="bg-gradient-to-br from-blue-500 to-cyan-600" />
                <StatsCard icon={AlertTriangle} label="Errors Fixed" value={
                  stats?.recentSubmissions?.reduce((a, s) => a + (s.errors?.length || 0), 0) || 0
                }
                  sub="In recent analyses" gradient="from-orange-500 to-red-500"
                  iconBg="bg-gradient-to-br from-orange-500 to-red-500" />
              </div>

              {/* Chart + Recent */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Language Chart */}
                <div className="glass-card p-6">
                  <h2 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-5 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary-500" />Analyses by Language
                  </h2>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} barSize={28}>
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }}
                          cursor={{ fill: 'rgba(99,102,241,0.1)' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Analyses">
                          {chartData.map((_, i) => <Cell key={i} fill={LANG_COLORS[i % LANG_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-dark-400">
                      <BarChart2 className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">No data yet. Start analyzing code!</p>
                    </div>
                  )}
                </div>

                {/* Recent Submissions */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary-500" />Recent Analyses
                    </h2>
                    <Link to="/history" className="text-sm text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1">
                      View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {stats?.recentSubmissions?.length > 0 ? (
                    <div className="space-y-3">
                      {stats.recentSubmissions.map((s) => (
                        <div key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-lg flex-shrink-0">
                            {LANGUAGE_MAP[s.language]?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate">{s.title || 'Analysis'}</p>
                            <p className="text-xs text-dark-400">{formatDate(s.createdAt)}</p>
                          </div>
                          <span className={`text-sm font-bold ${getScoreColor(s.qualityScore)}`}>{s.qualityScore}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-dark-400">
                      <Code2 className="w-10 h-10 mb-2 opacity-30" />
                      <p className="text-sm">No analyses yet</p>
                      <Link to="/analyze" className="mt-2 text-primary-500 text-sm font-medium hover:underline">Start your first analysis →</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile card */}
              <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-dark-800 dark:text-dark-100">{user?.name}</h3>
                  <p className="text-dark-500 dark:text-dark-400">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    <span className="badge-info capitalize">{user?.role}</span>
                    <span className="px-2.5 py-1 text-xs font-medium bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 rounded-full">
                      {user?.analysisCount || 0} analyses
                    </span>
                  </div>
                </div>
                <Link to="/profile" className="btn-secondary text-sm py-2 px-4">Manage Profile</Link>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
