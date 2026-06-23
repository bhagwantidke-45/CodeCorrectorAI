import Contest from '../models/Contest.js';
import User from '../models/User.js';

// ── GET /api/contests  — list contests
export async function getContests(req, res) {
  try {
    const { status, type, myContests, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    if (myContests === 'true' && req.user) {
      filter.$or = [
        { createdBy: req.user._id },
        { 'participants.user': req.user._id }
      ];
    } else {
      filter.isPrivate = { $ne: true };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Contest.countDocuments(filter);
    const contests = await Contest.find(filter)
      .select('-participants -leaderboard')
      .populate('challenges.challenge', 'title difficulty points')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, data: contests, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getContest(req, res) {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('challenges.challenge', 'title difficulty points category')
      .populate('participants.user', 'name avatar _id')
      .populate('leaderboard.user', 'name avatar');
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });
    res.json({ success: true, data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/contests/:id/join  — join a contest
export async function joinContest(req, res) {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    if (contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Contest has ended' });
    }

    const alreadyJoined = contest.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      if (contest.participants.length >= contest.maxParticipants) {
        return res.status(400).json({ success: false, message: 'Contest is full' });
      }
      contest.participants.push({ user: req.user._id });

      // Track on user
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { contestsJoined: contest._id },
      });
    }

    await contest.save();
    res.json({ success: true, message: alreadyJoined ? 'Already joined' : 'Joined successfully', data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── GET /api/contests/:id/leaderboard  — live leaderboard
export async function getLeaderboard(req, res) {
  try {
    const contest = await Contest.findById(req.params.id)
      .populate('participants.user', 'name avatar');
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found' });

    const ranked = [...contest.participants]
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((p, i) => ({
        rank:       i + 1,
        user:       p.user,
        score:      p.score,
        solvedCount: p.solvedAt?.length || 0,
        joinedAt:   p.joinedAt,
      }));

    res.json({ success: true, data: ranked, total: contest.participants.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/contests  — create contest
export async function createContest(req, res) {
  try {
    const data = { ...req.body, createdBy: req.user._id };
    if (data.isPrivate || data.type === 'custom') {
      data.isPrivate = true;
      data.type = 'custom';
      // Generate a unique 6-character alphanumeric code
      let uniqueCode = '';
      let isUnique = false;
      while (!isUnique) {
        uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existing = await Contest.findOne({ joinCode: uniqueCode });
        if (!existing) isUnique = true;
      }
      data.joinCode = uniqueCode;
    }
    
    const contest = await Contest.create(data);

    // Automatically register creator as participant
    contest.participants.push({ user: req.user._id });
    await contest.save();

    // Track on user
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { contestsJoined: contest._id },
    });

    res.status(201).json({ success: true, data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /api/contests/join-by-code  — join a contest by its code
export async function joinContestByCode(req, res) {
  try {
    const { joinCode } = req.body;
    if (!joinCode) {
      return res.status(400).json({ success: false, message: 'Join code is required' });
    }

    const contest = await Contest.findOne({ joinCode: joinCode.trim().toUpperCase() });
    if (!contest) {
      return res.status(404).json({ success: false, message: 'Contest not found with this code' });
    }

    if (contest.status === 'ended') {
      return res.status(400).json({ success: false, message: 'Contest has ended' });
    }

    const alreadyJoined = contest.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      if (contest.participants.length >= contest.maxParticipants) {
        return res.status(400).json({ success: false, message: 'Contest is full' });
      }
      contest.participants.push({ user: req.user._id });

      // Track on user
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { contestsJoined: contest._id },
      });

      await contest.save();
    }

    res.json({ success: true, message: alreadyJoined ? 'Already joined' : 'Joined successfully', data: contest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}


// ── GET /api/contests/upcoming  — next 3 upcoming contests
export async function getUpcomingContests(req, res) {
  try {
    const now = new Date();
    const contests = await Contest.find({
      startTime: { $gt: now },
      isActive: true,
    })
    .select('title description startTime endTime duration type difficulty status')
    .sort({ startTime: 1 })
    .limit(3);
    res.json({ success: true, data: contests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
