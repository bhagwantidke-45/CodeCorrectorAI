import express from 'express';
import { getUsers, toggleUserStatus, deleteUser, updateUserRole, getAdminStats } from '../controllers/adminController.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

router.use(auth, adminAuth);

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
