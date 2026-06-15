/**
 * SeverityScore — SVG arc gauge showing 0–10 weighted severity.
 * 0-3 = info (green), 4-6 = warning (yellow), 7-10 = critical (red)
 */
export default function SeverityScore({ score = 0, errors = [] }) {
  const safeScore = Math.min(10, Math.max(0, Number(score) || 0));

  // Gauge geometry
  const radius     = 56;
  const cx         = 80;
  const cy         = 80;
  const startAngle = -210;  // degrees
  const sweepAngle = 240;   // total arc degrees
  const toRad      = (d) => (d * Math.PI) / 180;

  const polarToXY = (angleDeg) => ({
    x: cx + radius * Math.cos(toRad(angleDeg)),
    y: cy + radius * Math.sin(toRad(angleDeg)),
  });

  const endAngleDeg  = startAngle + sweepAngle;
  const fillAngleDeg = startAngle + (safeScore / 10) * sweepAngle;

  const describeArc = (a1, a2) => {
    const p1 = polarToXY(a1);
    const p2 = polarToXY(a2);
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${large} 1 ${p2.x} ${p2.y}`;
  };

  const getColor = (s) => {
    if (s >= 7)  return { stroke: '#ef4444', text: 'text-red-500',    label: 'Critical',  bg: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' };
    if (s >= 4)  return { stroke: '#f59e0b', text: 'text-yellow-500', label: 'Warning',   bg: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400' };
    return        { stroke: '#22c55e', text: 'text-green-500',  label: 'Clean',     bg: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' };
  };

  const { stroke, text, label, bg } = getColor(safeScore);

  // Count by severity
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  errors.forEach((e) => { if (counts[e.severity] !== undefined) counts[e.severity]++; });

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>⚠️</span> Severity Score
      </h3>

      <div className="flex items-center gap-6">
        {/* SVG Gauge */}
        <svg width="160" height="130" viewBox="0 0 160 130" className="flex-shrink-0">
          {/* Track */}
          <path
            d={describeArc(startAngle, endAngleDeg)}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className="text-dark-200 dark:text-dark-700"
          />
          {/* Fill */}
          {safeScore > 0 && (
            <path
              d={describeArc(startAngle, fillAngleDeg)}
              fill="none"
              stroke={stroke}
              strokeWidth="10"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${stroke}80)` }}
            />
          )}
          {/* Score text */}
          <text x={cx} y={cy + 6} textAnchor="middle" className="fill-current" style={{ fontSize: 28, fontWeight: 800, fill: stroke }}>
            {safeScore.toFixed(1)}
          </text>
          <text x={cx} y={cy + 24} textAnchor="middle" style={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}>
            out of 10
          </text>
          {/* Min / Max labels */}
          <text x="20" y="120" textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>0</text>
          <text x="140" y="120" textAnchor="middle" style={{ fontSize: 10, fill: '#94a3b8' }}>10</text>
        </svg>

        {/* Right panel */}
        <div className="flex-1 space-y-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${bg}`}>{label}</span>

          <div className="space-y-2">
            {[
              { key: 'critical', label: 'Critical', color: 'bg-red-500' },
              { key: 'high',     label: 'High',     color: 'bg-orange-500' },
              { key: 'medium',   label: 'Medium',   color: 'bg-yellow-500' },
              { key: 'low',      label: 'Low',      color: 'bg-green-500' },
            ].map(({ key, label: lbl, color }) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                <span className="text-xs text-dark-500 dark:text-dark-400 w-14">{lbl}</span>
                <div className="flex-1 h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: errors.length ? `${(counts[key] / errors.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-bold text-dark-700 dark:text-dark-200 w-5 text-right">{counts[key]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
