import express from 'express';
import { getSubmissions, getSubmissionById, deleteSubmission, getStats } from '../controllers/submissionController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/stats', getStats);
router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);
router.delete('/:id', deleteSubmission);

export default router;
