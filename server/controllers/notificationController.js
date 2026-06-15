import Notification from '../models/Notification.js';

// GET /api/notifications — fetch latest 30 notifications for logged-in user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// PATCH /api/notifications/:id/read — mark one notification as read
export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

// PATCH /api/notifications/read-all — mark all as read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all read' });
  }
};

// DELETE /api/notifications/:id — delete one notification
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};

// Helper: create a notification programmatically (used by other controllers)
export const createNotification = async ({ userId, type, title, message, icon, link, meta }) => {
  try {
    await Notification.create({ user: userId, type, title, message, icon: icon || '🔔', link, meta });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};
