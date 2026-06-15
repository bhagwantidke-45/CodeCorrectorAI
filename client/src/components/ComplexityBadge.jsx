/**
 * ComplexityBadge — shows quality score, time/space complexity,
 * cyclomatic complexity gauge, and maintainability index gauge.
 */

// Radial SVG gauge helper
function RadialGauge({ value, max, label, sublabel, color, size = 70 }) {
  const r       = (size / 2) - 8;
  const cx      = size / 2;
  const cy      = size / 2;
  const circ    = 2 * Math.PI * r;
  const pct     = Math.min(1, value / max);
  const dash    = pct * circ;
  const gap     = circ - dash;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none"
            className="stroke-dark-200 dark:stroke-dark-700" strokeWidth="7" />
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-black" style={{ color }}>{value}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-dark-700 dark:text-dark-200">{label}</p>
        {sublabel && <p className="text-[10px] text-dark-400">{sublabel}</p>}
      </div>
    </div>
  );
}

// Quality score ring (larger)
function QualityRing({ score }) {
  const r     = 40;
  const circ  = 2 * Math.PI * r;
  const pct   = score / 100;
  const dash  = pct * circ;
  const gap   = circ - dash;

  const color  = score >= 90 ? '#22c55e' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label  = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 96, height: 96 }}>
        <svg width={96} height={96} className="-rotate-90">
          <circle cx={48} cy={48} r={r} fill="none"
            className="stroke-dark-200 dark:stroke-dark-700" strokeWidth="9" />
          <circle cx={48} cy={48} r={r} fill="none"
            stroke={color} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>{score}</span>
          <span className="text-[10px] text-dark-400 font-medium">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-dark-700 dark:text-dark-100">Quality Score</p>
        <p className="text-xs font-semibold mt-0.5 px-2 py-0.5 rounded-full inline-block"
          style={{ background: `${color}20`, color }}>{label}</p>
      </div>
    </div>
  );
}

export default function ComplexityBadge({
  qualityScore        = 0,
  timeComplexity      = 'N/A',
  spaceComplexity     = 'N/A',
  cyclomaticComplexity = 1,
  maintainabilityIndex = 70,
}) {
  const cycColor = cyclomaticComplexity <= 5 ? '#22c55e' : cyclomaticComplexity <= 10 ? '#f59e0b' : '#ef4444';
  const maintColor = maintainabilityIndex >= 85 ? '#22c55e' : maintainabilityIndex >= 65 ? '#f59e0b' : '#ef4444';

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-5 flex items-center gap-2">
        <span>📊</span> Code Metrics
      </h3>

      <div className="flex flex-wrap items-center justify-around gap-6">
        {/* Quality ring */}
        <QualityRing score={qualityScore} />

        {/* Divider */}
        <div className="hidden sm:block w-px h-24 bg-dark-200 dark:bg-dark-700" />

        {/* Cyclomatic */}
        <RadialGauge
          value={cyclomaticComplexity}
          max={30}
          label="Cyclomatic"
          sublabel={cyclomaticComplexity <= 5 ? 'Simple' : cyclomaticComplexity <= 10 ? 'Moderate' : 'Complex'}
          color={cycColor}
        />

        {/* Maintainability */}
        <RadialGauge
          value={maintainabilityIndex}
          max={100}
          label="Maintainability"
          sublabel={maintainabilityIndex >= 85 ? 'High' : maintainabilityIndex >= 65 ? 'Moderate' : 'Low'}
          color={maintColor}
        />

        {/* Divider */}
        <div className="hidden sm:block w-px h-24 bg-dark-200 dark:bg-dark-700" />

        {/* Time / Space text badges */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-dark-400 font-medium">Time Complexity</span>
            <span className="font-mono text-base font-bold px-3 py-1 rounded-xl bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
              {timeComplexity}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-dark-400 font-medium">Space Complexity</span>
            <span className="font-mono text-base font-bold px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              {spaceComplexity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
