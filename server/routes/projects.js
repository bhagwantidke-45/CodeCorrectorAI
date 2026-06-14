import express from 'express';
import { getProjects, createProject, deleteProject, addSubmissionToProject } from '../controllers/projectController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getProjects);
router.post('/', createProject);
router.delete('/:id', deleteProject);
router.post('/:id/submissions/:submissionId', addSubmissionToProject);

export default router;
