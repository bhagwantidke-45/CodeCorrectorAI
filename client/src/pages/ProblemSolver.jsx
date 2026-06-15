import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Play, RotateCcw, CheckCircle, XCircle, Clock, Zap,
  Brain, ChevronDown, ChevronUp, Lightbulb, Eye, EyeOff,
  Trophy, ArrowLeft, Code2, Loader2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = 'http://localhost:5000/api';

const LANG_OPTIONS = [
  { value: 'javascript', label: 'JavaScript', monaco: 'javascript' },
  { value: 'python',     label: 'Python',     monaco: 'python' },
  { value: 'java',       label: 'Java',        monaco: 'java' },
  { value: 'cpp',        label: 'C++',         monaco: 'cpp' },
];

const DIFFICULTY_COLOR = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' };

const DRACULA_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff79c6' },
    { token: 'identifier', foreground: 'f8f8f2' },
    { token: 'string', foreground: 'f1fa8c' },
    { token: 'number', foreground: 'bd93f9' },
    { token: 'operator', foreground: 'ff79c6' },
    { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
    { token: 'function', foreground: '50fa7b' },
  ],
  colors: {
    'editor.background': '#282a36',
    'editor.foreground': '#f8f8f2',
    'editor.lineHighlightBackground': '#343746',
    'editor.selectionBackground': '#44475a',
    'editorCursor.foreground': '#f8f8f0',
  }
};

const MONOKAI_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'f92672' },
    { token: 'identifier', foreground: 'f8f8f2' },
    { token: 'string', foreground: 'e6db74' },
    { token: 'number', foreground: 'ae81ff' },
    { token: 'operator', foreground: 'f92672' },
    { token: 'type', foreground: '66d9ef', fontStyle: 'italic' },
    { token: 'function', foreground: 'a6e22e' },
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#f8f8f2',
    'editor.lineHighlightBackground': '#3e3d32',
    'editor.selectionBackground': '#49483e',
    'editorCursor.foreground': '#f8f8f0',
  }
};

const GITHUB_DARK_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'ff7b72' },
    { token: 'identifier', foreground: 'c9d1d9' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'number', foreground: '79c0ff' },
    { token: 'operator', foreground: 'ff7b72' },
    { token: 'type', foreground: 'ffa657' },
    { token: 'function', foreground: 'd2a8ff' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.lineHighlightBackground': '#161b22',
    'editor.selectionBackground': '#282e38',
    'editorCursor.foreground': '#c9d1d9',
  }
};

