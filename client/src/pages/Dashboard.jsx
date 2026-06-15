import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import StatsCard from '../components/StatsCard.jsx';
import StreakBadge from '../components/StreakBadge.jsx';
import ActivityHeatmap from '../components/ActivityHeatmap.jsx';
import api from '../utils/api.js';
import { formatDate, LANGUAGE_MAP, getScoreColor, getScoreLabel } from '../utils/helpers.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Zap, BarChart2, Code2, FileText, Clock, TrendingUp,
  AlertTriangle, ArrowRight, RefreshCw, Trophy, LineChart as LineIcon, Calendar,
  Flame, Target, Star, ChevronRight
} from 'lucide-react';

const LANG_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#06b6d4', '#f97316'];

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [solvedStats, setSolvedStats] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsRes, userRes] = await Promise.all([
        api.get('/submissions/stats'),
        api.get('/auth/me'),
      ]);
      setStats(statsRes.data.stats);
      if (userRes.data?.user) {
        updateUser(userRes.data.user);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyChallenge = async () => {
    try {
      const res = await api.get('/challenges/daily');
      if (res.data?.data) setDailyChallenge(res.data.data);
    } catch {
      // fallback to default
    }
  };

  const fetchSolvedStats = async () => {
    try {
      const res = await api.get('/challenges/stats');
      if (res.data?.data) setSolvedStats(res.data.data);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => { fetchStats(); fetchDailyChallenge(); fetchSolvedStats(); }, []);

  const chartData = stats?.byLanguage?.map(l => ({
    name: LANGUAGE_MAP[l._id]?.label || l._id,
    count: l.count,
    avgScore: Math.round(l.avgScore || 0),
  })) || [];

  const qualityTrendData = stats?.qualityTrend?.map((q, idx) => ({
    name: q.title ? (q.title.length > 15 ? q.title.substring(0, 15) + '…' : q.title) : `#${idx + 1}`,
    score: q.qualityScore,
    date: new Date(q.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  })) || [];

  const activityData = stats?.timeSeries?.map(t => ({
    name: new Date(t._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    analyses: t.count,
    errors: t.errorsFound,
  })) || [];

  // XP progress within current level
  const currentXp  = user?.xp || 0;
  const currentLvl = user?.level || 1;
  const xpForNext  = currentLvl * 100;          // 100 XP per level
  const xpInLevel  = currentXp % 100;
  const xpPct      = Math.min(100, Math.round((xpInLevel / 100) * 100));

  const dc = dailyChallenge || {
    title: 'Two Sum',
    difficulty: 'easy',
    category: 'Arrays',
    _id: null,
    description: 'Given an array of integers, return indices of two numbers that add up to a target.',
  };
  const dcXp = { easy: 25, medium: 50, hard: 100 }[dc.difficulty] || 50;
  const dcLink = dc._id ? `/practice/${dc._id}` : '/practice';

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

          {/* Daily Challenge Banner */}
          <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 p-0.5 shadow-xl shadow-primary-500/20">
            <div className="rounded-2xl bg-gradient-to-r from-primary-600/90 via-purple-600/90 to-pink-600/90 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Flame + label */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow">
                  🔥
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Daily Challenge</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full capitalize">{dc.difficulty}</span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full">{dc.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">{dc.title}</h3>
                  <p className="text-white/70 text-sm mt-0.5 line-clamp-1 hidden sm:block">{dc.description}</p>
                </div>
              </div>
              {/* XP + CTA */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-yellow-300 font-bold text-lg">
                    <Star className="w-4 h-4" />{dcXp} XP
                  </div>
                  <p className="text-white/60 text-xs">Reward</p>
                </div>
                <Link
                  to={dcLink}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 font-bold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg text-sm whitespace-nowrap"
                >
                  Solve Now <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
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

              {/* XP Level Progress Bar */}
              <div className="glass-card p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 dark:text-dark-500 font-medium">Current Level</p>
                    <p className="text-2xl font-black gradient-text">Lvl {currentLvl}</p>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between text-xs text-dark-400 dark:text-dark-500 mb-1.5">
                    <span>{xpInLevel} XP</span>
                    <span>{xpForNext} XP to Lvl {currentLvl + 1}</span>
                  </div>
                  <div className="w-full h-3 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-dark-400 dark:text-dark-500 mt-1">{xpPct}% toward next level · {currentXp} total XP</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Charts Area (Left + Middle Column) */}
                <div className="lg:col-span-2 space-y-6">
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

                  {/* Quality Trend Chart */}
                  <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-5 flex items-center gap-2">
                      <LineIcon className="w-5 h-5 text-primary-500" />Code Quality Trend (Last 10 Analyses)
                    </h2>
                    {qualityTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={qualityTrendData}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }}
                          />
                          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} name="Quality Score" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-dark-400">
                        <LineIcon className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">Not enough data to calculate quality trends. Start analyzing code!</p>
                      </div>
                    )}
                  </div>

                  {/* Daily activity chart */}
                  <div className="glass-card p-6">
                    <h2 className="text-lg font-bold text-dark-800 dark:text-dark-100 mb-5 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-500" />Daily Activity (Last 30 Days)
                    </h2>
                    {activityData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={activityData}>
                          <defs>
                            <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }}
                          />
                          <Area type="monotone" dataKey="analyses" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAnalyses)" name="Analyses Run" />
                          <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorErrors)" name="Errors Identified" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-48 text-dark-400">
                        <Calendar className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm">No analysis activity in the last 30 days.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar area (Right Column) */}
                <div className="space-y-6">
                  {/* Achievements Badge */}
                  <StreakBadge streak={user?.streak || 0} badges={user?.badges || []} />

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

                  {/* Recently Solved Challenges */}
                  {solvedStats?.recentSolved?.length > 0 && (
                    <div className="glass-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />Recently Solved
                        </h2>
                        <Link to="/practice" className="text-xs text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1">
                          All <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {solvedStats.recentSolved.map((s) => {
                          const ch = s.challenge;
                          if (!ch) return null;
                          const diffColor = { easy: 'text-green-500', medium: 'text-yellow-500', hard: 'text-red-500' }[ch.difficulty] || 'text-dark-400';
                          return (
                            <div key={s._id || ch._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-green-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate">{ch.title}</p>
                                <p className={`text-xs font-medium capitalize ${diffColor}`}>{ch.difficulty}</p>
                              </div>
                              {s.points && (
                                <span className="text-xs font-bold text-yellow-500">+{s.points}xp</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Difficulty breakdown mini-bar */}
                      <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
                        <div className="flex justify-between text-xs text-dark-400 mb-1.5">
                          <span>Progress</span>
                          <span>{solvedStats.totalSolved} solved</span>
                        </div>
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                          {solvedStats.byDifficulty?.easy > 0 && (
                            <div className="bg-green-500 rounded-full" style={{ width: `${(solvedStats.byDifficulty.easy / solvedStats.totalSolved) * 100}%` }} />
                          )}
                          {solvedStats.byDifficulty?.medium > 0 && (
                            <div className="bg-yellow-500 rounded-full" style={{ width: `${(solvedStats.byDifficulty.medium / solvedStats.totalSolved) * 100}%` }} />
                          )}
                          {solvedStats.byDifficulty?.hard > 0 && (
                            <div className="bg-red-500 rounded-full" style={{ width: `${(solvedStats.byDifficulty.hard / solvedStats.totalSolved) * 100}%` }} />
                          )}
                        </div>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs text-green-500 font-medium">{solvedStats.byDifficulty?.easy || 0} Easy</span>
                          <span className="text-xs text-yellow-500 font-medium">{solvedStats.byDifficulty?.medium || 0} Medium</span>
                          <span className="text-xs text-red-500 font-medium">{solvedStats.byDifficulty?.hard || 0} Hard</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile card */}
                  <div className="glass-card p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-xl mb-4 flex-shrink-0">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-800 dark:text-dark-100">{user?.name}</h3>
                      <p className="text-dark-500 dark:text-dark-400">{user?.email}</p>
                      <div className="flex flex-wrap gap-2 mt-3 justify-center">
                        <span className="badge-info capitalize">{user?.role}</span>
                        <span className="px-2.5 py-1 text-xs font-medium bg-dark-100 dark:bg-dark-700 text-dark-600 dark:text-dark-300 rounded-full">
                          {user?.analysisCount || 0} analyses
                        </span>
                      </div>
                    </div>
                    <Link to="/profile" className="btn-secondary w-full text-sm py-2 px-4 mt-5">Manage Profile</Link>
                  </div>
                </div>
              </div>
              {/* Activity Heatmap */}
              <ActivityHeatmap timeSeries={stats?.timeSeries || []} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
