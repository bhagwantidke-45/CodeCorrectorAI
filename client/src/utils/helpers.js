/** Format date to readable string */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

/** Truncate long strings */
export const truncate = (str, n = 60) =>
  str && str.length > n ? str.substring(0, n) + '…' : str;

/** Language display name map */
export const LANGUAGE_MAP = {
  c:          { label: 'C',          icon: '⚙️',  color: '#555555', monacoLang: 'c' },
  cpp:        { label: 'C++',        icon: '🔷',  color: '#00599c', monacoLang: 'cpp' },
  java:       { label: 'Java',       icon: '☕',  color: '#ed8b00', monacoLang: 'java' },
  python:     { label: 'Python',     icon: '🐍',  color: '#3776ab', monacoLang: 'python' },
  javascript: { label: 'JavaScript', icon: '🟨',  color: '#f7df1e', monacoLang: 'javascript' },
  typescript: { label: 'TypeScript', icon: '🔵',  color: '#3178c6', monacoLang: 'typescript' },
  php:        { label: 'PHP',        icon: '🐘',  color: '#777bb4', monacoLang: 'php' },
  go:         { label: 'Go',         icon: '🐹',  color: '#00add8', monacoLang: 'go' },
};

export const LANGUAGES = Object.entries(LANGUAGE_MAP).map(([value, meta]) => ({ value, ...meta }));

/** Quality score color */
export const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
};

export const getScoreBg = (score) => {
  if (score >= 90) return 'from-green-500 to-emerald-400';
  if (score >= 70) return 'from-blue-500 to-cyan-400';
  if (score >= 50) return 'from-yellow-500 to-amber-400';
  return 'from-red-500 to-rose-400';
};

export const getScoreLabel = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
};

/** Severity badge class */
export const getSeverityClass = (severity) => {
  const map = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  return map[severity] || 'badge-info';
};

/** File extension → language */
export const extToLanguage = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const map = { c: 'c', cpp: 'cpp', cc: 'cpp', java: 'java', py: 'python', js: 'javascript', ts: 'typescript', php: 'php', go: 'go' };
  return map[ext] || 'javascript';
};

/** Format file size */
export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/** Copy to clipboard */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/** Simple diff line comparison */
export const computeDiff = (original, corrected) => {
  const origLines = (original || '').split('\n');
  const corrLines = (corrected || '').split('\n');
  const maxLen = Math.max(origLines.length, corrLines.length);
  const result = [];
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i] ?? null;
    const c = corrLines[i] ?? null;
    if (o === c) result.push({ type: 'same', original: o, corrected: c, line: i + 1 });
    else if (o === null) result.push({ type: 'added', original: null, corrected: c, line: i + 1 });
    else if (c === null) result.push({ type: 'removed', original: o, corrected: null, line: i + 1 });
    else result.push({ type: 'modified', original: o, corrected: c, line: i + 1 });
  }
  return result;
};
