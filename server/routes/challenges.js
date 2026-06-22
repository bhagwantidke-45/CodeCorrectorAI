import express from 'express';
import auth from '../middleware/auth.js';
import {
  getChallenges, getDailyChallenge, getChallenge, getCompanies,
  submitChallenge, reviewChallenge, generateChallenge, getUserChallengeStats,
  getGlobalLeaderboard, getAiHint, getSolvedChallenges,
} from '../controllers/challengeController.js';

const router = express.Router();

// Optional auth — guests can view challenges, but not submit/generate
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  import('../middleware/auth.js').then(m => m.default(req, res, next)).catch(() => next());
};

router.get('/',              optionalAuth, getChallenges);
router.get('/daily',         getDailyChallenge);
router.get('/companies',     getCompanies);
router.get('/stats',         auth, getUserChallengeStats);
router.get('/solved',        auth, getSolvedChallenges);
router.get('/leaderboard',   optionalAuth, getGlobalLeaderboard);
router.get('/:id',           getChallenge);
router.post('/generate',     auth, generateChallenge);
router.post('/:id/submit',   auth, submitChallenge);
router.post('/:id/review',   auth, reviewChallenge);
router.post('/:id/hint',     auth, getAiHint);


export default router;
