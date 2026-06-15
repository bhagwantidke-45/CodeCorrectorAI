import express from 'express';
import { analyzeCode, analyzeCodeStream } from '../controllers/aiController.js';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Optional auth — guests can analyze too
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  import('../middleware/auth.js').then(m => m.default(req, res, next)).catch(() => next());
};

router.post('/analyze',        aiLimiter, optionalAuth, upload.single('file'), analyzeCode);
router.get('/analyze/stream',  aiLimiter, optionalAuth, analyzeCodeStream);

export default router;
