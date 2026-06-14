import { useState } from 'react';
import { computeDiff } from '../utils/helpers.js';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CodeComparison({ originalCode = '', correctedCode = '', language = '' }) {
  const [copied, setCopied] = useState(false);
  const diff = computeDiff(originalCode, correctedCode);

  const stats = diff.reduce((acc, l) => {
    if (l.type === 'added')    acc.added++;
    if (l.type === 'removed')  acc.removed++;
    if (l.type === 'modified') acc.modified++;
    return acc;
  }, { added: 0, removed: 0, modified: 0 });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(correctedCode);
    setCopied(true);
    toast.success('Corrected code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const lineClass = (type) => {
    if (type === 'added')    return 'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-400';
    if (type === 'removed')  return 'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-400';
    if (type === 'modified') return 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-400';
    return '';
  };

  const linePrefix = (type) => {
    if (type === 'added')    return <span className="text-green-500 font-bold w-4 inline-block">+</span>;
    if (type === 'removed')  return <span className="text-red-500 font-bold w-4 inline-block">-</span>;
    if (type === 'modified') return <span className="text-yellow-500 font-bold w-4 inline-block">~</span>;
    return <span className="text-dark-400 w-4 inline-block"> </span>;
  };

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          {stats.added > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />+{stats.added} added
            </span>
          )}
          {stats.removed > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
              <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />-{stats.removed} removed
            </span>
          )}
          {stats.modified > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400">
              <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />~{stats.modified} modified
            </span>
          )}
        </div>
        <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-3">
          {copied ? <><Check className="w-4 h-4 text-green-500" />Copied!</> : <><Copy className="w-4 h-4" />Copy Corrected</>}
        </button>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original */}
        <div className="rounded-xl border border-dark-200 dark:border-dark-700 overflow-hidden">
          <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-dark-200 dark:border-dark-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">Original Code</span>
          </div>
          <div className="overflow-auto max-h-96 bg-dark-50 dark:bg-dark-900">
            <pre className="font-mono text-xs leading-6 p-0">
              {diff.map((line, i) => (
                <div key={i} className={`flex px-3 py-0.5 ${lineClass(line.type === 'added' ? 'same' : line.type)}`}>
                  <span className="text-dark-400 select-none w-8 flex-shrink-0 text-right pr-3">{line.line}</span>
                  {linePrefix(line.type === 'added' ? 'same' : line.type)}
                  <span className={`flex-1 ${line.type === 'removed' ? 'text-red-700 dark:text-red-300' : line.type === 'modified' ? 'text-yellow-700 dark:text-yellow-300' : 'text-dark-700 dark:text-dark-300'}`}>
                    {line.original ?? ''}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Corrected */}
        <div className="rounded-xl border border-dark-200 dark:border-dark-700 overflow-hidden">
          <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/30 border-b border-dark-200 dark:border-dark-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-400">Corrected Code</span>
          </div>
          <div className="overflow-auto max-h-96 bg-dark-50 dark:bg-dark-900">
            <pre className="font-mono text-xs leading-6 p-0">
              {diff.map((line, i) => (
                <div key={i} className={`flex px-3 py-0.5 ${lineClass(line.type)}`}>
                  <span className="text-dark-400 select-none w-8 flex-shrink-0 text-right pr-3">{line.line}</span>
                  {linePrefix(line.type)}
                  <span className={`flex-1 ${line.type === 'added' ? 'text-green-700 dark:text-green-300' : line.type === 'modified' ? 'text-yellow-700 dark:text-yellow-300' : 'text-dark-700 dark:text-dark-300'}`}>
                    {line.corrected ?? ''}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
