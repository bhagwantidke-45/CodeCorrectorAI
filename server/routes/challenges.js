import express from 'express';
import auth from '../middleware/auth.js';
import {
  getChallenges, getDailyChallenge, getChallenge, getCompanies,
  submitChallenge, reviewChallenge, generateChallenge, getUserChallengeStats,
  getGlobalLeaderboard, getAiHint,
} from '../controllers/challengeController.js';

const router = express.Router();

router.get('/',              auth, getChallenges);
router.get('/daily',         getDailyChallenge);
router.get('/companies',     getCompanies);
router.get('/stats',         auth, getUserChallengeStats);
router.get('/leaderboard',   auth, getGlobalLeaderboard);
router.get('/:id',           getChallenge);
router.post('/generate',     auth, generateChallenge);
router.post('/:id/submit',   auth, submitChallenge);
router.post('/:id/review',   auth, reviewChallenge);
router.post('/:id/hint',     auth, getAiHint);


export default router;
