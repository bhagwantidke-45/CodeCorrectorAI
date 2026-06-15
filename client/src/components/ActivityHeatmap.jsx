import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Returns YYYY-MM-DD string in local time
function toDateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getIntensity(count) {
  if (!count || count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  'bg-dark-100 dark:bg-dark-800',                   // 0 — empty
  'bg-primary-200 dark:bg-primary-900/60',           // 1
  'bg-primary-400 dark:bg-primary-700/80',           // 2
  'bg-primary-500 dark:bg-primary-600',              // 3
  'bg-primary-600 dark:bg-primary-400',              // 4 — most active
];

export default function ActivityHeatmap({ timeSeries = [] }) {
  const [tooltip, setTooltip] = useState(null);

  // Build a map: dateKey → count
  const countMap = useMemo(() => {
    const map = {};
    timeSeries.forEach(t => {
      const key = toDateKey(t._id || t.date);
      map[key] = (map[key] || 0) + (t.count || 1);
    });
    return map;
  }, [timeSeries]);

  // Build 52 weeks × 7 days grid (364 days back from today)
  const { weeks, monthLabels, totalDays, totalActive } = useMemo(() => {
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 363); // 52 weeks back
    // Rewind to the Sunday before startDay
    startDay.setDate(startDay.getDate() - startDay.getDay());

    const weeks = [];
    const monthLabels = [];
    let seenMonths = new Set();
    let totalDays = 0;
    let totalActive = 0;
    let d = new Date(startDay);

    while (d <= today) {
      const week = [];
      for (let dow = 0; dow < 7; dow++) {
        const key      = toDateKey(d);
        const count    = countMap[key] || 0;
        const isFuture = d > today;
        if (!isFuture) totalDays++;
        if (count > 0) totalActive++;
        week.push({ date: new Date(d), key, count, isFuture });
        d.setDate(d.getDate() + 1);
      }
      // Track month label for the top
      const firstDay = week[0].date;
      const monthKey = `${firstDay.getFullYear()}-${firstDay.getMonth()}`;
      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        monthLabels.push({ weekIndex: weeks.length, label: MONTHS[firstDay.getMonth()] });
      }
      weeks.push(week);
    }
    return { weeks, monthLabels, totalDays, totalActive };
  }, [countMap]);

  const activePct = totalDays > 0 ? Math.round((totalActive / totalDays) * 100) : 0;

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-dark-800 dark:text-dark-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Coding Activity
        </h2>
        <div className="flex items-center gap-3 text-xs text-dark-400">
          <span>{totalActive} active day{totalActive !== 1 ? 's' : ''} ({activePct}%)</span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {INTENSITY_CLASSES.map((cls, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-1 ml-8 relative" style={{ gap: '3px' }}>
            {weeks.map((_, wIdx) => {
              const label = monthLabels.find(m => m.weekIndex === wIdx);
              return (
                <div key={wIdx} className="w-3 flex-shrink-0 text-center">
                  {label && (
                    <span className="text-[10px] text-dark-400 whitespace-nowrap absolute" style={{ left: `${wIdx * 15}px` }}>
                      {label.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex" style={{ gap: '3px', marginTop: '12px' }}>
            {/* Day labels */}
            <div className="flex flex-col mr-1" style={{ gap: '3px' }}>
              {DAYS.map((d, i) => (
                <div key={d} className="w-6 h-3 flex items-center justify-end">
                  {i % 2 === 1 && (
                    <span className="text-[10px] text-dark-400 leading-none">{d[0]}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col" style={{ gap: '3px' }}>
                {week.map((day) => (
                  <div
                    key={day.key}
                    onMouseEnter={() => !day.isFuture && setTooltip(day)}
                    onMouseLeave={() => setTooltip(null)}
                    className={`relative w-3 h-3 rounded-sm cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-primary-400/70 hover:scale-125 ${
                      day.isFuture
                        ? 'opacity-0 cursor-default'
                        : INTENSITY_CLASSES[getIntensity(day.count)]
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none"
          style={{
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}>
          <div className="bg-dark-900 dark:bg-dark-700 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-dark-700 dark:border-dark-600">
            <span className="font-semibold">{tooltip.count || 'No'}</span> submission{tooltip.count !== 1 ? 's' : ''} on{' '}
            <span className="text-primary-300">
              {new Date(tooltip.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
