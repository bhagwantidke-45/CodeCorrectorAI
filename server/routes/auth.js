import express from 'express';
import {
  register, login, refreshToken, logout,
  getProfile, updateProfile, changePassword, getPublicProfile,
} from '../controllers/authController.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register',        authLimiter, register);
router.post('/login',           authLimiter, login);
router.post('/refresh',         refreshToken);           // silent re-auth
router.post('/logout',          auth, logout);           // revoke refresh token
router.get('/me',               auth, getProfile);
router.put('/profile',          auth, updateProfile);
router.put('/change-password',  auth, changePassword);
router.get('/users/:id/profile', getPublicProfile);


export default router;
