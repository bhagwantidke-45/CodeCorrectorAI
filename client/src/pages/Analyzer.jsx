import { useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import CodeEditor from '../components/CodeEditor.jsx';
import CodeComparison from '../components/CodeComparison.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import SuggestionCard from '../components/SuggestionCard.jsx';
import ComplexityBadge from '../components/ComplexityBadge.jsx';
import SeverityScore from '../components/SeverityScore.jsx';
import FileUpload from '../components/FileUpload.jsx';
import LanguageSelector from '../components/LanguageSelector.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getBaseURL } from '../utils/api.js';
import toast from 'react-hot-toast';
import {
  Zap, Upload, Edit3, Download, Copy, Check, RefreshCw, Share2, Link2,
  AlertTriangle, Lightbulb, GitCompare, MessageSquare, BookOpen, Loader2, Radio,
  History as HistoryIcon,
} from 'lucide-react';
import { copyToClipboard } from '../utils/helpers.js';

const TABS = [
  { id: 'errors',       label: 'Errors',      icon: AlertTriangle },
  { id: 'suggestions',  label: 'Suggestions', icon: Lightbulb },
  { id: 'diff',         label: 'Diff View',   icon: GitCompare },
  { id: 'explanation',  label: 'Explanation', icon: MessageSquare },
];

export default function Analyzer() {
  const { isAuthenticated, updateUser } = useAuth();
  const location = useLocation();
  const [code, setCode]           = useState(location.state?.code || '');
  const [language, setLanguage]   = useState(location.state?.language || 'python');
  const [title, setTitle]         = useState('');
  const [inputMode, setInputMode] = useState('editor');
  const [loading, setLoading]     = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [result, setResult]       = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [activeTab, setActiveTab] = useState('errors');
  const [copied, setCopied]       = useState(false);
  const [shareUrl, setShareUrl]   = useState(null);
  const [sharing, setSharing]     = useState(false);
  const [useStream, setUseStream] = useState(false);
  const resultRef = useRef(null);
  const esRef     = useRef(null);

  // ── Standard analysis ────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!code.trim()) return toast.error('Please enter some code to analyze.');
    if (!language)    return toast.error('Please select a programming language.');

    if (useStream) { handleStreamAnalyze(); return; }

    setLoading(true);
    setResult(null);
    setShareUrl(null);
    try {
      const res = await api.post('/ai/analyze', { code, language, title: title || undefined });
      setResult(res.data.result);
      setSubmissionId(res.data.submissionId);
      setActiveTab('errors');
      toast.success('Analysis complete!');
      
      // Update local achievements
      const { gamification } = res.data;
      if (gamification) {
        updateUser({
          streak: gamification.streak,
          badges: gamification.badges,
          analysisCount: gamification.analysisCount,
        });
        if (gamification.newBadges?.length) {
          gamification.newBadges.forEach((b) => toast.success(`🏅 Badge unlocked!`, { duration: 4000 }));
        }
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── Streaming analysis ───────────────────────────────────────────────────
  const handleStreamAnalyze = useCallback(() => {
    if (!code.trim()) return;
    setStreaming(true);
    setStreamText('');
    setResult(null);
    setShareUrl(null);

    const params = new URLSearchParams({ code, language, title: title || '' });
    const baseUrl = getBaseURL();
    const es = new EventSource(`${baseUrl}/ai/analyze/stream?${params}`);
    esRef.current = es;

    es.addEventListener('start', () => setStreamText('⚡ Streaming analysis...'));
    es.addEventListener('chunk', (e) => {
      const { text } = JSON.parse(e.data);
      setStreamText((prev) => prev + text);
    });
    es.addEventListener('done', (e) => {
      const { result: r, submissionId: sid, gamification } = JSON.parse(e.data);
      setResult(r);
      setSubmissionId(sid);
      setStreamText('');
      setStreaming(false);
      setActiveTab('errors');
      toast.success('Streaming analysis complete!');
      
      if (gamification) {
        updateUser({
          streak: gamification.streak,
          badges: gamification.badges,
          analysisCount: gamification.analysisCount,
        });
        if (gamification.newBadges?.length) {
          gamification.newBadges.forEach((b) => toast.success(`🏅 Badge unlocked!`, { duration: 4000 }));
        }
      }
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      es.close();
    });
    es.addEventListener('error', (e) => {
      try {
        const { message } = JSON.parse(e.data);
        toast.error(message || 'Streaming failed.');
      } catch { toast.error('Streaming connection lost.'); }
      setStreaming(false);
      es.close();
    });
  }, [code, language, title, updateUser]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(result?.correctedCode || '');
    if (ok) { setCopied(true); toast.success('Copied!'); setTimeout(() => setCopied(false), 2000); }
  };

  const handleDownload = () => {
    if (!result?.correctedCode) return;
    const extMap = { python: 'py', javascript: 'js', typescript: 'ts', java: 'java', c: 'c', cpp: 'cpp', php: 'php', go: 'go' };
    const blob = new Blob([result.correctedCode], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `corrected.${extMap[language] || 'txt'}`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Download started!');
  };

  const handleShare = async () => {
    if (!submissionId || !isAuthenticated) return;
    setSharing(true);
    try {
      const res = await api.post(`/share/${submissionId}`);
      setShareUrl(res.data.shareUrl);
      await copyToClipboard(res.data.shareUrl);
      toast.success('Share link copied to clipboard! 🔗');
    } catch {
      toast.error('Failed to create share link.');
    } finally { setSharing(false); }
  };

  const handleReset = () => {
    setResult(null); setCode(''); setTitle(''); setShareUrl(null);
    setStreamText(''); setSubmissionId(null);
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setStreaming(false);
  };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      {loading && <LoadingOverlay />}
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        <main className="flex-1 overflow-y-auto page-container max-w-none">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                AI Code Analyzer
              </h1>
              <p className="page-subtitle">Paste your code or upload a file to detect errors and generate fixes</p>
            </div>
            {result && (
              <button onClick={handleReset} className="btn-secondary py-2 px-4 text-sm">
                <RefreshCw className="w-4 h-4" />New Analysis
              </button>
            )}
          </div>

          {/* Input Section */}
          <div className="glass-card p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div className="md:col-span-2">
                <label className="label">Analysis Title (optional)</label>
                <input type="text" placeholder="e.g. Fibonacci function bug fix" value={title}
                  onChange={(e) => setTitle(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label">Language</label>
                <LanguageSelector value={language} onChange={setLanguage} />
              </div>
            </div>

            {/* Input mode toggle */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <button onClick={() => setInputMode('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${inputMode === 'editor' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-700'}`}>
                <Edit3 className="w-4 h-4" />Text Editor
              </button>
              <button onClick={() => setInputMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${inputMode === 'upload' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-200 dark:hover:bg-dark-700'}`}>
                <Upload className="w-4 h-4" />File Upload
              </button>
            </div>

            {inputMode === 'editor' ? (
              <CodeEditor value={code} onChange={setCode} language={language} height="360px" />
            ) : (
              <FileUpload
                onFileLoad={(text) => { setCode(text); setInputMode('editor'); }}
                onLanguageDetect={setLanguage}
              />
            )}

            {/* Streaming preview */}
            {streaming && streamText && (
              <div className="mt-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 font-mono text-xs text-dark-600 dark:text-dark-300 max-h-48 overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-3.5 h-3.5 text-primary-500 animate-pulse" />
                  <span className="text-primary-500 font-semibold text-xs">Streaming...</span>
                </div>
                <pre className="whitespace-pre-wrap break-all">{streamText}</pre>
              </div>
            )}

            {/* Analyze Button */}
            <div className="mt-5 flex flex-col sm:flex-row items-center gap-4 flex-wrap">
              <button onClick={handleAnalyze} disabled={loading || streaming || !code.trim()}
                className="btn-primary w-full sm:w-auto px-10 py-3.5 text-base shadow-xl shadow-primary-500/30">
                {loading || streaming
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Zap className="w-5 h-5" />}
                {streaming ? 'Streaming...' : 'Analyze with AI'}
              </button>

              {/* Streaming toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setUseStream((s) => !s)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${useStream ? 'bg-primary-500' : 'bg-dark-300 dark:bg-dark-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${useStream ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-dark-500 dark:text-dark-400 font-medium flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" />Streaming mode
                </span>
              </label>

              {!isAuthenticated && (
                <p className="text-sm text-dark-400 text-center">
                  🔒 <a href="/register" className="text-primary-500 font-medium hover:underline">Create account</a> to save history &amp; download reports
                </p>
              )}
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div ref={resultRef} className="space-y-6 animate-slide-up">
              {/* Summary bar */}
              <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-dark-500 dark:text-dark-400 mb-1">AI Summary</p>
                  <p className="text-dark-800 dark:text-dark-200 leading-relaxed">{result.summary || 'Analysis complete.'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-3">
                    {copied ? <><Check className="w-4 h-4 text-green-500" />Copied</> : <><Copy className="w-4 h-4" />Copy Code</>}
                  </button>
                  <button onClick={handleDownload} className="btn-primary text-sm py-2 px-3">
                    <Download className="w-4 h-4" />Download
                  </button>
                  {isAuthenticated && submissionId && (
                    <button onClick={handleShare} disabled={sharing} className="btn-secondary text-sm py-2 px-3">
                      {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      Share
                    </button>
                  )}
                </div>
              </div>

              {/* Share URL pill */}
              {shareUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/40">
                  <Link2 className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary-600 dark:text-primary-400 font-medium truncate hover:underline">{shareUrl}</a>
                  <button onClick={() => copyToClipboard(shareUrl)} className="ml-auto text-xs btn-secondary py-1 px-2">Copy</button>
                </div>
              )}

              {/* Metrics row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ComplexityBadge
                  qualityScore={result.qualityScore}
                  timeComplexity={result.timeComplexity}
                  spaceComplexity={result.spaceComplexity}
                  cyclomaticComplexity={result.cyclomaticComplexity}
                  maintainabilityIndex={result.maintainabilityIndex}
                />
                <SeverityScore score={result.severityScore} errors={result.errors} />
              </div>

              {/* Tabs */}
              <div className="glass-card overflow-hidden">
                <div className="flex border-b border-dark-200 dark:border-dark-700 overflow-x-auto">
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const count = id === 'errors' ? result.errors?.length : id === 'suggestions' ? result.optimizations?.length : null;
                    return (
                      <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                          activeTab === id
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                            : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
                        }`}>
                        <Icon className="w-4 h-4" />
                        {label}
                        {count !== null && count !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-primary-500 text-white' : 'bg-dark-200 dark:bg-dark-700 text-dark-600 dark:text-dark-300'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  {activeTab === 'errors' && (
                    result.errors?.length > 0 ? (
                      <div className="space-y-3">
                        {result.errors.map((e, i) => <ErrorCard key={i} error={e} index={i} />)}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-dark-400">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                          <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <p className="text-lg font-semibold text-dark-700 dark:text-dark-200">No errors found!</p>
                        <p className="text-sm mt-1">Your code looks clean. Check suggestions for improvements.</p>
                      </div>
                    )
                  )}
                  {activeTab === 'suggestions' && (
                    result.optimizations?.length > 0 ? (
                      <div className="space-y-3">
                        {result.optimizations.map((s, i) => <SuggestionCard key={i} suggestion={s} index={i} />)}
                      </div>
                    ) : (
                      <p className="text-center text-dark-400 py-10">No optimization suggestions for this code.</p>
                    )
                  )}
                  {activeTab === 'diff' && (
                    <CodeComparison originalCode={code} correctedCode={result.correctedCode} language={language} />
                  )}
                  {activeTab === 'explanation' && (
                    <div className="space-y-4">
                      {result.explanations?.length > 0 ? (
                        result.explanations.map((exp, i) => (
                          <div key={i} className="flex gap-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-sm text-dark-700 dark:text-dark-200 leading-relaxed">{exp}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-dark-400 py-10">No explanations available.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Corrected code */}
              <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-dark-200 dark:border-dark-700 flex items-center justify-between">
                  <h3 className="font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-500" />Corrected Code
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="btn-secondary text-xs py-1.5 px-3">
                      <Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleDownload} className="btn-primary text-xs py-1.5 px-3">
                      <Download className="w-3.5 h-3.5" />Download
                    </button>
                  </div>
                </div>
                <CodeEditor value={result.correctedCode} language={language} readOnly height="350px" />
              </div>

              {/* Saved to history banner for authenticated users */}
              {isAuthenticated && submissionId && (
                <div className="glass-card p-4 flex items-center gap-4 border-green-500/20 bg-green-500/5">
                  <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                    <HistoryIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-dark-800 dark:text-dark-100">Analysis saved to your history</p>
                    <p className="text-xs text-dark-500 dark:text-dark-400">This analysis is stored in the database and accessible anytime from your History page.</p>
                  </div>
                  <a href="/history" className="btn-secondary text-sm py-2 px-4 flex-shrink-0 flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4" />View History
                  </a>
                </div>
              )}

              {!isAuthenticated && (
                <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-4 border-primary-200 dark:border-primary-800/40 bg-primary-50/50 dark:bg-primary-950/10">
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-bold text-dark-800 dark:text-dark-100">Save this analysis?</p>
                    <p className="text-sm text-dark-500 dark:text-dark-400">Create a free account to save history, download PDF reports, and track your progress.</p>
                  </div>
                  <a href="/register" className="btn-primary py-2.5 px-6 flex-shrink-0">Create Free Account</a>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
