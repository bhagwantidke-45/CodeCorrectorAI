import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Report from '../models/Report.js';
import Challenge from '../models/Challenge.js';
import Contest from '../models/Contest.js';
import Notification from '../models/Notification.js';
import { getGlobalAnalytics, getRecentActivity } from '../services/firebaseService.js';
import os from 'os';

// ─────────────────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────────────────

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    // If not super admin, hide super admin from list
    if (req.user.email !== 'bhagwantidke2004@gmail.com') {
      query.email = { $ne: 'bhagwantidke2004@gmail.com' };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      if (query.email) {
        query.$and = [
          { email: query.email },
          {
            $or: [
              { name: searchRegex },
              { email: searchRegex }
            ]
          }
        ];
      } else {
        query.$or = [
          { name: searchRegex },
          { email: searchRegex }
        ];
      }
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/users/:id/toggle
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account.' });
    }

    // Protect super admin
    if (user.email === 'bhagwantidke2004@gmail.com' && req.user.email !== 'bhagwantidke2004@gmail.com') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Cannot deactivate Super Admin.' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Protect super admin
    if (user.email === 'bhagwantidke2004@gmail.com' && req.user.email !== 'bhagwantidke2004@gmail.com') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Cannot delete Super Admin.' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ userId: req.params.id });
    await Report.deleteMany({ userId: req.params.id });
    res.json({ success: true, message: 'User and all associated data deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // Protect super admin
    if (user.email === 'bhagwantidke2004@gmail.com' && req.user.email !== 'bhagwantidke2004@gmail.com') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Cannot change role of Super Admin.' });
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User role updated to ${role}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  STATS
// ─────────────────────────────────────────────────────────

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalSubmissions, totalReports, totalChallenges, totalContests, firebaseAnalytics, recentActivity] = await Promise.all([
      User.countDocuments(),
      Submission.countDocuments(),
      Report.countDocuments(),
      Challenge.countDocuments(),
      Contest.countDocuments(),
      getGlobalAnalytics(),
      getRecentActivity(10),
    ]);

    const submissionsByLang = await Submission.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt analysisCount role');

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSubmissions,
        totalReports,
        totalChallenges,
        totalContests,
        submissionsByLang,
        recentUsers,
        recentActivity,
        firebase: firebaseAnalytics,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  ADVANCED ANALYTICS
// ─────────────────────────────────────────────────────────

// GET /api/admin/analytics
export const getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    // User growth per day
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Submission trends per day
    const submissionTrends = await Submission.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$qualityScore' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top users by XP
    const topUsers = await User.find()
      .sort({ xp: -1 })
      .limit(10)
      .select('name email xp level analysisCount solvedChallenges');
    const topUsersMapped = topUsers.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      xp: u.xp || 0,
      level: u.level || 1,
      analyses: u.analysisCount || 0,
      solved: u.solvedChallenges?.length || 0,
    }));

    // Challenge acceptance rates
    const challengeStats = await Challenge.find({ totalAttempts: { $gt: 0 } })
      .sort({ acceptanceRate: 1 })
      .limit(10)
      .select('title difficulty acceptanceRate totalAttempts totalSolved');

    // Language distribution
    const languageDist = await Submission.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$qualityScore' } } },
      { $sort: { count: -1 } },
    ]);

    // Active users (submitted in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = await Submission.distinct('userId', { createdAt: { $gte: weekAgo } });

    res.json({
      success: true,
      data: {
        userGrowth,
        submissionTrends,
        topUsers: topUsersMapped,
        challengeStats,
        languageDist,
        weeklyActiveUsers: activeUsers.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  CHALLENGES (CRUD)
// ─────────────────────────────────────────────────────────

// GET /api/admin/challenges
export const getAdminChallenges = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, difficulty, category, status } = req.query;
    const query = {};
    if (difficulty) query.difficulty = difficulty;
    if (category)   query.category   = category;
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Challenge.countDocuments(query);
    const challenges = await Challenge.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-solutionCode');
    res.json({ success: true, challenges, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/challenges
export const createAdminChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, challenge, message: 'Challenge created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/challenges/:id
export const updateAdminChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
    res.json({ success: true, challenge, message: 'Challenge updated successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/challenges/:id
export const deleteAdminChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
    res.json({ success: true, message: 'Challenge deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/challenges/:id/toggle
export const toggleAdminChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
    challenge.isActive = !challenge.isActive;
    await challenge.save({ validateBeforeSave: false });
    res.json({ success: true, challenge, message: `Challenge ${challenge.isActive ? 'activated' : 'deactivated'}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/challenges/:id/daily
export const setDailyChallenge = async (req, res) => {
  try {
    const { date } = req.body; // ISO date string e.g. "2024-12-25"
    const dailyDate = date ? new Date(date) : new Date();

    // Clear existing daily for that date
    await Challenge.updateMany(
      { isDailyChallenge: true, dailyDate: { $gte: new Date(dailyDate.toDateString()) } },
      { isDailyChallenge: false, dailyDate: null }
    );

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { isDailyChallenge: true, dailyDate, isActive: true },
      { new: true }
    );
    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found.' });
    res.json({ success: true, challenge, message: 'Set as daily challenge.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  SUBMISSIONS OVERSIGHT
// ─────────────────────────────────────────────────────────

// GET /api/admin/submissions
export const getAdminSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, language, status, userId, isDeleteRequested } = req.query;
    const query = {};
    if (language) query.language = language;
    if (status)   query.status   = status;
    if (userId)   query.userId   = userId;
    if (isDeleteRequested === 'true') query.isDeleteRequested = true;

    // If not super admin, filter out super admin's submissions
    if (req.user.email !== 'bhagwantidke2004@gmail.com') {
      const superAdmin = await User.findOne({ email: 'bhagwantidke2004@gmail.com' });
      if (superAdmin) {
        if (userId && userId.toString() === superAdmin._id.toString()) {
          return res.json({ success: true, submissions: [], total: 0, pages: 0 });
        }
        query.userId = { $ne: superAdmin._id };
      }
    }

    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: 'i' } },
        { summary:  { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-originalCode -correctedCode -errors -optimizations -explanations');
    res.json({ success: true, submissions, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/submissions/:id
export const getAdminSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id).populate('userId', 'name email');
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    // Protect super admin's submissions
    if (req.user.email !== 'bhagwantidke2004@gmail.com' && submission.userId?.email === 'bhagwantidke2004@gmail.com') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Access denied.' });
    }

    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/submissions/:id
export const deleteAdminSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    // Protect super admin's submissions
    if (req.user.email !== 'bhagwantidke2004@gmail.com') {
      const superAdmin = await User.findOne({ email: 'bhagwantidke2004@gmail.com' });
      if (superAdmin && submission.userId?.toString() === superAdmin._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Cannot delete Super Admin submissions.' });
      }
    }

    await Submission.findByIdAndDelete(req.params.id);
    // Decrement user analysis count
    if (submission.userId) {
      await User.findByIdAndUpdate(submission.userId, { $inc: { analysisCount: -1 } });
    }
    res.json({ success: true, message: 'Submission deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  REPORTS MANAGEMENT
// ─────────────────────────────────────────────────────────

// GET /api/admin/reports-list
export const getAdminReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = {};

    // Filter out super admin's reports if not super admin
    if (req.user.email !== 'bhagwantidke2004@gmail.com') {
      const superAdmin = await User.findOne({ email: 'bhagwantidke2004@gmail.com' });
      if (superAdmin) {
        query.userId = { $ne: superAdmin._id };
      }
    }

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('userId', 'name email')
      .populate('submissionId', 'title language qualityScore')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, reports, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/reports-list/:id
export const deleteAdminReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Protect super admin's reports
    if (req.user.email !== 'bhagwantidke2004@gmail.com') {
      const superAdmin = await User.findOne({ email: 'bhagwantidke2004@gmail.com' });
      if (superAdmin && report.userId?.toString() === superAdmin._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized. Access denied.' });
      }
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  CONTESTS MANAGEMENT
// ─────────────────────────────────────────────────────────

// GET /api/admin/contests
export const getAdminContests = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Contest.countDocuments();
    const contests = await Contest.find()
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-participants -leaderboard');
    res.json({ success: true, contests, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/contests
export const createAdminContest = async (req, res) => {
  try {
    const contest = await Contest.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, contest, message: 'Contest created successfully.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/contests/:id
export const updateAdminContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });
    res.json({ success: true, contest, message: 'Contest updated.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/contests/:id
export const deleteAdminContest = async (req, res) => {
  try {
    const contest = await Contest.findByIdAndDelete(req.params.id);
    if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });
    res.json({ success: true, message: 'Contest deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  ANNOUNCEMENTS / NOTIFICATIONS
// ─────────────────────────────────────────────────────────

// POST /api/admin/announcements
export const broadcastAnnouncement = async (req, res) => {
  try {
    const { title, message, type = 'info', scope = 'all', targetUserId } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'Title and message are required.' });

    let userIds = [];
    if (scope === 'all') {
      const users = await User.find({ isActive: true }).select('_id');
      userIds = users.map(u => u._id);
    } else if (scope === 'user' && targetUserId) {
      userIds = [targetUserId];
    } else if (scope === 'admins') {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      userIds = admins.map(u => u._id);
    }

    // Create notifications for all target users
    const notifications = userIds.map(uid => ({
      user: uid,
      type: 'system',
      title,
      message,
      icon: type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '📢',
      meta: { announcementType: type, sentBy: req.user._id },
    }));

    await Notification.insertMany(notifications);

    res.json({ success: true, message: `Announcement sent to ${userIds.length} user(s).`, count: userIds.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  SYSTEM HEALTH
// ─────────────────────────────────────────────────────────

// GET /api/admin/system
export const getSystemHealth = async (req, res) => {
  try {
    const totalMem    = os.totalmem();
    const freeMem     = os.freemem();
    const usedMem     = totalMem - freeMem;
    const memPercent  = Math.round((usedMem / totalMem) * 100);

    const cpus        = os.cpus();
    const platform    = os.platform();
    const uptime      = os.uptime();
    const processUptime = process.uptime();

    // DB counts
    const [users, submissions, challenges, contests] = await Promise.all([
      User.countDocuments(),
      Submission.countDocuments(),
      Challenge.countDocuments(),
      Contest.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        memory: {
          total: Math.round(totalMem / 1024 / 1024),
          free:  Math.round(freeMem  / 1024 / 1024),
          used:  Math.round(usedMem  / 1024 / 1024),
          percent: memPercent,
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
        },
        platform,
        osUptime:      Math.floor(uptime / 3600),
        serverUptime:  Math.floor(processUptime / 60),
        nodeVersion:   process.version,
        db: { users, submissions, challenges, contests },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
