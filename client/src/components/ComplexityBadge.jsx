import { getScoreBg, getScoreLabel, getScoreColor } from '../utils/helpers.js';
import { Clock, HardDrive } from 'lucide-react';

export default function ComplexityBadge({ timeComplexity, spaceComplexity, qualityScore }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Quality Score */}
      <div className="glass-card p-5 flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-dark-700" />
            <circle
              cx="40" cy="40" r="34" fill="none" strokeWidth="8"
              className={`transition-all duration-1000`}
              style={{
                stroke: qualityScore >= 90 ? '#22c55e' : qualityScore >= 70 ? '#3b82f6' : qualityScore >= 50 ? '#f59e0b' : '#ef4444',
                strokeDasharray: `${2 * Math.PI * 34}`,
                strokeDashoffset: `${2 * Math.PI * 34 * (1 - (qualityScore || 0) / 100)}`,
                strokeLinecap: 'round',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${getScoreColor(qualityScore)}`}>{qualityScore}</span>
            <span className="text-xs text-dark-400">/100</span>
          </div>
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold ${getScoreColor(qualityScore)}`}>{getScoreLabel(qualityScore)}</p>
          <p className="text-xs text-dark-400">Quality Score</p>
        </div>
      </div>

      {/* Time Complexity */}
      <div className="glass-card p-5 flex flex-col items-center gap-3 justify-center">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
          <Clock className="w-6 h-6 text-blue-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-dark-800 dark:text-dark-100">{timeComplexity || 'N/A'}</p>
          <p className="text-xs text-dark-400 mt-0.5">Time Complexity</p>
        </div>
      </div>

      {/* Space Complexity */}
      <div className="glass-card p-5 flex flex-col items-center gap-3 justify-center">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center">
          <HardDrive className="w-6 h-6 text-purple-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold font-mono text-dark-800 dark:text-dark-100">{spaceComplexity || 'N/A'}</p>
          <p className="text-xs text-dark-400 mt-0.5">Space Complexity</p>
        </div>
      </div>
    </div>
  );
}
