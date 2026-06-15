import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';
import {
  User as UserIcon, Mail, Lock, Save, Loader2, Shield,
  BarChart2, Calendar, Github, Trophy, Star, Award, CheckCircle2,
  Code2, ExternalLink, Settings, Layout, Flame, BookOpen
} from 'lucide-react';
import { formatDate } from '../utils/helpers.js';
import GithubSync from '../components/GithubSync.jsx';
import ActivityHeatmap from '../components/ActivityHeatmap.jsx';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';

const BADGE_TEMPLATES = [
  { id: 'first_analysis',    label: 'First Analysis',    emoji: '🎯', desc: 'Completed your first code analysis', color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: 'streak_3',          label: '3-Day Streak',      emoji: '🔥', desc: 'Analyzed code 3 days in a row', color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30' },
  { id: 'streak_7',          label: 'Week Warrior',      emoji: '⚡', desc: 'Analyzed code 7 days in a row', color: 'from-yellow-500/20 to-red-500/20 text-yellow-400 border-yellow-500/30' },
  { id: 'streak_30',         label: 'Monthly Master',    emoji: '🏆', desc: '30-day streak achieved!', color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30' },
  { id: 'high_score',         label: 'Clean Coder',       emoji: '✨', desc: 'Achieved a quality score of 95+', color: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30' },
  { id: 'polyglot',          label: 'Polyglot',          emoji: '🌐', desc: 'Analyzed code in 5+ different languages', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'centurion',         label: 'Centurion',         emoji: '💯', desc: 'Completed 100 analyses', color: 'from-red-500/20 to-pink-500/20 text-rose-400 border-rose-500/30' },
  { id: 'bug_hunter',        label: 'Bug Hunter',        emoji: '🐛', desc: 'Found and fixed 50+ errors', color: 'from-green-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' },
];

const LANG_COLORS = {
  javascript: '#f1e05a',
  python: '#3572A5',
  java: '#b07219',
  cpp: '#f34b7d',
  go: '#00ADD8',
  html: '#e34c26',
  css: '#563d7c',
  default: '#818cf8',
};

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  
  const targetId = id || currentUser?._id;
  const isOwnProfile = !id || id === currentUser?._id;

  const [activeTab, setActiveTab] = useState('overview'); // overview | settings
  const [profileUser, setProfileUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [nameForm, setNameForm]   = useState({ name: '' });
  const [pwForm,   setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);

  useEffect(() => {
    if (targetId) {
      fetchUserProfile();
    }
  }, [targetId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/auth/users/${targetId}/profile`);
      setProfileUser(res.data.user);
      setActivity(res.data.activity || []);
      setNameForm({ name: res.data.user.name });
    } catch (err) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return toast.error('Name cannot be empty.');
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', { name: nameForm.name });
      updateUser({ name: res.data.user.name });
      setProfileUser(prev => ({ ...prev, name: res.data.user.name }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) return toast.error('Fill all password fields.');
    if (pwForm.newPassword.length < 6) return toast.error('New password must be 6+ characters.');
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match.');
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSavingPw(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dark-500 dark:text-dark-400">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            <p className="text-sm font-semibold">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <h2 className="text-2xl font-black text-red-500 mb-2">User Not Found</h2>
            <p className="text-dark-400 mb-4">The developer profile you are trying to view does not exist.</p>
            <Link to="/dashboard" className="btn-primary">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const solved = profileUser.solvedChallenges || [];
  const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
  const topicCounts = {};

  solved.forEach(s => {
    const ch = s.challenge;
    if (ch) {
      difficultyCounts[ch.difficulty] = (difficultyCounts[ch.difficulty] || 0) + 1;
      const cat = ch.category || 'General';
      topicCounts[cat] = (topicCounts[cat] || 0) + 1;
    }
  });

  const radarData = Object.keys(topicCounts).map(topic => ({
    subject: topic,
    count: topicCounts[topic],
    fullMark: Math.max(...Object.values(topicCounts), 5)
  }));

  const userBadges = new Set(profileUser.badges || []);

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container max-w-6xl">
          
          {/* Header Card */}
          <div className="glass-card p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
              
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-primary-500/30 flex-shrink-0">
                {profileUser.name?.charAt(0)?.toUpperCase()}
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-dark-900 dark:text-white leading-tight">
                    {profileUser.name}
                  </h1>
                  <span className="self-center px-3 py-1 text-xs font-black bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-full flex items-center gap-1 shadow-md uppercase">
                    Level {profileUser.level || 1}
                  </span>
                </div>

                <p className="text-dark-500 dark:text-dark-400 text-sm mb-4 flex items-center justify-center md:justify-start gap-1">
                  <Mail className="w-4 h-4" /> {isOwnProfile ? profileUser.email : 'Public Profile'}
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                  <span className="badge-info capitalize flex items-center gap-1">
                    <Shield className="w-3 h-3" />{profileUser.role}
                  </span>
                  <span className="px-3 py-1 text-xs font-bold bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 rounded-full flex items-center gap-1 border border-dark-200 dark:border-dark-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />{solved.length} Solved
                  </span>
                  <span className="px-3 py-1 text-xs font-bold bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 rounded-full flex items-center gap-1 border border-dark-200 dark:border-dark-700">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />{profileUser.streak || 0} Day Streak
                  </span>
                  <span className="px-3 py-1 text-xs font-bold bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 rounded-full flex items-center gap-1 border border-dark-200 dark:border-dark-700">
                    <Calendar className="w-3.5 h-3.5" />Joined {formatDate(profileUser.createdAt)}
                  </span>
                </div>

                {/* Level / XP Progress bar */}
                <div className="max-w-md">
                  <div className="flex justify-between text-xs font-bold text-dark-400 mb-1">
                    <span>XP progress</span>
                    <span>{profileUser.xp % 100} / 100 XP</span>
                  </div>
                  <div className="w-full h-2.5 bg-dark-200 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${profileUser.xp % 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Settings Toggle button */}
              {isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab(activeTab === 'overview' ? 'settings' : 'overview')}
                    className={`btn-secondary flex items-center gap-2 text-sm py-2.5 px-4 ${activeTab === 'settings' ? 'bg-primary-500/20 text-primary-400 border-primary-500/30' : ''}`}
                  >
                    {activeTab === 'overview' ? (
                      <>
                        <Settings className="w-4 h-4" /> Account Settings
                      </>
                    ) : (
                      <>
                        <Layout className="w-4 h-4" /> View Portfolio
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MAIN PAGE VIEW */}
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COLUMN: Charts, Github, Badges */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Stats & Charts Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Skill Radar Chart */}
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <h2 className="text-lg font-black text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-primary-500" /> Skill Breakdown
                    </h2>
                    {radarData.length > 0 ? (
                      <div className="w-full h-56 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" r="70%" data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#475569', fontSize: 10 }} />
                            <Radar name={profileUser.name} dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: 12 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-dark-500 p-8">
                        <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-semibold">No challenges solved yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Difficulty Solved */}
                  <div className="glass-card p-6 flex flex-col justify-between">
                    <h2 className="text-lg font-black text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-primary-500" /> Difficulty Stats
                    </h2>
                    <div className="space-y-5 flex-1 flex flex-col justify-center">
                      {[
                        { label: 'Easy', count: difficultyCounts.easy, color: 'bg-green-500', text: 'text-green-500' },
                        { label: 'Medium', count: difficultyCounts.medium, color: 'bg-amber-500', text: 'text-amber-500' },
                        { label: 'Hard', count: difficultyCounts.hard, color: 'bg-red-500', text: 'text-red-500' },
                      ].map(diff => (
                        <div key={diff.label}>
                          <div className="flex justify-between items-center text-sm font-bold text-dark-400 mb-1">
                            <span className={diff.text}>{diff.label}</span>
                            <span>{diff.count} solved</span>
                          </div>
                          <div className="w-full h-3 bg-dark-200 dark:bg-dark-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${diff.color}`}
                              style={{ width: `${solved.length > 0 ? (diff.count / solved.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Heatmap */}
                <ActivityHeatmap timeSeries={activity} />

                {/* Badges Earned Section */}
                <div className="glass-card p-6">
                  <h2 className="text-lg font-black text-dark-900 dark:text-white mb-6 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary-500" /> Achievements & Badges
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {BADGE_TEMPLATES.map(badge => {
                      const isUnlocked = userBadges.has(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`relative border rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300 ${
                            isUnlocked
                              ? `bg-gradient-to-br ${badge.color} border-current/20 shadow-lg`
                              : 'bg-dark-100/30 dark:bg-dark-800/30 border-dark-200 dark:border-dark-700 opacity-40 grayscale'
                          }`}
                        >
                          <div className="text-3xl mb-2">{badge.emoji}</div>
                          <h3 className={`text-xs font-black leading-tight ${isUnlocked ? 'text-dark-900 dark:text-white' : 'text-dark-500'}`}>
                            {badge.label}
                          </h3>
                          <p className="text-[10px] text-dark-400 mt-1 line-clamp-2 leading-snug">
                            {badge.desc}
                          </p>
                          {!isUnlocked && (
                            <span className="absolute top-2 right-2 text-[10px] font-bold text-dark-500 flex items-center gap-0.5">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Synced GitHub Repos */}
                {profileUser.githubSynced && (
                  <div className="glass-card p-6">
                    <h2 className="text-lg font-black text-dark-900 dark:text-white mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Github className="w-5 h-5 text-primary-500" /> Synced GitHub Repositories
                      </span>
                      <a
                        href={`https://github.com/${profileUser.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary-500 hover:text-primary-400 font-bold flex items-center gap-1"
                      >
                        Visit Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </h2>

                    {profileUser.githubRepos?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profileUser.githubRepos.slice(0, 6).map((repo, i) => {
                          const langColor = LANG_COLORS[repo.language?.toLowerCase()] || LANG_COLORS.default;
                          return (
                            <div key={i} className="flex flex-col justify-between p-4 rounded-xl bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-700 hover:border-primary-500/40 transition-colors">
                              <div>
                                <h3 className="text-sm font-black text-dark-900 dark:text-white flex items-center gap-1.5 truncate">
                                  <Code2 className="w-4 h-4 text-primary-400" />
                                  <a href={repo.url} target="_blank" rel="noreferrer" className="hover:underline">
                                    {repo.name}
                                  </a>
                                </h3>
                                <p className="text-xs text-dark-400 mt-1.5 line-clamp-2 leading-relaxed">
                                  {repo.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-4 text-[11px] font-bold text-dark-500">
                                {repo.language && (
                                  <span className="flex items-center gap-1">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: langColor }} />
                                    {repo.language}
                                  </span>
                                )}
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {repo.stars} stars
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-dark-500">No public repositories fetched.</p>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Challenge Solve History */}
              <div className="space-y-6">
                
                {/* Solve History */}
                <div className="glass-card p-6">
                  <h2 className="text-lg font-black text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary-500" /> Solve History
                  </h2>
                  
                  {solved.length > 0 ? (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {solved.slice().reverse().map((s, i) => {
                        const difficulty = s.challenge?.difficulty || 'easy';
                        const diffColors = {
                          easy: 'text-green-500 bg-green-500/10 border-green-500/20',
                          medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                          hard: 'text-red-500 bg-red-500/10 border-red-500/20'
                        };
                        return (
                          <div key={i} className="p-3.5 rounded-xl bg-dark-50 dark:bg-dark-800/40 border border-dark-200 dark:border-dark-700/80 hover:border-dark-300 dark:hover:border-dark-600 transition-colors flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-dark-900 dark:text-slate-100 truncate">
                                {s.challenge?.title || 'Unknown Problem'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${diffColors[difficulty]}`}>
                                  {difficulty}
                                </span>
                                <span className="text-[11px] text-dark-400 font-medium">
                                  {formatDate(s.solvedAt)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs font-bold text-amber-500">+{s.points} XP</div>
                                <div className="text-[10px] text-dark-400 capitalize">{s.language}</div>
                              </div>
                              {s.challenge && (
                                <Link
                                  to={`/solve/${s.challenge._id}`}
                                  className="w-8 h-8 rounded-lg bg-dark-200 dark:bg-dark-700 hover:bg-primary-500 dark:hover:bg-primary-600 flex items-center justify-center text-dark-600 dark:text-dark-300 hover:text-white transition-colors"
                                  title="Solve again"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-dark-500 py-12">
                      <Trophy className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm font-semibold">No challenges solved.</p>
                      <Link to="/practice" className="mt-3 btn-secondary py-1.5 px-3 text-xs">
                        Start Practicing
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            
            // SETTINGS VIEW (Only visible for own profile)
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="glass-card p-8">
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 border-b border-dark-200 dark:border-dark-700 pb-3 mb-4">Edit Profile</h3>
                  <div>
                    <label className="label">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input type="text" value={nameForm.name} onChange={e => setNameForm({ name: e.target.value })}
                        className="input-field pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                      <input type="email" value={profileUser.email} disabled className="input-field pl-10 opacity-60 cursor-not-allowed" />
                    </div>
                    <p className="text-xs text-dark-400 mt-1">Email cannot be changed.</p>
                  </div>
                  <button type="submit" disabled={savingProfile} className="btn-primary">
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className="glass-card p-8">
                <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 border-b border-dark-200 dark:border-dark-700 pb-3 mb-6">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {[
                    { label: 'Current Password', key: 'currentPassword' },
                    { label: 'New Password',     key: 'newPassword' },
                    { label: 'Confirm New Password', key: 'confirm' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="label">{label}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                        <input type="password" value={pwForm[key]}
                          onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                          className="input-field pl-10" placeholder="••••••••" />
                      </div>
                    </div>
                  ))}
                  <button type="submit" disabled={savingPw} className="btn-primary">
                    {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update Password
                  </button>
                </form>
              </div>

              {/* GitHub Sync */}
              <div className="glass-card p-8">
                <h3 className="text-lg font-bold text-dark-800 dark:text-dark-100 border-b border-dark-200 dark:border-dark-700 pb-3 mb-6 flex items-center gap-2">
                  <Github className="w-5 h-5" /> GitHub Integration
                </h3>
                <GithubSync onSyncComplete={fetchUserProfile} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
