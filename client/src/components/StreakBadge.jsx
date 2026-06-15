import { ALL_BADGES } from '../utils/badges.js';

export default function StreakBadge({ streak = 0, badges = [], compact = false }) {
  if (streak === 0 && badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {streak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
            <span className="text-base leading-none">🔥</span>
            <span className="text-xs font-black text-orange-600 dark:text-orange-400">{streak}</span>
          </div>
        )}
        {badges.slice(0, 3).map((b) => {
          const badge = ALL_BADGES.find((x) => x.id === b);
          return badge ? (
            <span key={b} title={badge.label} className="text-lg leading-none cursor-default">{badge.emoji}</span>
          ) : null;
        })}
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-dark-500 dark:text-dark-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span>🏅</span> Achievements
      </h3>

      {/* Streak counter */}
      {streak > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-200 dark:border-orange-800/40 mb-5">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-2xl font-black text-orange-500">{streak} day{streak !== 1 ? 's' : ''}</p>
            <p className="text-xs text-dark-400">Current analysis streak — keep it going!</p>
          </div>
        </div>
      )}

      {/* Badges grid */}
      {badges.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((b) => {
            const badge = ALL_BADGES.find((x) => x.id === b);
            return badge ? (
              <div key={b} className="flex items-center gap-2 p-2.5 rounded-xl bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 hover:border-primary-400/50 transition-colors">
                <span className="text-2xl flex-shrink-0">{badge.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-dark-800 dark:text-dark-100 truncate">{badge.label}</p>
                  <p className="text-[10px] text-dark-400 truncate">{badge.desc}</p>
                </div>
              </div>
            ) : null;
          })}
        </div>
      ) : (
        <p className="text-sm text-dark-400 text-center py-4">Complete analyses to earn badges!</p>
      )}
    </div>
  );
}
