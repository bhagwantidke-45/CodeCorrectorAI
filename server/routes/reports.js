import express from 'express';
import { generateReport, downloadReport, getReports, deleteReport } from '../controllers/reportController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getReports);
router.post('/generate/:submissionId', generateReport);
router.get('/download/:reportId', downloadReport);
router.delete('/:id', deleteReport);

export default router;
