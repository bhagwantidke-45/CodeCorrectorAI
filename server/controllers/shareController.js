import Submission from '../models/Submission.js';
import { v4 as uuidv4 } from 'uuid';

// POST /api/share/:id — make a submission public and return its slug
export const createShareLink = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    if (!submission.slug) {
      submission.slug = uuidv4().replace(/-/g, '').slice(0, 12);
    }
    submission.isPublic = true;
    await submission.save();

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/share/${submission.slug}`;
    res.json({ success: true, slug: submission.slug, shareUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/share/:id — make private again
export const revokeShareLink = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

    submission.isPublic = false;
    submission.slug     = null;
    await submission.save();
    res.json({ success: true, message: 'Share link revoked.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/share/:slug — public read-only view (no auth)
export const getSharedAnalysis = async (req, res) => {
  try {
    const submission = await Submission.findOne({ slug: req.params.slug, isPublic: true })
      .select('-userId -tokenUsage');
    if (!submission) return res.status(404).json({ success: false, message: 'Shared analysis not found or has been made private.' });
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