export default function ProblemSolver() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [challenge, setChallenge]   = useState(location.state?.challenge || null);
  const [language, setLanguage]     = useState('javascript');
  const [code, setCode]             = useState('');
  const [result, setResult]         = useState(null);
  const [review, setReview]         = useState(null);
  const [running, setRunning]       = useState(false);
  const [reviewing, setReviewing]   = useState(false);
  const [activeTab, setActiveTab]   = useState('description'); // description | hints | solution
  const [showHints, setShowHints]   = useState(false);
  const [hintIdx, setHintIdx]       = useState(0);
  const [timer, setTimer]           = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Gemini AI Hint states
  const [aiHints, setAiHints] = useState({ 1: null, 2: null, 3: null });
  const [loadingHint, setLoadingHint] = useState(false);
  const [selectedHintLevel, setSelectedHintLevel] = useState(1);

  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem('editor-theme') || 'vs-dark';
  });

  const changeTheme = (newTheme) => {
    setEditorTheme(newTheme);
    localStorage.setItem('editor-theme', newTheme);
  };

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('dracula', DRACULA_THEME);
    monaco.editor.defineTheme('monokai', MONOKAI_THEME);
    monaco.editor.defineTheme('github-dark', GITHUB_DARK_THEME);
  };

  const token = localStorage.getItem('token');
  const authHeader = { Authorization: `Bearer ${token}` };


  // Fetch challenge by ID if not passed via state
  useEffect(() => {
    if (id && !challenge) {
      axios.get(`${API}/challenges/${id}`)
        .then(res => { setChallenge(res.data.data); })
        .catch(() => toast.error('Challenge not found'));
    }
  }, [id]);

  // Set starter code when challenge or language changes
  useEffect(() => {
    if (challenge?.starterCode?.[language]) {
      setCode(challenge.starterCode[language]);
    } else if (challenge) {
      setCode(`// Write your ${language} solution here\n`);
    }
  }, [challenge, language]);

  // Timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const runCode = async () => {
    if (!code.trim()) return toast.error('Write some code first!');
    if (!challenge) return;
    setRunning(true);
    setResult(null);
    if (!timerActive) setTimerActive(true);
    try {
      const res = await axios.post(
        `${API}/challenges/${challenge._id || id}/submit`,
        { code, language },
        { headers: authHeader }
      );
      setResult(res.data.data);
      if (res.data.data.passed) {
        toast.success(`✅ All tests passed! +${res.data.data.xpEarned} XP`);
        setTimerActive(false);
      } else {
        toast.error(`${res.data.data.passedCount}/${res.data.data.totalCount} tests passed`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Execution failed');
    } finally {
      setRunning(false);
    }
  };

  const aiReview = async () => {
    if (!code.trim()) return toast.error('Write some code first!');
    setReviewing(true);
    try {
      const res = await axios.post(
        `${API}/challenges/${challenge._id || id}/review`,
        { code, language },
        { headers: authHeader }
      );
      setReview(res.data.data);
      toast.success('AI review complete!');
    } catch (err) {
      toast.error('Review failed');
    } finally {
      setReviewing(false);
    }
  };

  const fetchAiHint = async () => {
    if (!token) return toast.error('Please login to request AI hints.');
    if (!code.trim()) return toast.error('Write or paste some code first so the AI can analyze it.');
    setLoadingHint(true);
    try {
      const res = await axios.post(
        `${API}/challenges/${challenge._id || id}/hint`,
        { code, language, level: selectedHintLevel },
        { headers: authHeader }
      );
      setAiHints(prev => ({
        ...prev,
        [selectedHintLevel]: res.data.data
      }));
      toast.success('AI hint generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI hint.');
    } finally {
      setLoadingHint(false);
    }
  };

  const resetCode = () => {
    if (challenge?.starterCode?.[language]) {
      setCode(challenge.starterCode[language]);
    } else {
      setCode(`// Write your ${language} solution here\n`);
    }
    setResult(null);
    setReview(null);
    setAiHints({ 1: null, 2: null, 3: null });
    setTimer(0);
    setTimerActive(false);
  };


  if (!challenge) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a', color: '#94a3b8', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} color="#818cf8" />
        <p>Loading challenge…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const diffColor = DIFFICULTY_COLOR[challenge.difficulty] || '#f59e0b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0d0d1a', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#13131f', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
        <button onClick={() => navigate('/practice')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{challenge.title}</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: diffColor, background: `${diffColor}20`, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
            {challenge.difficulty?.charAt(0).toUpperCase() + challenge.difficulty?.slice(1)}
          </span>
        </div>

        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: timerActive ? '#f59e0b' : '#64748b', fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>
          <Clock size={14} />
          {formatTime(timer)}
        </div>

        {/* Language Selector */}
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        {/* Theme Selector */}
        <select value={editorTheme} onChange={e => changeTheme(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e2e8f0', padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
          <option value="vs-dark">VS Dark</option>
          <option value="monokai">Monokai</option>
          <option value="dracula">Dracula</option>
          <option value="github-dark">GitHub Dark</option>
        </select>

        <button onClick={resetCode}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          <RotateCcw size={14} /> Reset
        </button>

        <button onClick={aiReview} disabled={reviewing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc', padding: '7px 14px', borderRadius: 8, cursor: reviewing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
          {reviewing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Brain size={14} />}
          AI Review
        </button>

        <button onClick={runCode} disabled={running}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: running ? 'rgba(34,197,94,0.3)' : 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: 8, cursor: running ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
          {running ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={14} />}
          {running ? 'Running…' : 'Run & Submit'}
        </button>
      </div>

      {/* Main Split View */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel — Problem */}
        <div style={{ width: '42%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px', background: '#13131f', flexShrink: 0 }}>
            {['description', 'hints', 'ai-review'].map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#818cf8' : 'transparent'}`, color: activeTab === tab ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                {tab === 'ai-review' ? 'AI Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
            {activeTab === 'description' && (
              <div>
                {/* Description */}
                <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 24, whiteSpace: 'pre-wrap' }}>
                  {challenge.description}
                </div>

                {/* Examples */}
                {challenge.examples?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Examples</h3>
                    {challenge.examples.map((ex, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, marginBottom: 10, fontFamily: 'monospace', fontSize: 13 }}>
                        <div style={{ color: '#94a3b8', marginBottom: 4 }}><span style={{ color: '#818cf8' }}>Input:</span> {ex.input}</div>
                        <div style={{ color: '#94a3b8', marginBottom: 4 }}><span style={{ color: '#22c55e' }}>Output:</span> {ex.output}</div>
                        {ex.explanation && <div style={{ color: '#64748b' }}><span style={{ color: '#f59e0b' }}>Explanation:</span> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {challenge.constraints?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Constraints</h3>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {challenge.constraints.map((c, i) => (
                        <li key={i} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4, fontFamily: 'monospace' }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tags & Companies */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {challenge.tags?.map(t => <span key={t} style={{ fontSize: 12, color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: 99 }}>{t}</span>)}
                  {challenge.companies?.map(c => <span key={c} style={{ fontSize: 12, color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: 99 }}>🏢 {c}</span>)}
                </div>
              </div>
            )}

            {activeTab === 'hints' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Static Hints */}
                {challenge.hints?.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Problem Hints</h3>
                    {challenge.hints.slice(0, hintIdx + 1).map((h, i) => (
                      <div key={i} style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 4 }}>Standard Hint {i + 1}</div>
                        <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>{h}</div>
                      </div>
                    ))}
                    {hintIdx < (challenge.hints?.length || 0) - 1 && (
                      <button onClick={() => setHintIdx(h => h + 1)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', background: 'transparent', color: '#f59e0b', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Lightbulb size={13} /> Show Next Hint
                      </button>
                    )}
                  </div>
                )}

                {/* Gemini AI Coach Hints */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Brain size={18} color="#c084fc" />
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>Gemini AI Debugging Coach</h3>
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                    Get real-time feedback on your current code draft. Choose a level of guidance:
                  </p>

                  {/* Level Selector Tabs */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 8 }}>
                    {[
                      { val: 1, label: '1. Nudge', desc: 'Find logic/boundary bugs' },
                      { val: 2, label: '2. Approach', desc: 'Conceptual advice' },
                      { val: 3, label: '3. Solution', desc: 'Code logic snippet' },
                    ].map(lvl => (
                      <button key={lvl.val}
                        onClick={() => setSelectedHintLevel(lvl.val)}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: selectedHintLevel === lvl.val ? 'rgba(168,85,247,0.15)' : 'transparent',
                          color: selectedHintLevel === lvl.val ? '#c084fc' : '#64748b',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}>
                        {lvl.label}
                      </button>
                    ))}
                  </div>

                  {/* Hint Request Button */}
                  <button onClick={fetchAiHint} disabled={loadingHint}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: '1px solid rgba(168,85,247,0.4)',
                      background: 'rgba(168,85,247,0.08)',
                      color: '#c084fc',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: loadingHint ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,85,247,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(168,85,247,0.08)'}>
                    {loadingHint ? (
                      <>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing code draft…
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        Get AI {selectedHintLevel === 1 ? 'Nudge' : selectedHintLevel === 2 ? 'Approach' : 'Snippet'}
                      </>
                    )}
                  </button>

                  {/* Render Fetched AI Hint */}
                  {aiHints[selectedHintLevel] && (
                    <div style={{
                      marginTop: 16,
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(99,102,241,0.05) 100%)',
                      border: '1px solid rgba(168,85,247,0.3)',
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: '0 8px 32px 0 rgba(168,85,247,0.05)'
                    }}>
                      <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        Gemini Hint Response
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {aiHints[selectedHintLevel].hint}
                      </p>
                      
                      {aiHints[selectedHintLevel].codeSnippet && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                            Code Reference
                          </div>
                          <pre style={{
                            margin: 0,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8,
                            padding: 12,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: '#a5f3fc',
                            overflowX: 'auto',
                            lineHeight: 1.5
                          }}>
                            {aiHints[selectedHintLevel].codeSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeTab === 'ai-review' && review && (
              <div>
                {/* Score */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
                  <ScoreCard label="Score" value={`${review.score}/100`} color="#818cf8" />
                  <ScoreCard label="Correctness" value={review.correctness} color={review.correctness === 'correct' ? '#22c55e' : review.correctness === 'partial' ? '#f59e0b' : '#ef4444'} />
                  <ScoreCard label="Time" value={review.timeComplexity} color="#06b6d4" />
                  <ScoreCard label="Space" value={review.spaceComplexity} color="#8b5cf6" />
                </div>

                {/* Strengths */}
                {review.strengths?.length > 0 && (
                  <ReviewSection title="✅ Strengths" color="#22c55e" items={review.strengths} />
                )}

                {/* Improvements */}
                {review.improvements?.length > 0 && (
                  <ReviewSection title="⚡ Improvements" color="#f59e0b" items={review.improvements} />
                )}

                {/* Explanation */}
                {review.explanation && (
                  <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 700, marginBottom: 8 }}>💡 Optimal Approach</div>
                    <p style={{ color: '#cbd5e1', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{review.explanation}</p>
                  </div>
                )}

                {/* Corrected Code */}
                {review.correctedCode && (
                  <div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Corrected Code</div>
                    <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 16, fontSize: 12, color: '#a5f3fc', overflow: 'auto', fontFamily: '"Fira Code", monospace', lineHeight: 1.6 }}>
                      {review.correctedCode}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai-review' && !review && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <Brain size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Click <strong style={{ color: '#c084fc' }}>AI Review</strong> above to get feedback on your code</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Editor + Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Monaco Editor */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Editor
              height="100%"
              language={LANG_OPTIONS.find(l => l.value === language)?.monaco || 'javascript'}
              value={code}
              onChange={val => setCode(val || '')}
              theme={editorTheme}
              beforeMount={handleEditorWillMount}
              options={{
                fontSize: 14,
                fontFamily: '"Fira Code", "Cascadia Code", monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: true,
                renderLineHighlight: 'all',
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                tabSize: 2,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>

          {/* Test Results Panel */}
          {result && (
            <div style={{ maxHeight: '42%', overflow: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#13131f', flexShrink: 0 }}>
              {/* Summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {result.passed
                  ? <CheckCircle size={18} color="#22c55e" />
                  : <XCircle size={18} color="#ef4444" />}
                <span style={{ fontWeight: 700, color: result.passed ? '#22c55e' : '#ef4444', fontSize: 14 }}>
                  {result.passed ? '🎉 All Tests Passed!' : `${result.passedCount}/${result.totalCount} Tests Passed`}
                </span>
                {result.xpEarned > 0 && (
                  <span style={{ fontSize: 13, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>
                    +{result.xpEarned} XP
                  </span>
                )}
                {result.timeComplexity && <span style={{ fontSize: 12, color: '#64748b' }}>⏱ {result.timeComplexity}</span>}
                {result.spaceComplexity && <span style={{ fontSize: 12, color: '#64748b' }}>💾 {result.spaceComplexity}</span>}
              </div>

              {/* Feedback */}
              {result.feedback && (
                <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                  {result.feedback}
                </div>
              )}

              {/* Test Case Results */}
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.testResults?.map((tr, i) => (
                  <div key={i} style={{ background: tr.passed ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${tr.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: tr.passed ? 0 : 8 }}>
                      {tr.passed ? <CheckCircle size={13} color="#22c55e" /> : <XCircle size={13} color="#ef4444" />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: tr.passed ? '#22c55e' : '#ef4444' }}>Test Case {tr.testCase}</span>
                    </div>
                    {!tr.passed && (
                      <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        <div style={{ color: '#94a3b8' }}>Input: <span style={{ color: '#e2e8f0' }}>{tr.input}</span></div>
                        <div style={{ color: '#94a3b8' }}>Expected: <span style={{ color: '#22c55e' }}>{tr.expectedOutput}</span></div>
                        <div style={{ color: '#94a3b8' }}>Got: <span style={{ color: '#ef4444' }}>{tr.actualOutput}</span></div>
                        {tr.error && <div style={{ color: '#f87171', marginTop: 4 }}>Error: {tr.error}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ScoreCard({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function ReviewSection({ title, color, items }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
      <div style={{ fontSize: 13, color, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 4, lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
