import User from '../models/User.js';

// Badge definitions
const BADGES = {
  FIRST_ANALYSIS:    { id: 'first_analysis',    label: 'First Analysis',    emoji: '🎯', desc: 'Completed your first code analysis' },
  STREAK_3:          { id: 'streak_3',           label: '3-Day Streak',      emoji: '🔥', desc: 'Analyzed code 3 days in a row' },
  STREAK_7:          { id: 'streak_7',           label: 'Week Warrior',      emoji: '⚡', desc: 'Analyzed code 7 days in a row' },
  STREAK_30:         { id: 'streak_30',          label: 'Monthly Master',    emoji: '🏆', desc: '30-day streak achieved!' },
  HIGH_SCORE:        { id: 'high_score',         label: 'Clean Coder',       emoji: '✨', desc: 'Achieved a quality score of 95+' },
  POLYGLOT:          { id: 'polyglot',           label: 'Polyglot',          emoji: '🌐', desc: 'Analyzed code in 5+ different languages' },
  CENTURION:         { id: 'centurion',          label: 'Centurion',         emoji: '💯', desc: 'Completed 100 analyses' },
  BUG_HUNTER:        { id: 'bug_hunter',         label: 'Bug Hunter',        emoji: '🐛', desc: 'Found and fixed 50+ errors' },
};

export const ALL_BADGES = Object.values(BADGES);

/**
 * Update streak and award badges after a successful analysis.
 * @param {string} userId
 * @param {object} result - Groq analysis result
 * @returns {{ newBadges: string[], streak: number }}
 */
export const updateGamification = async (userId, result) => {
  if (!userId) return { newBadges: [], streak: 0 };

  const user = await User.findById(userId);
  if (!user) return { newBadges: [], streak: 0 };

  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // ── Streak logic ──────────────────────────────────────────────────────────
  let streak = user.streak || 0;
  const last = user.lastAnalysisDate
    ? new Date(user.lastAnalysisDate.getFullYear(), user.lastAnalysisDate.getMonth(), user.lastAnalysisDate.getDate())
    : null;

  if (!last) {
    streak = 1; // first ever
  } else if (last.getTime() === today.getTime()) {
    // Already analyzed today — keep streak
  } else if (last.getTime() === yesterday.getTime()) {
    streak += 1; // consecutive day
  } else {
    streak = 1; // streak broken
  }

  // ── Badge evaluation ──────────────────────────────────────────────────────
  const existingBadges = new Set(user.badges || []);
  const newBadgeIds    = [];

  const awardIf = (condition, badgeId) => {
    if (condition && !existingBadges.has(badgeId)) {
      existingBadges.add(badgeId);
      newBadgeIds.push(badgeId);
    }
  };

  awardIf(user.analysisCount >= 0,              BADGES.FIRST_ANALYSIS.id);  // 0-indexed, already incremented before this call
  awardIf(streak >= 3,                           BADGES.STREAK_3.id);
  awardIf(streak >= 7,                           BADGES.STREAK_7.id);
  awardIf(streak >= 30,                          BADGES.STREAK_30.id);
  awardIf((result?.qualityScore || 0) >= 95,     BADGES.HIGH_SCORE.id);
  awardIf((user.analysisCount || 0) >= 100,      BADGES.CENTURION.id);

  // Save
  await User.findByIdAndUpdate(userId, {
    streak,
    lastAnalysisDate: now,
    badges: [...existingBadges],
  });

  return { newBadges: newBadgeIds, streak };
};
