import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Clock, Users, Calendar, Zap, ChevronRight,
  Star, Crown, Medal, Target, Play, Lock, Globe
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const STATUS_CONFIG = {
  upcoming: { color: '#818cf8', bg: 'rgba(99,102,241,0.15)', label: 'Upcoming', dot: '#818cf8' },
  live:     { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  label: 'Live Now!', dot: '#22c55e' },
  ended:    { color: '#64748b', bg: 'rgba(100,116,139,0.1)', label: 'Ended',    dot: '#64748b' },
};

const TYPE_CONFIG = {
  weekly:  { label: 'Weekly Contest',  icon: '📅', color: '#818cf8' },
  daily:   { label: 'Daily Challenge', icon: '☀️', color: '#f59e0b' },
  special: { label: 'Special Round',   icon: '⚡', color: '#ec4899' },
  company: { label: 'Company Round',   icon: '🏢', color: '#06b6d4' },
};

export default function Contests() {
  const navigate = useNavigate();
  const [contests, setContests]         = useState([]);
  const [upcoming, setUpcoming]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('all'); // all | live | upcoming | ended
  const [leaderboard, setLeaderboard]   = useState(null);
  const [selectedContest, setSelected]  = useState(null);
  const [joining, setJoining]           = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchContests();
    fetchUpcoming();
  }, [activeTab]);

  const fetchContests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      const res = await axios.get(`${API}/contests`, { params });
      setContests(res.data.data || []);
    } catch { setContests([]); }
    finally { setLoading(false); }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await axios.get(`${API}/contests/upcoming`);
      setUpcoming(res.data.data || []);
    } catch { /* skip */ }
  };

  const joinContest = async (contestId) => {
    if (!token) return toast.error('Please login to join');
    setJoining(contestId);
    try {
      await axios.post(`${API}/contests/${contestId}/join`, {}, { headers: authHeader });
      toast.success('Joined contest!');
      fetchContests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    } finally {
      setJoining(null);
    }
  };

  const fetchLeaderboard = async (contestId) => {
    try {
      const res = await axios.get(`${API}/contests/${contestId}/leaderboard`);
      setLeaderboard(res.data.data);
      setSelected(contestId);
    } catch { toast.error('Failed to load leaderboard'); }
  };

  const countdown = (startTime) => {
    const diff = new Date(startTime) - new Date();
    if (diff <= 0) return 'Starting soon';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
    return `${h}h ${m}m`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0f1a33 50%, #001a33 100%)', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #818cf8, #ec4899)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, background: 'linear-gradient(135deg, #818cf8, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Weekly Contests
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>Compete. Climb. Conquer.</p>
            </div>
          </div>

          {/* Upcoming Contests Banner */}
          {upcoming.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              {upcoming.map(c => (
                <div key={c._id} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      {TYPE_CONFIG[c.type]?.icon} Next {TYPE_CONFIG[c.type]?.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{c.title}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>
                    <Clock size={14} />
                    {countdown(c.startTime)}
                  </div>
                  <button onClick={() => joinContest(c._id)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #818cf8, #c084fc)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Register
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 40px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['all', 'live', 'upcoming', 'ended'].map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid', borderColor: activeTab === tab ? '#818cf8' : 'rgba(255,255,255,0.1)', background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === tab ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', position: 'relative' }}>
              {tab === 'live' && (
                <span style={{ display: 'inline-block', width: 6, height: 6, background: '#22c55e', borderRadius: '50%', marginRight: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
              )}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Contest List */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                Loading contests…
              </div>
            ) : contests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                <Trophy size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 16, fontWeight: 600 }}>No contests found</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>Check back soon for upcoming contests!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {contests.map(c => <ContestCard key={c._id} contest={c}
                  onJoin={() => joinContest(c._id)}
                  onLeaderboard={() => fetchLeaderboard(c._id)}
                  joining={joining === c._id} />)}
              </div>
            )}
          </div>

          {/* Leaderboard Sidebar */}
          <div>
            {leaderboard ? (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 24 }}>
                <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Crown size={16} color="#fbbf24" /> Live Leaderboard
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{leaderboard.length} participants</div>
                </div>
                <div style={{ padding: 16 }}>
                  {leaderboard.slice(0, 20).map((entry, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <RankBadge rank={entry.rank} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', truncate: true }}>{entry.user?.name || 'Anonymous'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{entry.solvedCount} solved</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{entry.score}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setLeaderboard(null); setSelected(null); }}
                  style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24, textAlign: 'center', color: '#475569' }}>
                <Trophy size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>Click "Leaderboard" on any contest to see rankings</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

function ContestCard({ contest: c, onJoin, onLeaderboard, joining }) {
  const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.ended;
  const type   = TYPE_CONFIG[c.type] || TYPE_CONFIG.weekly;
  const isLive = c.status === 'live';
  const isEnded = c.status === 'ended';

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isLive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: 24, transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isLive ? 'rgba(34,197,94,0.5)' : 'rgba(99,102,241,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isLive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}>

      {isLive && <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 200, background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>{type.icon}</span>
            <span style={{ fontSize: 12, color: type.color, fontWeight: 700 }}>{type.label}</span>
            <span style={{ fontSize: 11, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
              {isLive && <span style={{ display: 'inline-block', width: 5, height: 5, background: '#22c55e', borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' }} />}
              {status.label}
            </span>
            <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 99 }}>{c.difficulty}</span>
          </div>

          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#e2e8f0' }}>{c.title}</h3>
          {c.description && <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{c.description}</p>}

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <Calendar size={13} />
              <span>{new Date(c.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <Clock size={13} />
              <span>{c.duration} min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
              <Users size={13} />
              <span>{c.participants?.length || 0} registered</span>
            </div>
            {c.challenges?.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8' }}>
                <Target size={13} />
                <span>{c.challenges.length} problems</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          {!isEnded && (
            <button onClick={onJoin} disabled={joining}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: isLive ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #818cf8, #c084fc)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: joining ? 'not-allowed' : 'pointer', opacity: joining ? 0.7 : 1 }}>
              {isLive ? <><Play size={13} /> Join Now</> : <><Star size={13} /> Register</>}
            </button>
          )}
          <button onClick={onLeaderboard}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            <Crown size={13} /> Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const medals = { 1: { color: '#fbbf24', icon: '🥇' }, 2: { color: '#cbd5e1', icon: '🥈' }, 3: { color: '#f97316', icon: '🥉' } };
  if (medals[rank]) {
    return <span style={{ fontSize: 18, lineHeight: 1 }}>{medals[rank].icon}</span>;
  }
  return <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>{rank}</span>;
}
