import User from '../models/User.js';
import Submission from '../models/Submission.js';
import Report from '../models/Report.js';
import { getGlobalAnalytics, getRecentActivity } from '../services/firebaseService.js';

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
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
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, message: `User role updated to ${role}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalSubmissions, totalReports, firebaseAnalytics, recentActivity] = await Promise.all([
      User.countDocuments(),
      Submission.countDocuments(),
      Report.countDocuments(),
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
