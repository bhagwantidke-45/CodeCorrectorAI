import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Flame, Trophy, Target, Code2, Brain, Zap, Star, Clock,
  ChevronRight, Filter, Search, Building2, Tag, CheckCircle2,
  Lock, Sparkles, TrendingUp, Calendar, Award, Home, LayoutDashboard,
  BookCheck, ExternalLink, Eye, Trash2, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate, LANGUAGE_MAP } from '../utils/helpers.js';

const API = 'http://localhost:5000/api';

const DIFFICULTY_CONFIG = {
  easy:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Easy' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Medium' },
  hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Hard' },
};

const CATEGORIES = [
  'all', 'arrays', 'strings', 'linked-lists', 'trees', 'graphs',
  'dynamic-programming', 'binary-search', 'hashing', 'sorting',
  'two-pointers', 'sliding-window', 'recursion', 'math', 'greedy',
];

const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Adobe', 'Flipkart', 'Paytm'];

export default function Practice() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [challenges, setChallenges]     = useState([]);
  const [dailyChallenge, setDaily]      = useState(null);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(false);

  // Pre-seed filter from LearningPath navigation state
  const locState = location.state || {};
  const [filter, setFilter] = useState({
    difficulty: '', category: locState.category || 'all', company: locState.companies?.[0] || '', search: '',
    page: 1, limit: 15,
  });
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'daily' | 'ai' | 'company' | 'solved'
  const [aiConfig, setAiConfig]   = useState({ difficulty: 'medium', topic: 'arrays' });
  const [aiProblems, setAiProblems] = useState([]);

  // Solved problems state
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [solvedFilter, setSolvedFilter]     = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'
  const [solvedSearch, setSolvedSearch]     = useState('');

  // View challenge submissions state
  const [selectedChallengeForSubmissions, setSelectedChallengeForSubmissions] = useState(null);
  const [submissionsForChallenge, setSubmissionsForChallenge] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [viewingDetailSubmission, setViewingDetailSubmission] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const getScoreColorHex = (score) => {
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 70) return '#3b82f6'; // Blue
    if (score >= 50) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const handleOpenSubmissions = async (ch) => {
    setSelectedChallengeForSubmissions(ch);
    setLoadingSubmissions(true);
    try {
      const res = await axios.get(`${API}/submissions`, {
        params: { search: `Practice: ${ch.title}`, limit: 50 },
        headers: authHeader
      });
      setSubmissionsForChallenge(res.data.submissions || []);
    } catch {
      toast.error('Failed to load submissions for this challenge.');
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleToggleStar = async (id) => {
    setActing(id);
    try {
      const res = await axios.patch(`${API}/submissions/${id}/star`, {}, { headers: authHeader });
      setSubmissionsForChallenge(subs =>
        subs.map(s => s._id === id ? { ...s, isStarred: res.data.submission.isStarred } : s)
      );
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to star/unstar.');
    } finally {
      setActing(null);
    }
  };

  const handleRequestDeleteSubmission = async (id) => {
    if (!window.confirm('Request admin to delete this submission?')) return;
    setActing(id);
    try {
      const res = await axios.patch(`${API}/submissions/${id}/request-delete`, {}, { headers: authHeader });
      setSubmissionsForChallenge(subs =>
        subs.map(s => s._id === id ? { ...s, isDeleteRequested: true } : s)
      );
      toast.success('Deletion request submitted to admin.');
    } catch {
      toast.error('Failed to submit request.');
    } finally {
      setActing(null);
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Delete this submission permanently?')) return;
    setDeleting(id);
    try {
      await axios.delete(`${API}/submissions/${id}`, { headers: authHeader });
      toast.success('Submission deleted.');
      // Refresh submissions
      if (selectedChallengeForSubmissions) {
        const res = await axios.get(`${API}/submissions`, {
          params: { search: `Practice: ${selectedChallengeForSubmissions.title}`, limit: 50 },
          headers: authHeader
        });
        setSubmissionsForChallenge(res.data.submissions || []);
      }
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewDetailSubmission = async (id) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API}/submissions/${id}`, { headers: authHeader });
      setViewingDetailSubmission(res.data.submission);
    } catch {
      toast.error('Failed to load submission details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filter };
      if (params.category === 'all') delete params.category;
      if (activeTab === 'ai')      params.aiGenerated = true;
      if (activeTab === 'daily')   params.daily = true;

      const res = await axios.get(`${API}/challenges`, { params, headers: authHeader });
      setChallenges(res.data.data);
      setTotal(res.data.total);
    } catch {
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  }, [filter, activeTab]);

  const fetchDaily = async () => {
    try {
      const res = await axios.get(`${API}/challenges/daily`);
      setDaily(res.data.data);
    } catch { /* no daily yet */ }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`${API}/challenges/stats`, { headers: authHeader });
      setStats(res.data.data);
    } catch { /* skip */ }
  };

  const fetchSolvedProblems = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/challenges/solved`, { headers: authHeader });
      setSolvedProblems(res.data.data || []);
    } catch { /* skip */ }
  };

  useEffect(() => {
    fetchDaily();
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'solved') fetchSolvedProblems();
  }, [activeTab]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const generateProblems = async () => {
    if (!token) {
      toast.error('Please login to generate AI problems.');
      return;
    }
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/challenges/generate`, {
        difficulty: aiConfig.difficulty,
        topic: aiConfig.topic,
        count: 3,
        save: true,
      }, { headers: authHeader });
      setAiProblems(res.data.data);
      toast.success('AI generated 3 new problems!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Generation failed.';
      if (err.response?.status === 401) {
        toast.error('Please login to generate AI problems.');
      } else {
        toast.error(`Generation failed: ${msg}`);
      }
      console.error('Generate error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const xpToNextLevel = stats ? (stats.level * 100) - stats.xp : 0;
  const xpProgress    = stats ? ((stats.xp % 100) / 100) * 100 : 0;

  const solvedEasy = solvedProblems.filter(p => p.challenge?.difficulty === 'easy').length;
  const solvedMedium = solvedProblems.filter(p => p.challenge?.difficulty === 'medium' || p.challenge?.difficulty === 'mid').length;
  const solvedHard = solvedProblems.filter(p => p.challenge?.difficulty === 'hard').length;
  const solvedTotal = solvedProblems.length;

  const filteredSolved = solvedProblems.filter(item => {
    const ch = item.challenge;
    if (!ch) return false;
    
    // Difficulty filter
    if (solvedFilter !== 'all') {
      const targetDiff = solvedFilter === 'medium' ? ['medium', 'mid'] : [solvedFilter];
      if (!targetDiff.includes(ch.difficulty)) return false;
    }
    
    // Search filter
    if (solvedSearch) {
      const q = solvedSearch.toLowerCase();
      const matchTitle = ch.title?.toLowerCase().includes(q);
      const matchTags = ch.tags?.some(t => t.toLowerCase().includes(q));
      const matchCat = ch.category?.toLowerCase().includes(q);
      return matchTitle || matchTags || matchCat;
    }
    
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0f0f1a)', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                Practice & Challenges
              </h1>
              <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>Sharpen your skills daily • Compete • Grow</p>
              
              {/* Home & Dashboard Quick Nav */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => navigate('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <Home size={14} /> Home
                </button>
                <button onClick={() => navigate('/dashboard')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}>
                  <LayoutDashboard size={14} /> Dashboard
                </button>
              </div>
            </div>

            {/* XP Bar */}
            {stats && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 20px', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#818cf8' }}>Lv.{stats.level}</div>
                  <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase' }}>Level</div>
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                    <span>{stats.xp % 100} XP</span><span>{xpToNextLevel} to next</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg, #818cf8, #c084fc)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 12 }}>
                  <Flame size={16} color="#f59e0b" />
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.challengeStreak}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>streak</span>
                </div>
              </div>
            )}
          </div>

          {/* Stats Row */}
          {stats && (
            <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Solved', value: stats.totalSolved, icon: CheckCircle2, color: '#22c55e' },
                { label: 'Easy',   value: stats.byDifficulty.easy,   icon: Target, color: '#22c55e' },
                { label: 'Medium', value: stats.byDifficulty.medium, icon: Target, color: '#f59e0b' },
                { label: 'Hard',   value: stats.byDifficulty.hard,   icon: Target, color: '#ef4444' },
                { label: 'Daily Streak', value: stats.dailyChallengeStreak, icon: Calendar, color: '#818cf8' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '8px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: 16, fontWeight: 700, color }}>{value ?? 0}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px', display: 'flex', gap: 24 }}>
        {/* Sidebar filters */}
        <div style={{ width: 240, flexShrink: 0 }}>
          {/* Daily Challenge Card */}
          {dailyChallenge && (
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: 20, marginBottom: 20, cursor: 'pointer' }}
              onClick={() => navigate(`/solve/${dailyChallenge._id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Calendar size={16} color="#818cf8" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1 }}>Daily Challenge</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{dailyChallenge.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: DIFFICULTY_CONFIG[dailyChallenge.difficulty]?.color, background: DIFFICULTY_CONFIG[dailyChallenge.difficulty]?.bg, padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>
                  {DIFFICULTY_CONFIG[dailyChallenge.difficulty]?.label}
                </span>
                <ChevronRight size={16} color="#818cf8" />
              </div>
            </div>
          )}

          {/* Difficulty Filter */}
          <FilterSection title="Difficulty" icon={<Target size={14} />}>
            {['', 'easy', 'medium', 'hard'].map(d => (
              <button key={d}
                onClick={() => setFilter(f => ({ ...f, difficulty: d, page: 1 }))}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 2, background: filter.difficulty === d ? 'rgba(99,102,241,0.2)' : 'transparent', color: filter.difficulty === d ? '#818cf8' : '#94a3b8', transition: 'all 0.15s' }}>
                {d === '' ? 'All Difficulties' : DIFFICULTY_CONFIG[d]?.label}
              </button>
            ))}
          </FilterSection>

          {/* Company Filter */}
          <FilterSection title="Companies" icon={<Building2 size={14} />}>
            <button onClick={() => setFilter(f => ({ ...f, company: '', page: 1 }))}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 2, background: filter.company === '' ? 'rgba(99,102,241,0.2)' : 'transparent', color: filter.company === '' ? '#818cf8' : '#94a3b8' }}>All Companies</button>
            {COMPANIES.map(c => (
              <button key={c}
                onClick={() => setFilter(f => ({ ...f, company: c, page: 1 }))}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, marginBottom: 2, background: filter.company === c ? 'rgba(99,102,241,0.2)' : 'transparent', color: filter.company === c ? '#818cf8' : '#94a3b8' }}>
                {c}
              </button>
            ))}
          </FilterSection>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { id: 'all',     label: 'All Problems',    icon: Code2 },
              { id: 'daily',   label: 'Daily',           icon: Calendar },
              { id: 'ai',      label: 'AI Generated',    icon: Sparkles },
              { id: 'company', label: 'Company-wise',    icon: Building2 },
              { id: 'solved',  label: `Solved${stats ? ` (${stats.totalSolved})` : ''}`, icon: BookCheck },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => { setActiveTab(id); setFilter(f => ({ ...f, page: 1 })); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, border: '1px solid', borderColor: activeTab === id ? '#818cf8' : 'rgba(255,255,255,0.1)', background: activeTab === id ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === id ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* AI Generator Panel */}
          {activeTab === 'ai' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Sparkles size={18} color="#c084fc" />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#c084fc' }}>AI Problem Generator</span>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Difficulty</label>
                  <select value={aiConfig.difficulty} onChange={e => setAiConfig(a => ({ ...a, difficulty: e.target.value }))}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Topic</label>
                  <select value={aiConfig.topic} onChange={e => setAiConfig(a => ({ ...a, topic: e.target.value }))}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
                    {CATEGORIES.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c}>{c.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <button onClick={generateProblems} disabled={generating}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #818cf8, #c084fc)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}>
                  {generating ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Generating…</> : <><Sparkles size={14} /> Generate 3 Problems</>}
                </button>
              </div>

              {/* AI Generated Results */}
              {aiProblems.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {aiProblems.map((p, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 15 }}>{p.title}</span>
                          <DiffBadge d={p.difficulty} />
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{p.category} • {p.tags?.slice(0, 3).join(', ')}</div>
                      </div>
                      <button onClick={() => navigate(`/solve/${p._id}`)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #818cf8', background: 'transparent', color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Solve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'solved' ? (
            <div>
              {/* Search + Difficulty Filter for Solved */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input value={solvedSearch}
                    onChange={e => setSolvedSearch(e.target.value)}
                    placeholder="Search solved problems..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '9px 12px 9px 36px', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: 'All', count: solvedTotal },
                    { key: 'easy', label: 'Easy', count: solvedEasy },
                    { key: 'medium', label: 'Medium', count: solvedMedium },
                    { key: 'hard', label: 'Hard', count: solvedHard },
                  ].map(({ key, label, count }) => (
                    <button key={key}
                      onClick={() => setSolvedFilter(key)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid', borderColor: solvedFilter === key ? '#818cf8' : 'rgba(255,255,255,0.1)', background: solvedFilter === key ? 'rgba(99,102,241,0.2)' : 'transparent', color: solvedFilter === key ? '#818cf8' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {label} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {filteredSolved.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <Code2 size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No solved challenges found</div>
                  <div style={{ fontSize: 13 }}>Try a different filter or search query</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{filteredSolved.length} solved problems found</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredSolved.map((item, i) => {
                      const ch = item.challenge;
                      const solvedDate = new Date(item.solvedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                      return (
                        <div key={ch._id} onClick={() => navigate(`/solve/${ch._id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                          
                          {/* Index */}
                          <span style={{ width: 32, textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 500 }}>{i + 1}</span>

                          {/* Solved badge */}
                          <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center' }}>
                            <CheckCircle2 size={16} />
                          </div>

                          {/* Title & Tags */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{ch.title}</span>
                              {ch.isAiGenerated && <span style={{ fontSize: 10, color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>AI</span>}
                              {ch.isDailyChallenge && <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>DAILY</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 11, color: '#64748b' }}>Solved on {solvedDate}</span>
                              <span style={{ color: '#475569' }}>•</span>
                              {ch.tags?.slice(0, 3).map(t => (
                                <span key={t} style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>{t}</span>
                              ))}
                            </div>
                          </div>

                          {/* Difficulty */}
                          <DiffBadge d={ch.difficulty} />

                          {/* CTA buttons */}
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleOpenSubmissions(ch)}
                              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.2)'; e.currentTarget.style.borderColor = '#f59e0b'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; }}>
                              Submissions <Eye size={12} />
                            </button>
                            <button onClick={() => navigate(`/solve/${ch._id}`)}
                              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(129,140,248,0.4)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = '#818cf8'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.4)'; }}>
                              Review Code <ExternalLink size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Search + Category Filter */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input value={filter.search}
                    onChange={e => setFilter(f => ({ ...f, search: e.target.value, page: 1 }))}
                    placeholder="Search problems..."
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '9px 12px 9px 36px', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {CATEGORIES.slice(0, 8).map(c => (
                    <button key={c}
                      onClick={() => setFilter(f => ({ ...f, category: c, page: 1 }))}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid', borderColor: filter.category === c ? '#818cf8' : 'rgba(255,255,255,0.1)', background: filter.category === c ? 'rgba(99,102,241,0.2)' : 'transparent', color: filter.category === c ? '#818cf8' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {c === 'all' ? 'All' : c.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Challenge List */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                  Loading challenges…
                </div>
              ) : challenges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                  <Code2 size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No challenges found</div>
                  <div style={{ fontSize: 13 }}>Try a different filter or generate AI problems above</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{total} problems found</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {challenges.map((ch, i) => (
                      <ChallengeRow key={ch._id} challenge={ch} index={(filter.page - 1) * filter.limit + i + 1}
                        onSolve={() => navigate(`/solve/${ch._id}`)} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {total > filter.limit && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                      <button disabled={filter.page === 1}
                        onClick={() => setFilter(f => ({ ...f, page: f.page - 1 }))}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: filter.page === 1 ? 'not-allowed' : 'pointer', opacity: filter.page === 1 ? 0.4 : 1 }}>← Prev</button>
                      <span style={{ padding: '8px 16px', color: '#94a3b8', fontSize: 13 }}>Page {filter.page} of {Math.ceil(total / filter.limit)}</span>
                      <button disabled={filter.page >= Math.ceil(total / filter.limit)}
                        onClick={() => setFilter(f => ({ ...f, page: f.page + 1 }))}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Submissions List Modal */}
      {selectedChallengeForSubmissions && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ background: '#131324', border: '1px solid rgba(99,102,241,0.2)', width: '100%', maxWidth: '800px', maxHeight: '85vh', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Submissions</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>For: <strong style={{ color: '#818cf8' }}>{selectedChallengeForSubmissions.title}</strong></p>
              </div>
              <button onClick={() => setSelectedChallengeForSubmissions(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {loadingSubmissions ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 12 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: 14, color: '#94a3b8' }}>Loading submissions…</span>
                </div>
              ) : submissionsForChallenge.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  <Code2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>No submissions found</div>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>You haven't submitted code for this challenge yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {submissionsForChallenge.map((sub) => {
                    const scoreColor = getScoreColorHex(sub.qualityScore);
                    return (
                      <div key={sub._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', borderRadius: 12, transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {/* Star button */}
                          <button
                            onClick={() => handleToggleStar(sub._id)}
                            disabled={acting === sub._id}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: sub.isStarred ? '#fbbf24' : '#475569', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title={sub.isStarred ? 'Unstar solution' : 'Star solution'}
                          >
                            <Star size={16} fill={sub.isStarred ? 'currentColor' : 'none'} />
                          </button>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 13, color: LANGUAGE_MAP[sub.language]?.color || '#818cf8' }}>
                                {LANGUAGE_MAP[sub.language]?.icon} {LANGUAGE_MAP[sub.language]?.label || sub.language}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: sub.status === 'completed' ? '#22c55e' : '#ef4444', background: sub.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 99 }}>
                                {sub.status || 'completed'}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>
                                Score: {sub.qualityScore ?? 'N/A'}/100
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11, color: '#64748b' }}>
                              <span>Submitted on {formatDate(sub.createdAt)}</span>
                              {sub.isStarred ? (
                                <span style={{ color: '#fbbf24', fontWeight: 600 }}>• Starred (never expires)</span>
                              ) : sub.createdAt && (
                                <>
                                  <span>•</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <Clock size={10} />
                                    Expires in {Math.max(0, Math.ceil((new Date(sub.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))} days
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => handleViewDetailSubmission(sub._id)}
                            disabled={detailLoading}
                            style={{ padding: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                            title="View solution code"
                          >
                            <Eye size={14} /> View
                          </button>
                          {user?.role === 'admin' ? (
                            <button
                              onClick={() => handleDeleteSubmission(sub._id)}
                              disabled={deleting === sub._id}
                              style={{ padding: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                              title="Delete permanently (Admin)"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRequestDeleteSubmission(sub._id)}
                              disabled={acting === sub._id || sub.isDeleteRequested}
                              style={{ padding: 8, background: sub.isDeleteRequested ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: sub.isDeleteRequested ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)', color: sub.isDeleteRequested ? '#f59e0b' : '#94a3b8', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                              title={sub.isDeleteRequested ? 'Deletion request pending' : 'Request deletion from admin'}
                            >
                              <Trash2 size={14} /> {sub.isDeleteRequested ? 'Pending' : 'Request Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.01)' }}>
              <button onClick={() => setSelectedChallengeForSubmissions(null)} style={{ padding: '8px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {viewingDetailSubmission && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', padding: 16 }}>
          <div style={{ background: '#0e0e18', border: '1px solid rgba(99,102,241,0.3)', width: '100%', maxWidth: '750px', maxHeight: '90vh', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#13131f' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code2 size={18} color="#818cf8" />
                  {viewingDetailSubmission.title || 'Untitled Submission'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={12} />
                  Submitted on {formatDate(viewingDetailSubmission.createdAt)}
                </p>
              </div>
              <button onClick={() => setViewingDetailSubmission(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 6, borderRadius: 8 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Metric boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Language</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{LANGUAGE_MAP[viewingDetailSubmission.language]?.label || viewingDetailSubmission.language}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Quality Score</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: getScoreColorHex(viewingDetailSubmission.qualityScore) }}>{viewingDetailSubmission.qualityScore ?? 'N/A'}/100</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Complexity</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', lineHeight: 1.4 }}>
                    Time: {viewingDetailSubmission.timeComplexity || 'N/A'}<br />
                    Space: {viewingDetailSubmission.spaceComplexity || 'N/A'}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                  <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: viewingDetailSubmission.status === 'completed' ? '#22c55e' : '#ef4444', background: viewingDetailSubmission.status === 'completed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 99, marginTop: 4 }}>
                    {viewingDetailSubmission.status || 'completed'}
                  </span>
                </div>
              </div>

              {/* Code block */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Solution Code</span>
                  <button onClick={() => {
                    navigator.clipboard.writeText(viewingDetailSubmission.originalCode);
                    toast.success('Code copied to clipboard!');
                  }} style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Copy Code
                  </button>
                </div>
                <pre style={{ margin: 0, padding: 16, background: '#07070c', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 13, color: '#cbd5e1', overflowX: 'auto', fontFamily: '"Fira Code", monospace', maxHeight: 300, lineHeight: 1.5 }}>
                  {viewingDetailSubmission.originalCode}
                </pre>
              </div>

              {/* Summary */}
              {viewingDetailSubmission.summary && (
                <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', marginBottom: 6 }}>Summary & Performance</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{viewingDetailSubmission.summary}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12, background: '#13131f' }}>
              <button onClick={() => setViewingDetailSubmission(null)} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Close
              </button>
              <button
                onClick={() => {
                  const chId = selectedChallengeForSubmissions?._id;
                  setViewingDetailSubmission(null);
                  setSelectedChallengeForSubmissions(null);
                  navigate(`/solve/${chId}`, {
                    state: {
                      code: viewingDetailSubmission.originalCode,
                      language: viewingDetailSubmission.language
                    }
                  });
                }}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Zap size={14} /> Load Code to Editor
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FilterSection({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function DiffBadge({ d }) {
  const cfg = DIFFICULTY_CONFIG[d] || DIFFICULTY_CONFIG.medium;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 99 }}>{cfg.label}</span>
  );
}

function ChallengeRow({ challenge: ch, index, onSolve }) {
  const cfg = DIFFICULTY_CONFIG[ch.difficulty] || DIFFICULTY_CONFIG.medium;
  return (
    <div onClick={onSolve}
      style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 20px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
      {/* Index */}
      <span style={{ width: 32, textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 500 }}>{index}</span>

      {/* Solved badge */}
      {ch.solved && <CheckCircle2 size={16} color="#22c55e" style={{ flexShrink: 0 }} />}

      {/* Title & Tags */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{ch.title}</span>
          {ch.isAiGenerated && <span style={{ fontSize: 10, color: '#c084fc', background: 'rgba(168,85,247,0.1)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>AI</span>}
          {ch.isDailyChallenge && <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>DAILY</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {ch.tags?.slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>{t}</span>
          ))}
          {ch.companies?.slice(0, 2).map(c => (
            <span key={c} style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 4 }}>🏢 {c}</span>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <DiffBadge d={ch.difficulty} />

      {/* Acceptance */}
      <div style={{ textAlign: 'right', minWidth: 60 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: ch.acceptanceRate >= 50 ? '#22c55e' : ch.acceptanceRate >= 30 ? '#f59e0b' : '#ef4444' }}>
          {ch.acceptanceRate || 0}%
        </div>
        <div style={{ fontSize: 10, color: '#475569' }}>Accept</div>
      </div>

      {/* Points */}
      <div style={{ textAlign: 'right', minWidth: 50 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>+{ch.points}</div>
        <div style={{ fontSize: 10, color: '#475569' }}>XP</div>
      </div>
    </div>
  );
}
