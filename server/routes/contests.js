import express from 'express';
import auth from '../middleware/auth.js';
import {
  getContests, getContest, joinContest,
  getLeaderboard, createContest, getUpcomingContests,
  joinContestByCode,
} from '../controllers/contestController.js';

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  import('../middleware/auth.js').then(m => m.default(req, res, next)).catch(() => next());
};

router.get('/',                optionalAuth, getContests);
router.get('/upcoming',        getUpcomingContests);
router.post('/join-by-code',   auth, joinContestByCode);
router.get('/:id',             getContest);
router.get('/:id/leaderboard', getLeaderboard);
router.post('/',               auth, createContest);
router.post('/:id/join',       auth, joinContest);

export default router;
