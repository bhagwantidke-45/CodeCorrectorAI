import express from 'express';
import { analyzeCode, analyzeCodeStream } from '../controllers/aiController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Optional auth — guests can analyze too, authenticated users get their userId saved
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  // Use the already-imported auth middleware; if it fails (bad token), just continue as guest
  auth(req, res, (err) => {
    if (err) return next(); // token invalid — continue as guest
    next();
  });
};

router.post('/analyze',        aiLimiter, optionalAuth, upload.single('file'), analyzeCode);
router.get('/analyze/stream',  aiLimiter, optionalAuth, analyzeCodeStream);

export default router;
