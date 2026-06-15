import express from 'express';
import auth from '../middleware/auth.js';
import {
  getContests, getContest, joinContest,
  getLeaderboard, createContest, getUpcomingContests,
} from '../controllers/contestController.js';

const router = express.Router();

router.get('/',                getContests);
router.get('/upcoming',        getUpcomingContests);
router.get('/:id',             getContest);
router.get('/:id/leaderboard', getLeaderboard);
router.post('/',               auth, createContest);
router.post('/:id/join',       auth, joinContest);

export default router;
