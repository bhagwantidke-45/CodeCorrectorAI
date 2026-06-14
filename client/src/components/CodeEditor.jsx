import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext.jsx';
import { LANGUAGE_MAP } from '../utils/helpers.js';

export default function CodeEditor({ value, onChange, language = 'javascript', readOnly = false, height = '400px', label = '' }) {
  const { isDark } = useTheme();

  const options = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    readOnly,
    padding: { top: 16, bottom: 16 },
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    cursorStyle: 'line',
    wordWrap: 'on',
    folding: true,
    glyphMargin: false,
    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    renderWhitespace: 'selection',
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
  };

  const monacoLang = LANGUAGE_MAP[language]?.monacoLang || language;

  return (
    <div className="flex flex-col h-full">
      {label && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-dark-100 dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700 rounded-t-xl">
          <span className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wide">{label}</span>
          <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-md font-mono font-medium">
            {LANGUAGE_MAP[language]?.icon} {LANGUAGE_MAP[language]?.label || language}
          </span>
        </div>
      )}
      <div className={`flex-1 overflow-hidden ${label ? 'rounded-b-xl' : 'rounded-xl'} border border-dark-200 dark:border-dark-700`}>
        <Editor
          height={height}
          language={monacoLang}
          value={value}
          onChange={readOnly ? undefined : onChange}
          theme={isDark ? 'vs-dark' : 'light'}
          options={options}
          loading={
            <div className="flex items-center justify-center h-full bg-dark-900">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        />
      </div>
    </div>
  );
}
