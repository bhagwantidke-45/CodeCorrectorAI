import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api.js';
import CodeEditor from '../components/CodeEditor.jsx';
import ComplexityBadge from '../components/ComplexityBadge.jsx';
import SeverityScore from '../components/SeverityScore.jsx';
import ErrorCard from '../components/ErrorCard.jsx';
import SuggestionCard from '../components/SuggestionCard.jsx';
import CodeComparison from '../components/CodeComparison.jsx';
import { LANGUAGE_MAP, formatDate } from '../utils/helpers.js';
import { Zap, AlertTriangle, Lightbulb, GitCompare, MessageSquare, Globe, Lock, ArrowLeft } from 'lucide-react';

const TABS = [
  { id: 'errors',       label: 'Errors',      icon: AlertTriangle },
  { id: 'suggestions',  label: 'Suggestions', icon: Lightbulb },
  { id: 'diff',         label: 'Diff View',   icon: GitCompare },
  { id: 'explanation',  label: 'Explanation', icon: MessageSquare },
];

export default function SharedAnalysis() {
  const { slug } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState('errors');

  useEffect(() => {
    api.get(`/share/${slug}`)
      .then((res) => setSubmission(res.data.submission))
      .catch(() => setError('This analysis is not found or has been made private.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col items-center justify-center gap-4 text-center px-6">
      <Lock className="w-16 h-16 text-dark-300 dark:text-dark-600" />
      <p className="text-xl font-bold text-dark-700 dark:text-dark-200">{error}</p>
      <Link to="/" className="btn-primary">Go Home</Link>
    </div>
  );

  const s = submission;
  const langMeta = LANGUAGE_MAP[s.language] || { icon: '📄', label: s.language };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900">
      {/* Topbar */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-dark-200 dark:border-dark-700 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-dark-800 dark:text-dark-100 hover:text-primary-500 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg">CleanCoder</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-dark-400">
          <Globe className="w-3.5 h-3.5 text-green-500" />
          Public Analysis
        </div>
        <Link to="/analyze" className="btn-primary text-sm py-2 px-4">
          <Zap className="w-4 h-4" />Try It Free
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-sm text-dark-400 mb-3">
            <span>{langMeta.icon}</span>
            <span className="font-medium">{langMeta.label}</span>
            <span>·</span>
            <span>{formatDate(s.createdAt)}</span>
          </div>
          <h1 className="text-3xl font-black text-dark-900 dark:text-dark-50">{s.title || 'Code Analysis'}</h1>
          {s.summary && <p className="mt-2 text-dark-500 dark:text-dark-400 leading-relaxed">{s.summary}</p>}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComplexityBadge
            qualityScore={s.qualityScore}
            timeComplexity={s.timeComplexity}
            spaceComplexity={s.spaceComplexity}
            cyclomaticComplexity={s.cyclomaticComplexity}
            maintainabilityIndex={s.maintainabilityIndex}
          />
          <SeverityScore score={s.severityScore} errors={s.errors} />
        </div>

        {/* Tabs */}
        <div className="glass-card overflow-hidden">
          <div className="flex border-b border-dark-200 dark:border-dark-700 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => {
              const count = id === 'errors' ? s.errors?.length : id === 'suggestions' ? s.optimizations?.length : null;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                    activeTab === id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-950/20'
                      : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700 dark:hover:text-dark-200'
                  }`}>
                  <Icon className="w-4 h-4" />{label}
                  {count !== null && count !== undefined && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === id ? 'bg-primary-500 text-white' : 'bg-dark-200 dark:bg-dark-700 text-dark-600 dark:text-dark-300'}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="p-6">
            {activeTab === 'errors' && (
              s.errors?.length > 0
                ? <div className="space-y-3">{s.errors.map((e, i) => <ErrorCard key={i} error={e} index={i} />)}</div>
                : <p className="text-center text-green-500 font-semibold py-10">✅ No errors found!</p>
            )}
            {activeTab === 'suggestions' && (
              s.optimizations?.length > 0
                ? <div className="space-y-3">{s.optimizations.map((sg, i) => <SuggestionCard key={i} suggestion={sg} index={i} />)}</div>
                : <p className="text-center text-dark-400 py-10">No suggestions.</p>
            )}
            {activeTab === 'diff' && (
              <CodeComparison originalCode={s.originalCode} correctedCode={s.correctedCode} language={s.language} />
            )}
            {activeTab === 'explanation' && (
              <div className="space-y-4">
                {s.explanations?.map((exp, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                    <p className="text-sm text-dark-700 dark:text-dark-200 leading-relaxed">{exp}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Corrected code */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-200 dark:border-dark-700">
            <h3 className="font-bold text-dark-800 dark:text-dark-100">Corrected Code</h3>
          </div>
          <CodeEditor value={s.correctedCode} language={s.language} readOnly height="300px" />
        </div>

        {/* CTA */}
        <div className="glass-card p-8 text-center">
          <p className="text-xl font-black text-dark-800 dark:text-dark-100 mb-2">Analyze your own code for free</p>
          <p className="text-dark-500 dark:text-dark-400 mb-6">CleanCoder uses AI to find bugs, score quality, and generate fixes instantly.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/analyze" className="btn-primary px-8 py-3"><Zap className="w-5 h-5" />Try Free</Link>
            <Link to="/register" className="btn-secondary px-8 py-3">Create Account</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
