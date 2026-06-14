import { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { extToLanguage, formatBytes } from '../utils/helpers.js';

export default function FileUpload({ onFileLoad, onLanguageDetect }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);

  const ALLOWED = ['.c', '.cpp', '.java', '.py', '.js', '.ts', '.php', '.go'];

  const processFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext)) {
      alert(`Unsupported file type. Allowed: ${ALLOWED.join(', ')}`);
      return;
    }
    if (f.size > 1024 * 1024) {
      alert('File too large. Max size: 1MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFile(f);
      onFileLoad(e.target.result, f);
      onLanguageDetect?.(extToLanguage(f.name));
    };
    reader.readAsText(f);
  }, [onFileLoad, onLanguageDetect]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  const onInputChange = (e) => {
    const f = e.target.files[0];
    if (f) processFile(f);
  };

  const removeFile = () => setFile(null);

  return (
    <div className="space-y-3">
      {!file ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 scale-[1.01]'
              : 'border-dark-300 dark:border-dark-600 bg-dark-50 dark:bg-dark-800 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-950/10'
          }`}>
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${dragging ? 'bg-primary-500' : 'bg-dark-200 dark:bg-dark-700'}`}>
              <Upload className={`w-5 h-5 ${dragging ? 'text-white' : 'text-dark-500 dark:text-dark-400'}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-dark-600 dark:text-dark-300">
                {dragging ? 'Drop it!' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-dark-400 mt-0.5">{ALLOWED.join('  ')}</p>
            </div>
          </div>
          <input type="file" className="hidden" accept={ALLOWED.join(',')} onChange={onInputChange} />
        </label>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <File className="w-5 h-5 text-primary-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-800 dark:text-dark-200 truncate">{file.name}</p>
            <p className="text-xs text-dark-400">{formatBytes(file.size)}</p>
          </div>
          <button onClick={removeFile} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-dark-400 hover:text-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
