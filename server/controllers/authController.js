import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../services/firebaseService.js';

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

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
    const token = signToken(user._id);
    await logActivity(user._id, 'register', { email: user.email });
    res.status(201).json({ success: true, message: 'Account created successfully.', token, user });
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
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = signToken(user._id);
    await logActivity(user._id, 'login', { email: user.email });
    const safeUser = user.toJSON();
    res.json({ success: true, message: 'Logged in successfully.', token, user: safeUser });
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
