import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import api from '../utils/api.js';
import { formatDate, formatBytes, LANGUAGE_MAP } from '../utils/helpers.js';
import toast from 'react-hot-toast';
import { FileText, Download, Trash2, Plus, RefreshCw, Loader2, FileBarChart } from 'lucide-react';

export default function Reports() {
  const [reports, setReports]         = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [selectedSub, setSelectedSub] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/reports'),
        api.get('/submissions?limit=50'),
      ]);
      setReports(rRes.data.reports);
      setSubmissions(sRes.data.submissions);
    } catch { toast.error('Failed to load reports.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleGenerate = async () => {
    if (!selectedSub) return toast.error('Please select a submission.');
    setGenerating(selectedSub);
    try {
      await api.post(`/reports/generate/${selectedSub}`);
      toast.success('Report generated successfully!');
      setShowModal(false);
      setSelectedSub('');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report.');
    } finally { setGenerating(null); }
  };

  const handleDownload = async (report) => {
    setDownloading(report._id);
    try {
      const res = await api.get(`/reports/download/${report._id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url; a.download = report.fileName;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed.'); }
    finally { setDownloading(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    setDeleting(id);
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Report deleted.');
      fetchReports();
    } catch { toast.error('Failed to delete.'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="min-h-screen bg-dark-50 dark:bg-dark-900 flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title flex items-center gap-3">
                <FileBarChart className="w-7 h-7 text-primary-500" />PDF Reports
              </h1>
              <p className="page-subtitle">Generate and download professional analysis reports</p>
            </div>
            <div className="flex gap-3">
              <button onClick={fetchReports} className="btn-secondary py-2 px-4 text-sm">
                <RefreshCw className="w-4 h-4" />Refresh
              </button>
              <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4 text-sm">
                <Plus className="w-4 h-4" />Generate Report
              </button>
            </div>
          </div>

          {/* Reports Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
              <FileText className="w-16 h-16 mb-4 text-dark-200 dark:text-dark-700" />
              <p className="text-lg font-bold text-dark-700 dark:text-dark-200">No reports yet</p>
              <p className="text-sm text-dark-400 mt-1 mb-6">Generate a PDF report from any of your past analyses</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" />Generate First Report
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div key={report._id} className="glass-card-hover p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark-800 dark:text-dark-200 truncate">{report.fileName}</p>
                      <p className="text-xs text-dark-400">{formatBytes(report.fileSize)}</p>
                    </div>
                  </div>
                  {report.submissionId && (
                    <div className="rounded-xl bg-dark-50 dark:bg-dark-800 p-3 space-y-1">
                      <p className="text-xs font-semibold text-dark-600 dark:text-dark-300">
                        {LANGUAGE_MAP[report.submissionId.language]?.icon} {report.submissionId.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-dark-400">Score: {report.submissionId.qualityScore}/100</p>
                    </div>
                  )}
                  <p className="text-xs text-dark-400 flex items-center gap-1.5">
                    Generated: {formatDate(report.createdAt)}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleDownload(report)} disabled={downloading === report._id}
                      className="btn-primary flex-1 justify-center text-sm py-2">
                      {downloading === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download
                    </button>
                    <button onClick={() => handleDelete(report._id)} disabled={deleting === report._id}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border border-dark-200 dark:border-dark-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Generate Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm p-4">
              <div className="glass-card p-8 max-w-md w-full animate-slide-up">
                <h2 className="text-xl font-bold text-dark-800 dark:text-dark-100 mb-2">Generate PDF Report</h2>
                <p className="text-sm text-dark-400 mb-6">Select a past analysis to generate a downloadable PDF report.</p>
                <div>
                  <label className="label">Select Analysis</label>
                  <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)}
                    className="input-field">
                    <option value="">Choose a submission...</option>
                    {submissions.map(s => (
                      <option key={s._id} value={s._id}>
                        {LANGUAGE_MAP[s.language]?.icon} {s.title || 'Untitled'} — Score: {s.qualityScore}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button onClick={handleGenerate} disabled={!!generating || !selectedSub} className="btn-primary flex-1 justify-center">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Generate
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
