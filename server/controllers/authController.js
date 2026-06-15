import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Submission from '../models/Submission.js';
import { logActivity } from '../services/firebaseService.js';

// Short-lived access token (15 min)
const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

// Long-lived refresh token (30 days) — stored in DB
const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

// Helper: attach refresh token to user doc
const saveRefreshToken = async (user, token) => {
  user.refreshToken = token;
  user.refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30d
  await user.save({ validateBeforeSave: false });
};

// Helper: send tokens in response
const sendTokens = (res, statusCode, message, user, accessToken, refreshToken) => {
  // Refresh token in httpOnly cookie
  res.cookie('cc_refresh', refreshToken, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({
    success: true,
    message,
    token: accessToken,
    user,
  });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password });
    const accessToken  = signAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user, refreshToken);
    await logActivity(user._id, 'register', { email: user.email });
    sendTokens(res, 201, 'Account created successfully.', user.toJSON(), accessToken, refreshToken);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }
    user.lastLogin = new Date();
    const accessToken  = signAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user, refreshToken);
    await logActivity(user._id, 'login', { email: user.email });
    sendTokens(res, 200, 'Logged in successfully.', user.toJSON(), accessToken, refreshToken);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    // Accept from cookie OR request body (for clients without cookie support)
    const token = req.cookies?.cc_refresh || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }
    const user = await User.findOne({ refreshToken: token }).select('+refreshToken +refreshTokenExpiry');
    if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token. Please log in again.' });
    }
    // Rotate the refresh token (one-time use)
    const newRefreshToken = generateRefreshToken();
    const newAccessToken  = signAccessToken(user._id);
    await saveRefreshToken(user, newRefreshToken);
    sendTokens(res, 200, 'Token refreshed.', user.toJSON(), newAccessToken, newRefreshToken);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    // Revoke refresh token in DB
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null, refreshTokenExpiry: null });
    }
    res.clearCookie('cc_refresh');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (avatar !== undefined) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/users/:id/profile
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('name avatar email role streak badges xp level githubUsername githubSynced githubRepos solvedChallenges createdAt')
      .populate('solvedChallenges.challenge', 'title difficulty category tags companies');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    // Get daily submission counts for the user
    const submissionActivity = await Submission.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const activityMap = {};
    submissionActivity.forEach(act => {
      activityMap[act._id] = act.count;
    });

    // Add solved challenges activity
    user.solvedChallenges.forEach(solved => {
      if (solved.solvedAt) {
        const dateStr = new Date(solved.solvedAt).toISOString().split('T')[0];
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
      }
    });

    // Convert back to array of { date, count }
    const activity = Object.keys(activityMap).map(date => ({
      date,
      count: activityMap[date]
    }));

    res.json({ success: true, user, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

