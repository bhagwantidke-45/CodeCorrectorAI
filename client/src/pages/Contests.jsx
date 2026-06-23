import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Trophy, Clock, Users, Calendar, Zap, ChevronRight,
  Star, Crown, Medal, Target, Play, Lock, Globe,
  LayoutDashboard, Plus, Search, Copy, ArrowLeft,
  CheckCircle, XCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

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
  custom:  { label: 'Custom Challenge',icon: '👥', color: '#10b981' },
};

export default function Contests() {
  const navigate = useNavigate();
  const location = useLocation();
  const [contests, setContests]         = useState([]);
  const [upcoming, setUpcoming]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('all'); // all | live | upcoming | ended | global | my-contests
  const [leaderboard, setLeaderboard]   = useState(null);
  const [selectedContest, setSelected]  = useState(null);
  const [joining, setJoining]           = useState(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  // Custom Contests state
  const [viewingContest, setViewingContest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [challengesList, setChallengesList] = useState([]);
  const [challengeSearch, setChallengeSearch] = useState('');

  // Form states
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createStartTime, setCreateStartTime] = useState('');
  const [createEndTime, setCreateEndTime] = useState('');
  const [createDifficulty, setCreateDifficulty] = useState('mixed');
  const [createIsPrivate, setCreateIsPrivate] = useState(true);
  const [createChallenges, setCreateChallenges] = useState([]);

  const { token, user } = useAuth();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobalLeaderboard();
    } else {
      fetchContests();
      fetchUpcoming();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchChallengesList();
  }, []);

  // Back navigation handler
  useEffect(() => {
    if (location.state?.openContestId) {
      enterContest(location.state.openContestId);
    }
  }, [location.state]);

  const enterContest = async (contestId) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/contests/${contestId}`, { headers: authHeader });
      if (res.data?.success) {
        setViewingContest(res.data.data);
      }
    } catch {
      toast.error('Failed to load contest details');
    } finally {
      setLoading(false);
    }
  };

  const fetchContests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'my-contests') {
        params.myContests = 'true';
      } else if (activeTab !== 'all') {
        params.status = activeTab;
      }
      const res = await axios.get(`${API}/contests`, { params, headers: authHeader });
      setContests(res.data.data || []);
    } catch { setContests([]); }
    finally { setLoading(false); }
  };

  const fetchGlobalLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/challenges/leaderboard`, { headers: authHeader });
      setGlobalLeaderboard(res.data.data || []);
    } catch {
      setGlobalLeaderboard([]);
      toast.error('Failed to load global leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcoming = async () => {
    try {
      const res = await axios.get(`${API}/contests/upcoming`);
      setUpcoming(res.data.data || []);
    } catch { /* skip */ }
  };

  const fetchChallengesList = async () => {
    try {
      const res = await axios.get(`${API}/challenges?limit=100`);
      if (res.data?.success) {
        setChallengesList(res.data.data || []);
      }
    } catch { /* ignore */ }
  };

  const joinContest = async (contestId) => {
    if (!token) return toast.error('Please login to join');
    setJoining(contestId);
    try {
      await axios.post(`${API}/contests/${contestId}/join`, {}, { headers: authHeader });
      toast.success('Joined contest!');
      fetchContests();
      if (viewingContest && viewingContest._id === contestId) {
        enterContest(contestId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join');
    } finally {
      setJoining(null);
    }
  };

  const joinByCode = async (code) => {
    if (!token) return toast.error('Please login to join');
    if (!code.trim()) return toast.error('Join code is required');
    try {
      const res = await axios.post(
        `${API}/contests/join-by-code`,
        { joinCode: code.toUpperCase() },
        { headers: authHeader }
      );
      if (res.data?.success) {
        toast.success('Joined contest successfully!');
        setShowJoinModal(false);
        setJoinCodeInput('');
        fetchContests();
        if (res.data.data?._id) {
          enterContest(res.data.data._id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join contest');
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (!createTitle.trim()) return toast.error('Title is required');
    if (!createStartTime) return toast.error('Start time is required');
    if (!createEndTime) return toast.error('End time is required');
    if (new Date(createStartTime) >= new Date(createEndTime)) {
      return toast.error('Start time must be before End time');
    }
    if (createChallenges.length === 0) {
      return toast.error('Please select at least one problem');
    }

    try {
      const payload = {
        title: createTitle,
        description: createDesc,
        startTime: createStartTime,
        endTime: createEndTime,
        difficulty: createDifficulty,
        isPrivate: createIsPrivate,
        type: 'custom',
        challenges: createChallenges.map((chId, idx) => ({
          challenge: chId,
          points: 100,
          order: idx
        })),
        rules: ['No cheating', 'Submit your own solutions', 'Solve all problems in the given duration'],
      };

      const res = await axios.post(`${API}/contests`, payload, { headers: authHeader });
      if (res.data?.success) {
        toast.success('Custom contest created successfully!');
        setShowCreateModal(false);
        setCreateTitle('');
        setCreateDesc('');
        setCreateStartTime('');
        setCreateEndTime('');
        setCreateDifficulty('mixed');
        setCreateIsPrivate(true);
        setCreateChallenges([]);
        
        fetchContests();

        if (res.data.data?._id) {
          enterContest(res.data.data._id);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create contest');
    }
  };

  // Derived: is the current user already a participant in the viewed contest?
  const isUserRegistered = viewingContest
    ? (viewingContest.participants || []).some(
        p => (p.user?._id || p.user)?.toString() === user?._id?.toString()
      )
    : false;

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => toast.success('Join code copied!'))
      .catch(() => toast.error('Failed to copy code'));
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
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #818cf8, #ec4899)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, background: 'linear-gradient(135deg, #818cf8, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {viewingContest ? 'Contest Arena' : 'Weekly Contests'}
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: '#94a3b8' }}>
                {viewingContest ? viewingContest.title : 'Compete. Climb. Conquer.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', textDecoration: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            {!viewingContest && (
              <>
                <button onClick={() => setShowJoinModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.15)', color: '#818cf8', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Users size={16} /> Join Private
                </button>
                <button onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #818cf8, #ec4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}>
                  <Plus size={16} /> Create Contest
                </button>
              </>
            )}
          </div>
        </div>

        {/* Upcoming Contests Banner (Only on Main list) */}
        {!viewingContest && upcoming.length > 0 && (
          <div style={{ maxWidth: 1200, margin: '24px auto 0 auto', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
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

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 40px' }}>
        
        {viewingContest ? (
          /* ========================================================
             DETAIL VIEW (CONTEST ARENA)
             ======================================================== */
          <div>
            {/* Back to feed button */}
            <button 
              onClick={() => {
                setViewingContest(null);
                // Clear state
                navigate('/contests', { replace: true, state: {} });
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13, marginBottom: 24, transition: 'all 0.2s' }}
            >
              <ArrowLeft size={16} /> Back to Contests
            </button>

            {/* Split Screen Container */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
              
              {/* Left Side: Contest Status & Problems */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Contest banner card */}
                <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99, background: STATUS_CONFIG[viewingContest.status]?.bg || 'rgba(255,255,255,0.1)', color: STATUS_CONFIG[viewingContest.status]?.color || '#fff' }}>
                      {STATUS_CONFIG[viewingContest.status]?.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: TYPE_CONFIG[viewingContest.type]?.color || '#fff' }}>
                      {TYPE_CONFIG[viewingContest.type]?.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 99 }}>
                      {viewingContest.difficulty}
                    </span>
                  </div>

                  <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 10px 0', color: '#f1f5f9' }}>{viewingContest.title}</h2>
                  {viewingContest.description && (
                    <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{viewingContest.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: 24, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Starts</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 4, fontWeight: 600 }}>
                        {new Date(viewingContest.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Duration</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 4, fontWeight: 600 }}>{viewingContest.duration} mins</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Participants</div>
                      <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 4, fontWeight: 600 }}>{viewingContest.participants?.length || 0} joined</div>
                    </div>
                    {viewingContest.joinCode && (
                      <div>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Join Code</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 14, color: '#10b981', fontWeight: 800, letterSpacing: 0.5 }}>{viewingContest.joinCode}</span>
                          <button onClick={() => handleCopyCode(viewingContest.joinCode)} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <Copy size={13} style={{ hover: { color: '#e2e8f0' } }} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Challenges Section */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Target size={18} color="#818cf8" /> Coding Challenges ({viewingContest.challenges?.length || 0})
                  </h3>

                  {!isUserRegistered ? (
                    /* User needs to join/register first to view problems */
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: '1px dashed rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.02)', padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                      <Lock size={32} color="#818cf8" style={{ opacity: 0.6 }} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Contest Problems locked</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>You must register or join this contest to view and solve these challenges.</div>
                      </div>
                      <button 
                        onClick={() => joinContest(viewingContest._id)}
                        disabled={joining === viewingContest._id}
                        style={{ padding: '8px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #818cf8, #ec4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {joining === viewingContest._id ? 'Joining...' : 'Register to Compete'}
                      </button>
                    </div>
                  ) : (
                    /* Registered challenges list */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {viewingContest.challenges?.map((item, idx) => {
                        const ch = item.challenge;
                        if (!ch) return null;
                        
                        // Check if solved during contest
                        const isSolved = viewingContest.participants
                          ?.find(p => (p.user?._id || p.user)?.toString() === user?._id?.toString())
                          ?.solvedAt?.some(s => s.challengeId?.toString() === ch._id?.toString());

                        const isLive = viewingContest.status === 'live';

                        return (
                          <div key={ch._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, gap: 12, transition: 'all 0.2s' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{ch.title}</div>
                              <div style={{ display: 'flex', gap: 10, marginTop: 4, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: ch.difficulty === 'easy' ? '#22c55e' : ch.difficulty === 'medium' ? '#f59e0b' : '#ef4444', textTransform: 'capitalize', fontWeight: 600 }}>
                                  {ch.difficulty}
                                </span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>•</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Category: {ch.category}</span>
                                <span style={{ fontSize: 11, color: '#64748b' }}>•</span>
                                <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 'bold' }}>{item.points} XP</span>
                              </div>
                            </div>
                            <div>
                              {isSolved ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: 13, fontWeight: 700 }}>
                                  <CheckCircle size={16} /> Solved
                                </div>
                              ) : isLive ? (
                                <button
                                  onClick={() => navigate(`/solve/${ch._id}`, { state: { contestId: viewingContest._id } })}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #818cf8, #c084fc)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  <Play size={12} /> Solve
                                </button>
                              ) : (
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Locked</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Leaderboard & Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Contest Leaderboard */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Crown size={16} color="#fbbf24" /> Contest Leaderboard
                  </h3>

                  {viewingContest.leaderboard && viewingContest.leaderboard.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {viewingContest.leaderboard.map((entry) => (
                        <div key={entry.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                          <RankBadge rank={entry.rank} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {entry.name || 'Anonymous'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{entry.solvedCount} solved</div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{entry.score} pts</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No participants on the leaderboard yet.
                    </div>
                  )}
                </div>

                {/* Rules Section */}
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', color: '#f1f5f9' }}>Contest Rules</h3>
                  <ul style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                    {viewingContest.rules?.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    )) || (
                      <>
                        <li>Submit your solutions directly via the Monaco editor.</li>
                        <li>Leaderboard rankings are based on total challenge points.</li>
                        <li>Tie-breaking: Faster solve time elapsed since contest start takes precedence.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ========================================================
             MAIN VIEW (CONTESTS LIST & GLOBAL RANKINGS)
             ======================================================== */
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {['all', 'live', 'upcoming', 'ended', 'my-contests', 'global'].map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ padding: '8px 20px', borderRadius: 10, border: '1px solid', borderColor: activeTab === tab ? '#818cf8' : 'rgba(255,255,255,0.1)', background: activeTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent', color: activeTab === tab ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', position: 'relative' }}>
                  {tab === 'live' && (
                    <span style={{ display: 'inline-block', width: 6, height: 6, background: '#22c55e', borderRadius: '50%', marginRight: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  )}
                  {tab === 'global' ? 'Global Rankings' : tab === 'my-contests' ? 'My Contests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'global' ? (
              <div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    Loading global rankings…
                  </div>
                ) : globalLeaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                    <Trophy size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontSize: 16, fontWeight: 600 }}>Leaderboard is empty</div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', padding: 24 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#e2e8f0', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Crown size={20} color="#fbbf24" /> Global Weekly Leaderboard
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {globalLeaderboard.map((entry) => (
                        <div key={entry._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '14px 20px',
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}>
                          
                          <RankBadge rank={entry.rank} />

                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #818cf8, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'black', color: '#fff' }}>
                              {entry.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <Link to={`/profile/${entry._id}`} style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', textDecoration: 'none' }}>
                                {entry.name}
                              </Link>
                              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                                  Lvl {entry.level}
                                </span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                  🏆 {entry.solvedCount} solved
                                </span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                  🏅 {entry.badgeCount} badges
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#fbbf24' }}>{entry.xp}</div>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total XP</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
                      <div style={{ fontSize: 13, marginTop: 8 }}>
                        {activeTab === 'my-contests' 
                          ? "You haven't created or joined any custom contests yet." 
                          : "Check back soon for upcoming contests!"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {contests.map(c => (
                        <ContestCard 
                          key={c._id} 
                          contest={c}
                          onJoin={() => joinContest(c._id)}
                          onLeaderboard={() => fetchLeaderboard(c._id)}
                          onEnter={() => enterContest(c._id)}
                          joining={joining === c._id} 
                        />
                      ))}
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
            )}
          </div>
        )}

      </div>

      {/* ========================================================
         MODAL: JOIN PRIVATE CONTEST
         ======================================================== */}
      {showJoinModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#131326', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: 28, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>Join Private Contest</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0' }}>Enter the unique 6-character code shared by your friend to register and compete.</p>
            
            <input 
              type="text" 
              maxLength={6}
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value)}
              placeholder="E.g. A3C9E2"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', outline: 'none', marginBottom: 20 }}
            />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowJoinModal(false); setJoinCodeInput(''); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => joinByCode(joinCodeInput)}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #818cf8, #ec4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Join Contest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
         MODAL: CREATE CUSTOM CONTEST
         ======================================================== */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, overflowY: 'auto', padding: '40px 20px' }}>
          <form onSubmit={handleCreateContest} style={{ width: '100%', maxWidth: 580, background: '#131326', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: 32, boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>Create Custom Contest</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px 0' }}>Setup your own coding clash, select problems, and get a shareable link.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Contest Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="E.g. Weekend Algorithmic Battle"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Description</label>
                <textarea 
                  placeholder="Optional description of the contest rules or context..."
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  style={{ width: '100%', height: 60, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={createStartTime}
                    onChange={e => setCreateStartTime(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>End Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={createEndTime}
                    onChange={e => setCreateEndTime(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Difficulty</label>
                  <select 
                    value={createDifficulty} 
                    onChange={e => setCreateDifficulty(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>Privacy</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', height: 42 }}>
                    <input 
                      type="checkbox" 
                      checked={createIsPrivate}
                      onChange={e => setCreateIsPrivate(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: '#fff' }}>Make Private (Join code required)</span>
                  </label>
                </div>
              </div>

              {/* Problem Selector List */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  <span>Select Problems ({createChallenges.length} selected)</span>
                  <input 
                    type="text"
                    placeholder="Search problems..."
                    value={challengeSearch}
                    onChange={e => setChallengeSearch(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '2px 8px', outline: 'none', width: 150 }}
                  />
                </label>

                <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, background: 'rgba(0,0,0,0.2)' }}>
                  {challengesList.filter(ch => 
                    ch.title.toLowerCase().includes(challengeSearch.toLowerCase()) ||
                    ch.category.toLowerCase().includes(challengeSearch.toLowerCase())
                  ).length > 0 ? (
                    challengesList.filter(ch => 
                      ch.title.toLowerCase().includes(challengeSearch.toLowerCase()) ||
                      ch.category.toLowerCase().includes(challengeSearch.toLowerCase())
                    ).map(ch => {
                      const isChecked = createChallenges.includes(ch._id);
                      return (
                        <label key={ch._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, background: isChecked ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s' }}>
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCreateChallenges(prev => prev.filter(id => id !== ch._id));
                              } else {
                                setCreateChallenges(prev => [...prev, ch._id]);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{ch.title}</span>
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>({ch.category} · {ch.difficulty})</span>
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div style={{ padding: 12, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No challenges match search</div>
                  )}
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateTitle('');
                  setCreateDesc('');
                  setCreateStartTime('');
                  setCreateEndTime('');
                  setCreateDifficulty('mixed');
                  setCreateIsPrivate(true);
                  setCreateChallenges([]);
                }}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #818cf8, #ec4899)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Create Contest
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

function ContestCard({ contest: c, onJoin, onLeaderboard, onEnter, joining }) {
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
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={onEnter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13 }}>{type.icon}</span>
            <span style={{ fontSize: 12, color: type.color, fontWeight: 700 }}>{type.label}</span>
            <span style={{ fontSize: 11, color: status.color, background: status.bg, padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
              {isLive && <span style={{ display: 'inline-block', width: 5, height: 5, background: '#22c55e', borderRadius: '50%', marginRight: 5, verticalAlign: 'middle' }} />}
              {status.label}
            </span>
            <span style={{ fontSize: 11, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 99 }}>{c.difficulty}</span>
            {c.joinCode && (
              <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 99, fontWeight: 'bold' }}>Private: {c.joinCode}</span>
            )}
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
          <button onClick={onEnter}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Enter Arena
          </button>
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
