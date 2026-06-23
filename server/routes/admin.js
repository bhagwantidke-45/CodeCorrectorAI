import express from 'express';
import {
  // Users
  getUsers, toggleUserStatus, deleteUser, updateUserRole,
  // Stats
  getAdminStats,
  // Analytics
  getAnalytics,
  // Challenges
  getAdminChallenges, createAdminChallenge, updateAdminChallenge,
  deleteAdminChallenge, toggleAdminChallenge, setDailyChallenge,
  // Submissions
  getAdminSubmissions, getAdminSubmission, deleteAdminSubmission,
  // Reports
  getAdminReports, deleteAdminReport,
  // Contests
  getAdminContests, createAdminContest, updateAdminContest, deleteAdminContest,
  // Announcements
  broadcastAnnouncement,
  // System
  getSystemHealth,
} from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();
router.use(auth, adminAuth);

// ── Stats & Analytics ───────────────────────────────────
router.get('/stats',     getAdminStats);
router.get('/analytics', getAnalytics);
router.get('/system',    getSystemHealth);

// ── Users ────────────────────────────────────────────────
router.get   ('/users',              getUsers);
router.patch ('/users/:id/toggle',   toggleUserStatus);
router.patch ('/users/:id/role',     updateUserRole);
router.delete('/users/:id',          deleteUser);

// ── Challenges ───────────────────────────────────────────
router.get   ('/challenges',              getAdminChallenges);
router.post  ('/challenges',              createAdminChallenge);
router.put   ('/challenges/:id',          updateAdminChallenge);
router.delete('/challenges/:id',          deleteAdminChallenge);
router.patch ('/challenges/:id/toggle',   toggleAdminChallenge);
router.patch ('/challenges/:id/daily',    setDailyChallenge);

// ── Submissions ──────────────────────────────────────────
router.get   ('/submissions',      getAdminSubmissions);
router.get   ('/submissions/:id',  getAdminSubmission);
router.delete('/submissions/:id',  deleteAdminSubmission);

// ── Reports ──────────────────────────────────────────────
router.get   ('/reports-list',     getAdminReports);
router.delete('/reports-list/:id', deleteAdminReport);

// ── Contests ─────────────────────────────────────────────
router.get   ('/contests',     getAdminContests);
router.post  ('/contests',     createAdminContest);
router.put   ('/contests/:id', updateAdminContest);
router.delete('/contests/:id', deleteAdminContest);

// ── Announcements ────────────────────────────────────────
router.post('/announcements', broadcastAnnouncement);

export default router;
