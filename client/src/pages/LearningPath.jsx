import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, Lock, ChevronRight, Code2, Brain,
  Layers, Target, Zap, Star, TrendingUp, Award, PlayCircle, BarChart3,
  LayoutDashboard, X, ExternalLink, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import toast from 'react-hot-toast';

// Static roadmap data
const ROADMAPS = [
  {
    id: 'dsa-beginner',
    title: 'DSA Beginner',
    description: 'Master the fundamentals of Data Structures & Algorithms from scratch',
    icon: '🌱',
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #166534, #14532d)',
    totalTopics: 12,
    difficulty: 'Beginner',
    estimatedWeeks: 8,
    topics: [
      { id: 'arrays',       label: 'Arrays & Strings',       desc: 'Learn arrays, manipulation, and string algorithms', category: 'arrays',     icon: '📦', problems: 15 },
      { id: 'two-pointers', label: 'Two Pointers',           desc: 'Efficient pair-finding techniques',                category: 'two-pointers', icon: '👆', problems: 10 },
      { id: 'hashing',      label: 'Hashing & Hash Maps',   desc: 'O(1) lookups with hash tables',                   category: 'hashing',    icon: '🔑', problems: 12 },
      { id: 'recursion',    label: 'Recursion Basics',       desc: 'Think recursively, solve elegantly',              category: 'recursion',  icon: '🔄', problems: 10 },
      { id: 'sorting',      label: 'Sorting Algorithms',     desc: 'Bubble, Merge, Quick and more',                   category: 'sorting',    icon: '📊', problems: 8  },
      { id: 'binary-search','label': 'Binary Search',        desc: 'Divide and conquer for sorted data',              category: 'binary-search', icon: '🔍', problems: 12 },
      { id: 'linked-lists', label: 'Linked Lists',           desc: 'Nodes, pointers, and traversal',                  category: 'linked-lists', icon: '🔗', problems: 12 },
      { id: 'stacks',       label: 'Stacks & Queues',        desc: 'LIFO/FIFO data structures',                       category: 'stack-queue', icon: '📚', problems: 10 },
      { id: 'trees',        label: 'Binary Trees',           desc: 'Tree traversals and BST operations',              category: 'trees',      icon: '🌳', problems: 15 },
      { id: 'graphs',       label: 'Graph Basics',           desc: 'BFS, DFS, and connectivity',                      category: 'graphs',     icon: '🕸️', problems: 12 },
      { id: 'dp-intro',     label: 'Dynamic Programming I',  desc: 'Memoization and tabulation basics',               category: 'dynamic-programming', icon: '🎯', problems: 14 },
      { id: 'greedy',       label: 'Greedy Algorithms',      desc: 'Make the optimal choice at each step',            category: 'greedy',     icon: '💡', problems: 8  },
    ],
  },
  {
    id: 'dsa-intermediate',
    title: 'DSA Intermediate',
    description: 'Level up with advanced data structures and complex problem patterns',
    icon: '⚡',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #78350f, #451a03)',
    totalTopics: 10,
    difficulty: 'Intermediate',
    estimatedWeeks: 10,
    topics: [
      { id: 'sliding-window', label: 'Sliding Window',       desc: 'Efficient subarray/substring techniques',         category: 'sliding-window', icon: '🪟', problems: 12 },
      { id: 'heap',           label: 'Heaps & Priority Queue',desc: 'Min-heap, max-heap, and kth-element problems',   category: 'heap',        icon: '⛰️', problems: 10 },
      { id: 'trie',           label: 'Tries',                 desc: 'Prefix trees for string problems',               category: 'trie',        icon: '🌲', problems: 8  },
      { id: 'graphs-adv',     label: 'Advanced Graphs',       desc: 'Dijkstra, Bellman-Ford, Union-Find',             category: 'graphs',      icon: '🗺️', problems: 14 },
      { id: 'dp-adv',         label: 'Dynamic Programming II',desc: 'Knapsack, LCS, interval DP',                    category: 'dynamic-programming', icon: '🔢', problems: 16 },
      { id: 'backtracking',   label: 'Backtracking',          desc: 'Permutations, combinations, sudoku',             category: 'backtracking', icon: '↩️', problems: 12 },
      { id: 'bit-manip',      label: 'Bit Manipulation',      desc: 'XOR tricks and bitwise operations',              category: 'bit-manipulation', icon: '🔢', problems: 8 },
      { id: 'math-adv',       label: 'Math & Number Theory',  desc: 'Primes, GCD, modular arithmetic',                category: 'math',        icon: '➕', problems: 10 },
      { id: 'string-adv',     label: 'Advanced Strings',      desc: 'KMP, Rabin-Karp, Z-algorithm',                   category: 'strings',     icon: '📝', problems: 10 },
      { id: 'design',         label: 'System Design Patterns',desc: 'LRU cache, rate limiter, file system',           category: 'other',       icon: '🏗️', problems: 8  },
    ],
  },
  {
    id: 'interview-prep',
    title: 'Interview Prep',
    description: 'Crack top tech company interviews with curated problem sets',
    icon: '🎯',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #312e81, #1e1b4b)',
    totalTopics: 8,
    difficulty: 'Mixed',
    estimatedWeeks: 6,
    topics: [
      { id: 'faang-arrays',   label: 'FAANG Arrays',          desc: 'Top array problems from FAANG companies',        category: 'arrays',      icon: '📦', problems: 20, companies: ['Google', 'Meta', 'Amazon'] },
      { id: 'faang-trees',    label: 'FAANG Trees',           desc: 'Tree problems asked at top companies',           category: 'trees',       icon: '🌳', problems: 15, companies: ['Amazon', 'Microsoft'] },
      { id: 'faang-dp',       label: 'FAANG DP',              desc: 'Dynamic programming favorites',                  category: 'dynamic-programming', icon: '🎯', problems: 18, companies: ['Google', 'Meta'] },
      { id: 'faang-graphs',   label: 'FAANG Graphs',          desc: 'Graph problems from top interviews',             category: 'graphs',      icon: '🕸️', problems: 12, companies: ['Google', 'Uber'] },
      { id: 'system-design',  label: 'System Design',         desc: 'Design scalable systems',                        category: 'other',       icon: '🏗️', problems: 8  },
      { id: 'behavioral',     label: 'Behavioral Prep',       desc: 'STAR method and common questions',               category: 'other',       icon: '🎤', problems: 0  },
      { id: 'sql-db',         label: 'SQL & Databases',       desc: 'Query optimization and schema design',           category: 'other',       icon: '🗄️', problems: 10 },
      { id: 'mock-interviews','label': 'Mock Interviews',      desc: 'Full timed interview simulations',               category: 'other',       icon: '⏱️', problems: 5  },
    ],
  },
  {
    id: 'competitive-prog',
    title: 'Competitive Programming',
    description: 'Prepare for Codeforces, LeetCode contests and competitive programming',
    icon: '🏆',
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #831843, #500724)',
    totalTopics: 9,
    difficulty: 'Advanced',
    estimatedWeeks: 16,
    topics: [
      { id: 'segment-tree', label: 'Segment Trees',         desc: 'Range query and point update',          category: 'trees',     icon: '🌲', problems: 10 },
      { id: 'fenwick',      label: 'Fenwick Trees (BIT)',   desc: 'Binary indexed trees for prefix sums',  category: 'trees',     icon: '📊', problems: 8  },
      { id: 'flows',        label: 'Network Flow',         desc: 'Max flow, min cut algorithms',          category: 'graphs',    icon: '🌊', problems: 8  },
      { id: 'game-theory',  label: 'Game Theory',          desc: 'Nim, Grundy numbers, Sprague-Grundy',   category: 'math',      icon: '🎮', problems: 8  },
      { id: 'dp-opt',       label: 'DP Optimizations',     desc: 'Divide & conquer DP, CHT, Li Chao',     category: 'dynamic-programming', icon: '⚡', problems: 10 },
      { id: 'string-comp',  label: 'String Algorithms',    desc: 'Aho-Corasick, Suffix Array, SA-IS',     category: 'strings',   icon: '📝', problems: 8  },
      { id: 'geometry',     label: 'Computational Geometry',desc: 'Convex hull, line intersection',       category: 'math',      icon: '📐', problems: 6  },
      { id: 'number-theory','label': 'Number Theory',       desc: 'FFT, NTT, CRT, advanced primes',        category: 'math',      icon: '🔢', problems: 8  },
      { id: 'treap',        label: 'Advanced Trees',        desc: 'Treap, splay tree, link-cut tree',      category: 'trees',     icon: '🌳', problems: 6  },
    ],
  },
];

