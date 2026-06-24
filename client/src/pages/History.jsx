import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { formatDate, LANGUAGE_MAP, getScoreColor, LANGUAGES } from '../utils/helpers.js';
import toast from 'react-hot-toast';
import {
  History as HistoryIcon, Search, Filter, Trash2, RefreshCw,
  Code2, Calendar, ChevronLeft, ChevronRight, AlertCircle, Zap,
  Star, Eye, Clock, X, Lightbulb, MessageSquare, BookOpen, Copy, Check,
  TrendingUp, Shield, Activity
} from 'lucide-react';

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [language, setLanguage]       = useState('');
  const [page, setPage]               = useState(1);
  const [pagination, setPagination]   = useState({ total: 0, pages: 1 });
  const [deleting, setDeleting]       = useState(null);
  const [detail, setDetail]           = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing]           = useState(null);
  const [detailTab, setDetailTab]     = useState('errors');
  const [copiedCode, setCopiedCode]   = useState(false);
  const LIMIT = 10;

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search)   params.search = search;
      if (language) params.language = language;
      const res = await api.get('/submissions', { params });
      setSubmissions(res.data.submissions);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load history.'); }
    finally { setLoading(false); }
  }, [page, search, language]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleStar = async (id) => {
    setActing(id);
    try {
      const res = await api.patch(`/submissions/${id}/star`);
      setSubmissions(subs => subs.map(s => s._id === id ? { ...s, isStarred: res.data.submission.isStarred } : s));
      toast.success(res.data.message);
    } catch {
      toast.error('Failed to star/unstar.');
    } finally {
      setActing(null);
    }
  };

  const handleRequestDelete = async (id) => {
    if (!window.confirm('Request admin to delete this submission?')) return;
    setActing(id);
    try {
      const res = await api.patch(`/submissions/${id}/request-delete`);
      setSubmissions(subs => subs.map(s => s._id === id ? { ...s, isDeleteRequested: true } : s));
      toast.success('Deletion request submitted to admin.');
    } catch {
      toast.error('Failed to submit request.');
    } finally {
      setActing(null);
    }
  };

  const viewDetail = async (id) => {
    setDetailLoading(true);
    setDetailTab('errors');
    try {
      const res = await api.get(`/submissions/${id}`);
      setDetail(res.data.submission);
    } catch {
      toast.error('Failed to load submission details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success('Code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Failed to copy.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this submission permanently?')) return;
    setDeleting(id);
    try {
      await api.delete(`/submissions/${id}`);
      toast.success('Submission deleted.');
      fetchSubmissions();
    } catch { toast.error('Failed to delete.'); }
    finally { setDeleting(null); }
  };

  const handleReanalyze = (s) => {
    navigate('/analyze', { state: { code: s.originalCode, language: s.language } });
  };

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const handleLangChange   = (e) => { setLanguage(e.target.value); setPage(1); };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <HistoryIcon className="w-7 h-7 text-primary-500" />Analysis History
              </h1>
              <p className="page-subtitle">All your past code analyses — search, filter, and re-run</p>
            </div>
            <button onClick={fetchSubmissions} className="btn-secondary py-2 px-4 text-sm">
              <RefreshCw className="w-4 h-4" />Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input type="text" placeholder="Search by title..." value={search} onChange={handleSearchChange}
                className="input-field pl-10 py-2.5" />
            </div>
            <div className="relative sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <select value={language} onChange={handleLangChange}
                className="input-field pl-10 py-2.5 appearance-none">
                <option value="">All Languages</option>
                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.icon} {l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card overflow-hidden mb-6">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-dark-400">
                <Code2 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-semibold text-dark-700 dark:text-dark-200">No submissions found</p>
                <p className="text-sm mt-1 mb-4">
                  {search || language ? 'Try different search terms or filters.' : 'Start analyzing code to build your history.'}
                </p>
                <a href="/analyze" className="btn-primary text-sm py-2 px-5"><Zap className="w-4 h-4" />Analyze Code</a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
                      {['Title', 'Language', 'Errors', 'Score', 'Date', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100 dark:divide-dark-700">
                    {submissions.map((s) => (
                      <tr key={s._id} className="hover:bg-dark-50 dark:hover:bg-dark-800/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleStar(s._id)}
                              disabled={acting === s._id}
                              className={`p-1 rounded-lg transition-colors ${
                                s.isStarred
                                  ? 'text-yellow-500 hover:text-yellow-600'
                                  : 'text-dark-300 dark:text-dark-600 hover:text-yellow-500'
                              }`}
                              title={s.isStarred ? 'Unstar solution' : 'Star solution'}
                            >
                              <Star className={`w-4 h-4 ${s.isStarred ? 'fill-current' : ''}`} />
                            </button>
                            <div>
                              <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate max-w-[200px]">
                                {s.title || 'Untitled'}
                              </p>
                              <div className="flex flex-col mt-0.5">
                                {s.isStarred ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-yellow-500">
                                    Starred (never expires)
                                  </span>
                                ) : s.createdAt && (
                                  <span className="inline-flex items-center gap-1 text-[9px] text-dark-400">
                                    <Clock className="w-2.5 h-2.5" />
                                    Expires in {Math.max(0, Math.ceil((new Date(s.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))} days
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span>{LANGUAGE_MAP[s.language]?.icon}</span>
                            <span className="text-dark-600 dark:text-dark-300">{LANGUAGE_MAP[s.language]?.label || s.language}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-sm font-semibold ${(s.errors?.length || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            <AlertCircle className="w-3.5 h-3.5" />{s.errors?.length || 0}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold ${getScoreColor(s.qualityScore)}`}>
                            {s.qualityScore ?? 'N/A'}/100
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-xs text-dark-400">
                            <Calendar className="w-3.5 h-3.5" />{formatDate(s.createdAt)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => viewDetail(s._id)} disabled={detailLoading}
                              className="p-2 rounded-lg text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                              title="View solution code">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleReanalyze(s)}
                              className="p-2 rounded-lg text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors"
                              title="Re-analyze code">
                              <Zap className="w-4 h-4" />
                            </button>
                            {user?.role === 'admin' ? (
                              <button onClick={() => handleDelete(s._id)} disabled={deleting === s._id}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                                title="Delete submission permanently (Admin)">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRequestDelete(s._id)}
                                disabled={acting === s._id || s.isDeleteRequested}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  s.isDeleteRequested
                                    ? 'text-orange-500 bg-orange-500/10'
                                    : 'text-dark-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                                }`}
                                title={s.isDeleteRequested ? 'Deletion request pending' : 'Request deletion from admin'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-dark-400">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="btn-secondary py-2 px-3 disabled:opacity-40 text-sm">
                  <ChevronLeft className="w-4 h-4" />Prev
                </button>
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${page === p ? 'bg-primary-500 text-white' : 'btn-secondary'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  className="btn-secondary py-2 px-3 disabled:opacity-40 text-sm">
                  Next<ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Full Analysis Detail Modal */}
          {detail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="glass-card w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 flex-shrink-0">
                  <div>
                    <h3 className="font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2 text-lg">
                      <Code2 className="w-5 h-5 text-primary-500" />
                      {detail.title || 'Untitled Analysis'}
                    </h3>
                    <p className="text-xs text-dark-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Analyzed on {formatDate(detail.createdAt)} &nbsp;·&nbsp;
                      <span className="uppercase font-semibold">{LANGUAGE_MAP[detail.language]?.icon} {LANGUAGE_MAP[detail.language]?.label || detail.language}</span>
                    </p>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 text-dark-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pt-5 flex-shrink-0">
                  <div className="bg-dark-50 dark:bg-dark-800/60 border border-dark-200 dark:border-dark-700 rounded-xl p-3 text-center">
                    <p className="text-xs text-dark-400 mb-1 font-semibold flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />Quality</p>
                    <p className={`text-lg font-black ${getScoreColor(detail.qualityScore)}`}>{detail.qualityScore ?? 'N/A'}<span className="text-xs font-normal text-dark-400">/100</span></p>
                  </div>
                  <div className="bg-dark-50 dark:bg-dark-800/60 border border-dark-200 dark:border-dark-700 rounded-xl p-3 text-center">
                    <p className="text-xs text-dark-400 mb-1 font-semibold flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3" />Errors</p>
                    <p className={`text-lg font-black ${(detail.errors?.length || 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>{detail.errors?.length || 0}</p>
                  </div>
                  <div className="bg-dark-50 dark:bg-dark-800/60 border border-dark-200 dark:border-dark-700 rounded-xl p-3 text-center">
                    <p className="text-xs text-dark-400 mb-1 font-semibold flex items-center justify-center gap-1"><Activity className="w-3 h-3" />Complexity</p>
                    <p className="text-xs font-bold text-dark-700 dark:text-dark-200">T: {detail.timeComplexity || 'N/A'}<br/>S: {detail.spaceComplexity || 'N/A'}</p>
                  </div>
                  <div className="bg-dark-50 dark:bg-dark-800/60 border border-dark-200 dark:border-dark-700 rounded-xl p-3 text-center">
                    <p className="text-xs text-dark-400 mb-1 font-semibold flex items-center justify-center gap-1"><Shield className="w-3 h-3" />Severity</p>
                    <p className={`text-lg font-black ${detail.severityScore > 7 ? 'text-red-500' : detail.severityScore > 4 ? 'text-yellow-500' : 'text-green-500'}`}>{detail.severityScore ?? 0}<span className="text-xs font-normal text-dark-400">/10</span></p>
                  </div>
                </div>

                {/* Summary */}
                {detail.summary && (
                  <div className="mx-6 mt-4 bg-primary-500/5 border border-primary-500/15 rounded-xl p-4 flex-shrink-0">
                    <p className="text-xs font-bold text-primary-500 uppercase tracking-wide mb-1">AI Summary</p>
                    <p className="text-sm text-dark-700 dark:text-dark-300 leading-relaxed">{detail.summary}</p>
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b border-dark-200 dark:border-dark-700 mt-4 px-6 overflow-x-auto flex-shrink-0">
                  {[
                    { id: 'errors',       label: 'Errors',        icon: AlertCircle, count: detail.errors?.length },
                    { id: 'suggestions',  label: 'Suggestions',   icon: Lightbulb,   count: detail.optimizations?.length },
                    { id: 'explanation',  label: 'Explanation',   icon: MessageSquare, count: detail.explanations?.length },
                    { id: 'original',     label: 'Original Code', icon: Code2 },
                    { id: 'corrected',    label: 'Corrected Code',icon: BookOpen },
                  ].map(({ id, label, icon: Icon, count }) => (
                    <button key={id} onClick={() => setDetailTab(id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                        detailTab === id
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-dark-500 dark:text-dark-400 hover:text-dark-700'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {count !== undefined && count !== null && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          detailTab === id ? 'bg-primary-500 text-white' : 'bg-dark-200 dark:bg-dark-700 text-dark-600 dark:text-dark-300'
                        }`}>{count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">

                  {/* Errors Tab */}
                  {detailTab === 'errors' && (
                    detail.errors?.length > 0 ? (
                      <div className="space-y-3">
                        {detail.errors.map((err, i) => (
                          <div key={i} className={`p-4 rounded-xl border ${
                            err.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
                            err.severity === 'high'     ? 'border-orange-500/30 bg-orange-500/5' :
                            err.severity === 'medium'   ? 'border-yellow-500/30 bg-yellow-500/5' :
                            'border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50'
                          }`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  err.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                                  err.severity === 'high'     ? 'bg-orange-500/20 text-orange-500' :
                                  err.severity === 'medium'   ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                                  'bg-dark-200 dark:bg-dark-700 text-dark-600 dark:text-dark-300'
                                }`}>{err.severity || 'low'}</span>
                                <span className="text-[10px] font-semibold text-dark-400 uppercase">{err.type}</span>
                                {err.line && <span className="text-[10px] text-dark-400">Line {err.line}</span>}
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 mb-1">{err.message}</p>
                            {err.fix && <p className="text-xs text-dark-500 dark:text-dark-400"><span className="font-bold text-green-500">Fix: </span>{err.fix}</p>}
                            {err.explanation && <p className="text-xs text-dark-400 mt-1">{err.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-dark-400">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                          <Shield className="w-7 h-7 text-green-500" />
                        </div>
                        <p className="font-semibold text-dark-700 dark:text-dark-200">No errors found</p>
                        <p className="text-xs mt-1">Your code was clean at the time of analysis!</p>
                      </div>
                    )
                  )}

                  {/* Suggestions Tab */}
                  {detailTab === 'suggestions' && (
                    detail.optimizations?.length > 0 ? (
                      <div className="space-y-3">
                        {detail.optimizations.map((opt, i) => (
                          <div key={i} className="flex gap-3 p-4 rounded-xl bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-700">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                            <div>
                              {opt.category && <p className="text-[10px] font-bold text-primary-500 uppercase mb-1">{opt.category}</p>}
                              <p className="text-sm text-dark-700 dark:text-dark-200">{opt.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-dark-400 py-12 text-sm">No optimization suggestions were found.</p>
                    )
                  )}

                  {/* Explanation Tab */}
                  {detailTab === 'explanation' && (
                    detail.explanations?.length > 0 ? (
                      <div className="space-y-3">
                        {detail.explanations.map((exp, i) => (
                          <div key={i} className="flex gap-3 p-4 rounded-xl bg-dark-50 dark:bg-dark-800/50 border border-dark-200 dark:border-dark-700">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i + 1}</div>
                            <p className="text-sm text-dark-700 dark:text-dark-200 leading-relaxed">{exp}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-dark-400 py-12 text-sm">No explanations available.</p>
                    )
                  )}

                  {/* Original Code Tab */}
                  {detailTab === 'original' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Original Submitted Code</p>
                        <button onClick={() => handleCopyCode(detail.originalCode)}
                          className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-400 font-bold transition-colors">
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCode ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-dark-900 text-slate-100 p-5 rounded-2xl text-xs overflow-x-auto font-mono border border-dark-700 max-h-[400px] leading-relaxed select-all whitespace-pre-wrap break-words">
                        {detail.originalCode || 'No code available.'}
                      </pre>
                    </div>
                  )}

                  {/* Corrected Code Tab */}
                  {detailTab === 'corrected' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">AI-Corrected Code</p>
                        <button onClick={() => handleCopyCode(detail.correctedCode)}
                          className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-400 font-bold transition-colors">
                          {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCode ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      {detail.correctedCode ? (
                        <pre className="bg-dark-900 text-slate-100 p-5 rounded-2xl text-xs overflow-x-auto font-mono border border-dark-700 max-h-[400px] leading-relaxed select-all whitespace-pre-wrap break-words">
                          {detail.correctedCode}
                        </pre>
                      ) : (
                        <p className="text-center text-dark-400 py-12 text-sm">No corrected code available.</p>
                      )}
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-dark-200 dark:border-dark-700 flex gap-3 flex-shrink-0 bg-dark-50 dark:bg-dark-800/50">
                  <button onClick={() => setDetail(null)} className="btn-secondary flex-1 py-2 text-sm justify-center">Close</button>
                  <button
                    onClick={() => { setDetail(null); handleReanalyze(detail); }}
                    className="btn-primary flex-1 py-2 text-sm justify-center">
                    <Zap className="w-4 h-4" /> Load Code to Editor
                  </button>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
