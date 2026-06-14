import { getSeverityClass } from '../utils/helpers.js';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const TYPE_ICONS = {
  syntax:  <AlertTriangle className="w-4 h-4" />,
  logical: <AlertCircle className="w-4 h-4" />,
  runtime: <AlertTriangle className="w-4 h-4 text-orange-500" />,
  warning: <Info className="w-4 h-4 text-yellow-500" />,
  style:   <Info className="w-4 h-4 text-blue-500" />,
};

export default function ErrorCard({ error, index }) {
  const [open, setOpen] = useState(index < 3);
  const { line, type, severity, message, fix, explanation } = error;

  return (
    <div className="rounded-xl border border-dark-200 dark:border-dark-700 overflow-hidden bg-white dark:bg-dark-800 transition-all duration-200 hover:shadow-lg">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-dark-50 dark:hover:bg-dark-700/50 transition-colors">
        <div className="flex-shrink-0 mt-0.5 text-dark-500 dark:text-dark-400">
          {TYPE_ICONS[type] || <AlertCircle className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={getSeverityClass(severity)}>{severity?.toUpperCase()}</span>
            <span className="badge-info capitalize">{type}</span>
            {line && <span className="text-xs text-dark-400 font-mono">Line {line}</span>}
          </div>
          <p className="text-sm font-medium text-dark-800 dark:text-dark-200 leading-snug">{message}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-dark-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-dark-400 flex-shrink-0 mt-0.5" />}
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-dark-100 dark:border-dark-700 px-4 pb-4 pt-3 space-y-3 animate-fade-in">
          {fix && (
            <div>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5 uppercase tracking-wide">Suggested Fix</p>
              <pre className="text-xs font-mono bg-dark-50 dark:bg-dark-900 border border-dark-200 dark:border-dark-700 rounded-lg p-3 text-green-700 dark:text-green-300 overflow-x-auto whitespace-pre-wrap">{fix}</pre>
            </div>
          )}
          {explanation && (
            <div>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1.5 uppercase tracking-wide">Explanation</p>
              <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed">{explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
