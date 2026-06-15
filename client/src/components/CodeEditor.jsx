import MonacoEditor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext.jsx';
import { LANGUAGE_MAP } from '../utils/helpers.js';

const LANG_TO_MONACO = {
  c: 'c', cpp: 'cpp', java: 'java', python: 'python',
  javascript: 'javascript', typescript: 'typescript', php: 'php', go: 'go',
};

export default function CodeEditor({
  value = '',
  onChange,
  language = 'python',
  height = '360px',
  readOnly = false,
}) {
  const { isDark } = useTheme();
  const monacoLang = LANG_TO_MONACO[language] || language;

  return (
    <div className="rounded-xl overflow-hidden border border-dark-200 dark:border-dark-700 shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 bg-dark-100 dark:bg-dark-800 border-b border-dark-200 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <span className="text-base">{LANGUAGE_MAP[language]?.icon || '📄'}</span>
          <span className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wide">
            {LANGUAGE_MAP[language]?.label || language}
          </span>
          {readOnly && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 rounded-full font-medium">
              Read-only
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400 opacity-70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-70" />
          <div className="w-3 h-3 rounded-full bg-green-400 opacity-70" />
        </div>
      </div>
      <MonacoEditor
        height={height}
        language={monacoLang}
        value={value}
        theme={isDark ? 'vs-dark' : 'light'}
        onChange={readOnly ? undefined : onChange}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          roundedSelection: true,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          padding: { top: 16, bottom: 16 },
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          contextmenu: !readOnly,
          quickSuggestions: !readOnly,
        }}
      />
    </div>
  );
}
