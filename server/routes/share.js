import express from 'express';
import { createShareLink, revokeShareLink, getSharedAnalysis } from '../controllers/shareController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:slug',        getSharedAnalysis);          // public — no auth
router.post('/:id',         auth, createShareLink);      // make public
router.delete('/:id',       auth, revokeShareLink);      // revoke

export default router;