export default function LearningPath() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);
  const [userProgress, setUserProgress]       = useState(null);
  const [completedTopics, setCompleted]        = useState(new Set());
  const [githubData, setGithubData]            = useState(null);

  // Inline challenge panel state
  const [selectedTopic, setSelectedTopic]       = useState(null); // topic object
  const [topicChallenges, setTopicChallenges]   = useState([]);
  const [topicLoading, setTopicLoading]         = useState(false);

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (user) fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    try {
      const [statsRes, ghRes] = await Promise.allSettled([
        api.get('/challenges/stats'),
        api.get('/github/profile'),
      ]);
      if (statsRes.status === 'fulfilled') setUserProgress(statsRes.value.data.data);
      if (ghRes.status === 'fulfilled' && ghRes.value.data.synced) setGithubData(ghRes.value.data.data);
    } catch { /* skip */ }
  };

  const markTopicDone = (topicId) => {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId); else next.add(topicId);
      return next;
    });
    toast.success('Progress updated!');
  };

  const openTopicChallenges = async (topic) => {
    setSelectedTopic(topic);
    setTopicChallenges([]);
    setTopicLoading(true);
    try {
      const params = { limit: 20 };
      if (topic.category && topic.category !== 'other') params.category = topic.category;
      if (topic.companies?.length) params.company = topic.companies[0];
      const res = await api.get('/challenges', { params });
      setTopicChallenges(res.data.data || []);
    } catch {
      setTopicChallenges([]);
      toast.error('Could not load challenges for this topic');
    } finally {
      setTopicLoading(false);
    }
  };

  const startTopic = (topic) => {
    navigate('/practice', { state: { category: topic.category, companies: topic.companies } });
  };

  if (selectedRoadmap) {
    const rm = ROADMAPS.find(r => r.id === selectedRoadmap);
    const done = rm.topics.filter(t => completedTopics.has(t.id)).length;
    const pct  = Math.round((done / rm.topics.length) * 100);

    return (
      <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div style={{ background: rm.gradient, borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '28px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => { setSelectedRoadmap(null); setSelectedTopic(null); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Back to Roadmaps
            </button>
            <button onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <LayoutDashboard size={14} /> Dashboard
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 40 }}>{rm.icon}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>{rm.title}</h1>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{rm.description}</p>
            </div>
          </div>
          {/* Progress */}
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#fff', borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, minWidth: 60 }}>{done}/{rm.topics.length} done</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{rm.estimatedWeeks} weeks</span>
          </div>
        </div>

        {/* Topic List + Inline Challenge Panel */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 40px' }}>
          {rm.topics.map((topic, idx) => {
            const isDone  = completedTopics.has(topic.id);
            const isSelected = selectedTopic?.id === topic.id;
            return (
              <div key={topic.id} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                {/* Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: isDone ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', border: `2px solid ${isDone ? '#22c55e' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                    onClick={() => markTopicDone(topic.id)}>
                    {isDone ? '✓' : topic.icon}
                  </div>
                  {idx < rm.topics.length - 1 && (
                    <div style={{ width: 2, height: isSelected ? 'auto' : 32, minHeight: 32, background: isDone ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
                  )}
                </div>

                {/* Card */}
                <div style={{ flex: 1, background: isSelected ? 'rgba(99,102,241,0.08)' : isDone ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : isDone ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '16px 20px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? '#818cf8' : isDone ? '#22c55e' : '#e2e8f0' }}>{topic.label}</span>
                        {isDone && <CheckCircle2 size={15} color="#22c55e" />}
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{topic.desc}</p>
                      {topic.companies && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                          {topic.companies.map(c => <span key={c} style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: 99 }}>{c}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {topic.problems > 0 && (
                        <span style={{ fontSize: 12, color: '#64748b' }}>{topic.problems} problems</span>
                      )}
                      <button
                        onClick={() => isSelected ? setSelectedTopic(null) : openTopicChallenges(topic)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: isSelected ? '1px solid rgba(99,102,241,0.5)' : 'none', background: isSelected ? 'rgba(99,102,241,0.2)' : isDone ? 'rgba(34,197,94,0.2)' : `rgba(${rm.color.includes('22c') ? '34,197,94' : rm.color.includes('f59') ? '245,158,11' : rm.color.includes('818') ? '129,140,248' : '236,72,153'},0.2)`, color: isSelected ? '#818cf8' : isDone ? '#22c55e' : rm.color, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                        {isSelected ? <><X size={13} /> Close</> : <><PlayCircle size={13} /> {isDone ? 'Review' : 'Practice'}</>}
                      </button>
                    </div>
                  </div>

                  {/* Inline Challenge Panel */}
                  {isSelected && (
                    <div style={{ marginTop: 16, borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>📚 {topic.label} — Coding Questions</span>
                        <button
                          onClick={() => navigate('/practice', { state: { category: topic.category } })}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 600 }}>
                          <ExternalLink size={12} /> See All in Practice
                        </button>
                      </div>

                      {topicLoading ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                          <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                          Loading challenges…
                        </div>
                      ) : topicChallenges.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                          <Code2 size={36} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
                          <div style={{ fontSize: 14, fontWeight: 600 }}>No challenges found for this topic yet</div>
                          <div style={{ fontSize: 12, marginTop: 6 }}>Try the AI Generator on the Practice page to create some!</div>
                          <button
                            onClick={() => navigate('/practice')}
                            style={{ marginTop: 12, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            Go to Practice
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {topicChallenges.map((ch, i) => {
                            const DIFF = { easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }, medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }, hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' } };
                            const d = DIFF[ch.difficulty] || DIFF.medium;
                            return (
                              <div key={ch._id}
                                onClick={() => navigate(`/solve/${ch._id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '11px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                                <span style={{ width: 24, textAlign: 'center', color: '#475569', fontSize: 12 }}>{i + 1}</span>
                                {ch.solved && <CheckCircle2 size={14} color="#22c55e" style={{ flexShrink: 0 }} />}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{ch.title}</div>
                                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{ch.category} • {ch.tags?.slice(0, 2).join(', ')}</div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: d.color, background: d.bg, padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>
                                  {ch.difficulty?.charAt(0).toUpperCase() + ch.difficulty?.slice(1)}
                                </span>
                                <div style={{ textAlign: 'right', minWidth: 40 }}>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>+{ch.points}</div>
                                  <div style={{ fontSize: 9, color: '#475569' }}>XP</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f1a0f 0%, #0a1628 50%, #1a0f2e 100%)', borderBottom: '1px solid rgba(99,102,241,0.2)', padding: '32px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, #22c55e, #818cf8)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, background: 'linear-gradient(135deg, #22c55e, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Personalized Learning Paths
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#94a3b8' }}>Structured roadmaps to master coding, one topic at a time</p>
              </div>
            </div>
            <button onClick={() => navigate('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8', padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}>
              <LayoutDashboard size={14} /> Dashboard
            </button>
          </div>

          {/* User Progress Summary */}
          {userProgress && (
            <div style={{ display: 'flex', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Problems Solved', value: userProgress.totalSolved, icon: '✅', color: '#22c55e' },
                { label: 'XP Earned',       value: `${userProgress.xp} XP`,  icon: '⚡', color: '#f59e0b' },
                { label: 'Level',           value: `Lv.${userProgress.level}`,icon: '🏆', color: '#818cf8' },
                { label: 'Streak',          value: `${userProgress.challengeStreak} days`, icon: '🔥', color: '#ef4444' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 18px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Roadmap Cards */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1 }}>Choose Your Path</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
          {ROADMAPS.map(rm => {
            const done = rm.topics.filter(t => completedTopics.has(t.id)).length;
            const pct  = Math.round((done / rm.topics.length) * 100);
            return (
              <div key={rm.id}
                onClick={() => setSelectedRoadmap(rm.id)}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, cursor: 'pointer', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = rm.color + '60'; e.currentTarget.style.boxShadow = `0 16px 40px ${rm.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}>

                {/* Background glow */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: `radial-gradient(circle, ${rm.color}20 0%, transparent 70%)`, pointerEvents: 'none' }} />

                <div style={{ fontSize: 40, marginBottom: 16 }}>{rm.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: rm.color }}>{rm.title}</h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{rm.description}</p>

                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>📚 {rm.totalTopics} topics</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>⏱ {rm.estimatedWeeks} weeks</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>🎯 {rm.difficulty}</span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                    <span>Progress</span><span>{done}/{rm.topics.length}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: rm.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: rm.color, fontWeight: 700 }}>{pct === 0 ? 'Start Learning' : pct === 100 ? '✅ Completed' : `${pct}% Complete`}</span>
                  <ChevronRight size={18} color={rm.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* GitHub Integration Section */}
        <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: '#1f2937', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⚙</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>GitHub Integration</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  {githubData ? `Connected: @${githubData.username} • ${githubData.publicRepos} repos • ${githubData.followers} followers` : 'Sync your GitHub to track repositories and coding activity'}
                </p>
              </div>
            </div>
            {!githubData ? (
              <button onClick={() => navigate('/profile')}
                style={{ padding: '10px 24px', borderRadius: 10, background: '#1f2937', color: '#e2e8f0', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                ⚙ Connect GitHub
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {githubData.repos?.slice(0, 3).map(r => (
                  <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', textDecoration: 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#818cf8' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{r.language} • ⭐ {r.stars}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
