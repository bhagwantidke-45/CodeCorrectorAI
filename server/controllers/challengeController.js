import Challenge from '../models/Challenge.js';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { executeCode, generateAiProblems, reviewChallengeCode } from '../services/aiExecutionService.js';
import { generateAiHintForCode } from '../services/geminiService.js';


// ── GET /api/challenges  — list / filter challenges
export async function getChallenges(req, res) {
  try {
    const {
      difficulty, category, company, tag, search,
      page = 1, limit = 20, aiGenerated, daily,
    } = req.query;

    const filter = { isActive: true };
    if (difficulty)  filter.difficulty = difficulty;
    if (category)    filter.category   = category;
    if (company)     filter.companies  = { $in: [company] };
    if (tag)         filter.tags       = { $in: [tag] };
    if (aiGenerated === 'true') filter.isAiGenerated = true;
    if (daily === 'true')       filter.isDailyChallenge = true;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Challenge.countDocuments(filter);
    const challenges = await Challenge.find(filter)
      .select('-testCases -solutionCode -starterCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach solved status if user is authenticated
    let solvedIds = new Set();
    if (req.user) {
      const user = await User.findById(req.user._id).select('solvedChallenges');
      solvedIds = new Set(user?.solvedChallenges?.map(s => s.challenge.toString()) || []);
    }

    const enriched = challenges.map(c => ({
      ...c.toObject(),
      solved: solvedIds.has(c._id.toString()),
    }));

    res.json({ success: true, data: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/challenges/daily  — today's challenge
export async function getDailyChallenge(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let challenge = await Challenge.findOne({
      isDailyChallenge: true,
      dailyDate: { $gte: today, $lt: tomorrow },
      isActive: true,
    }).select('-solutionCode');

    // Fallback: random medium challenge
    if (!challenge) {
      const count = await Challenge.countDocuments({ difficulty: 'medium', isActive: true });
      const skip  = Math.floor(Math.random() * count);
      challenge   = await Challenge.findOne({ difficulty: 'medium', isActive: true })
        .skip(skip).select('-solutionCode');
    }

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No daily challenge found' });
    }

    res.json({ success: true, data: challenge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/challenges/:id  — single challenge with starter code
export async function getChallenge(req, res) {
  try {
    const challenge = await Challenge.findById(req.params.id).select('-solutionCode');
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    res.json({ success: true, data: challenge });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/challenges/companies  — list all companies
export async function getCompanies(req, res) {
  try {
    const companies = await Challenge.distinct('companies', { isActive: true });
    res.json({ success: true, data: companies.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/challenges/:id/submit  — submit code for a challenge
export async function submitChallenge(req, res) {
  try {
    const { code, language } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (!code)      return res.status(400).json({ success: false, message: 'Code is required' });

    // Increment attempt counter
    challenge.totalAttempts += 1;

    // Execute against test cases
    const result = await executeCode(code, language || 'javascript', challenge.testCases);

    let xpEarned = 0;
    let alreadySolved = false;

    if (result.passed && req.user) {
      const user = await User.findById(req.user._id);

      // Contest Points Scoring
      const { contestId } = req.body;
      if (contestId) {
        try {
          const Contest = (await import('../models/Contest.js')).default;
          const contest = await Contest.findById(contestId);
          if (contest && contest.status === 'live') {
            const pIdx = contest.participants.findIndex(
              p => p.user.toString() === req.user._id.toString()
            );
            if (pIdx !== -1) {
              const participant = contest.participants[pIdx];
              const alreadySolvedInContest = participant.solvedAt.some(
                s => s.challengeId.toString() === challenge._id.toString()
              );
              if (!alreadySolvedInContest) {
                const contestChallenge = contest.challenges.find(
                  c => c.challenge.toString() === challenge._id.toString()
                );
                const points = contestChallenge ? contestChallenge.points : 100;
                const timeElapsed = Math.floor((Date.now() - new Date(contest.startTime)) / 1000);

                participant.solvedAt.push({
                  challengeId: challenge._id,
                  time: timeElapsed,
                  points,
                });
                participant.score += points;

                // Save contest (triggers pre-save leaderboard computation)
                await contest.save();

                user.contestPoints = (user.contestPoints || 0) + points;
              }
            }
          }
        } catch (cErr) {
          console.error('Error updating contest score:', cErr);
        }
      }

      alreadySolved = user.solvedChallenges.some(
        s => s.challenge.toString() === challenge._id.toString()
      );

      if (!alreadySolved) {
        // First-time solve
        challenge.totalSolved += 1;

        const xpMap = { easy: 10, medium: 25, hard: 50 };
        xpEarned = xpMap[challenge.difficulty] || 10;

        user.solvedChallenges.push({
          challenge: challenge._id,
          language,
          points: xpEarned,
        });
        user.xp = (user.xp || 0) + xpEarned;
        user.level = Math.floor(user.xp / 100) + 1;

        // Daily challenge streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = user.lastChallengeDate ? new Date(user.lastChallengeDate) : null;
        if (lastDate) {
          lastDate.setHours(0, 0, 0, 0);
          const diff = (today - lastDate) / (1000 * 60 * 60 * 24);
          user.challengeStreak = diff === 1 ? (user.challengeStreak || 0) + 1 : 1;
        } else {
          user.challengeStreak = 1;
        }
        user.lastChallengeDate = new Date();

        await user.save();
      }
    }

    // Update acceptance rate
    if (challenge.totalAttempts > 0) {
      challenge.acceptanceRate = Math.round((challenge.totalSolved / challenge.totalAttempts) * 100);
    }
    await challenge.save();

    // Save as a Submission in user's history if authenticated
    if (req.user) {
      try {
        await Submission.create({
          userId: req.user._id,
          originalCode: code,
          correctedCode: '',
          language,
          errors: [],
          optimizations: [],
          explanations: [],
          status: result.passed ? 'completed' : 'failed',
          title: `Practice: ${challenge.title}`,
          summary: result.passed ? 'Passed all test cases.' : result.error || 'Failed test cases.',
          qualityScore: result.passed ? 100 : 0,
          timeComplexity: result.timeComplexity || 'N/A',
          spaceComplexity: result.spaceComplexity || 'N/A',
        });
      } catch (subErr) {
        console.error('Error saving practice submission:', subErr);
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        xpEarned: alreadySolved ? 0 : xpEarned,
        alreadySolved,
        challengeTitle: challenge.title,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/challenges/:id/review  — AI code review
export async function reviewChallenge(req, res) {
  try {
    const { code, language } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
    if (!code)      return res.status(400).json({ success: false, message: 'Code is required' });

    const review = await reviewChallengeCode(code, language || 'javascript', challenge.title, challenge.description);
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/challenges/generate  — AI-generate problems
export async function generateChallenge(req, res) {
  try {
    const { difficulty = 'medium', topic = 'arrays', count = 1, save = false } = req.body;

    const problems = await generateAiProblems(difficulty, topic, Math.min(count, 3));

    const VALID_CATEGORIES = [
      'arrays', 'strings', 'linked-lists', 'trees', 'graphs',
      'dynamic-programming', 'recursion', 'sorting', 'binary-search',
      'hashing', 'two-pointers', 'sliding-window', 'math', 'greedy',
      'backtracking', 'stack-queue', 'heap', 'trie', 'bit-manipulation', 'other'
    ];

    const sanitizedProblems = problems.map(p => {
      let diff = String(p.difficulty || difficulty).toLowerCase().trim();
      if (!['easy', 'medium', 'hard'].includes(diff)) {
        diff = 'medium';
      }

      let cat = String(p.category || topic).toLowerCase().trim().replace(/\s+/g, '-');
      if (!VALID_CATEGORIES.includes(cat)) {
        cat = 'other';
      }

      const pointsMap = { easy: 10, medium: 25, hard: 50 };
      const pts = pointsMap[diff] || 10;

      const starterCode = p.starterCode || {};
      if (!starterCode.javascript) {
        starterCode.javascript = `// Write your javascript solution here\n`;
      }
      if (!starterCode.python) {
        starterCode.python = `# Write your python solution here\npass\n`;
      }
      if (!starterCode.java) {
        starterCode.java = `// Write your java solution here\n`;
      }
      if (!starterCode.cpp) {
        starterCode.cpp = `// Write your cpp solution here\n`;
      }

      const testCases = Array.isArray(p.testCases)
        ? p.testCases.map(tc => ({
            input: String(tc.input || ''),
            expectedOutput: String(tc.expectedOutput ?? ''),
            isHidden: Boolean(tc.isHidden),
            explanation: String(tc.explanation || '')
          }))
        : [];

      return {
        title: p.title || `AI Challenge - ${topic}`,
        description: p.description || 'Solve this programming challenge.',
        difficulty: diff,
        category: cat,
        tags: Array.isArray(p.tags) ? p.tags : [cat],
        companies: Array.isArray(p.companies) ? p.companies : [],
        examples: Array.isArray(p.examples) ? p.examples : [],
        constraints: Array.isArray(p.constraints) ? p.constraints : [],
        hints: Array.isArray(p.hints) ? p.hints : [],
        starterCode,
        testCases,
        points: pts,
        timeLimit: p.timeLimit || 2000,
        memoryLimit: p.memoryLimit || 256
      };
    });

    if (save) {
      const saved = await Promise.all(
        sanitizedProblems.map(p =>
          Challenge.create({ ...p, isAiGenerated: true, aiPrompt: `${difficulty} ${topic}` })
        )
      );
      return res.json({ success: true, data: saved, generated: true, saved: true });
    }

    res.json({ success: true, data: sanitizedProblems, generated: true, saved: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/challenges/stats  — user challenge stats
export async function getUserChallengeStats(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('solvedChallenges xp level challengeStreak dailyChallengeStreak dailyChallengesCompleted badges')
      .populate('solvedChallenges.challenge', 'title difficulty category');

    const solved = user.solvedChallenges || [];
    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    const byCategory   = {};

    solved.forEach(s => {
      const ch = s.challenge;
      if (ch) {
        byDifficulty[ch.difficulty] = (byDifficulty[ch.difficulty] || 0) + 1;
        byCategory[ch.category]     = (byCategory[ch.category] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalSolved: solved.length,
        byDifficulty,
        byCategory,
        xp:                 user.xp,
        level:              user.level,
        challengeStreak:    user.challengeStreak,
        dailyChallengeStreak: user.dailyChallengeStreak,
        dailyChallengesCompleted: user.dailyChallengesCompleted,
        badges:             user.badges,
        recentSolved:       solved.slice(-5).reverse(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/challenges/solved  — full list of user's solved challenges
export async function getSolvedChallenges(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select('solvedChallenges')
      .populate('solvedChallenges.challenge', 'title difficulty category tags companies acceptanceRate isAiGenerated isDailyChallenge');

    const solved = (user.solvedChallenges || [])
      .filter(s => s.challenge) // skip if challenge was deleted
      .sort((a, b) => new Date(b.solvedAt) - new Date(a.solvedAt)); // newest first

    res.json({ success: true, data: solved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/challenges/leaderboard  — weekly global rankings
export async function getGlobalLeaderboard(req, res) {
  try {
    const users = await User.find({})
      .select('name xp level badges solvedChallenges createdAt')
      .sort({ xp: -1 })
      .limit(50);

    const data = users.map((u, index) => ({
      rank: index + 1,
      _id: u._id,
      name: u.name,
      xp: u.xp || 0,
      level: u.level || 1,
      solvedCount: u.solvedChallenges?.length || 0,
      badgeCount: u.badges?.length || 0,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// ── POST /api/challenges/:id/hint  — Gemini context-aware tiered hints
export async function getAiHint(req, res) {
  try {
    const { code, language = 'javascript', level = 1 } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Code template or draft is required' });
    }

    const hintResult = await generateAiHintForCode(code, language, challenge, Number(level));
    res.json({ success: true, data: hintResult });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

