import express from 'express';
import auth from '../middleware/auth.js';
import { syncGithub, getGithubProfile, disconnectGithub } from '../controllers/githubController.js';

const router = express.Router();

router.post('/sync',         auth, syncGithub);
router.get('/profile',       auth, getGithubProfile);
router.delete('/disconnect', auth, disconnectGithub);

export default router;
