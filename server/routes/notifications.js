import express from 'express';
import auth from '../middleware/auth.js';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/',            auth, getNotifications);
router.patch('/read-all',  auth, markAllRead);
router.patch('/:id/read',  auth, markRead);
router.delete('/:id',      auth, deleteNotification);

export default router;
