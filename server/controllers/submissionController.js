import Submission from '../models/Submission.js';
import { logActivity } from '../services/firebaseService.js';

// GET /api/submissions
export const getSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, language, search } = req.query;
    const query = { userId: req.user._id };
    if (language) query.language = language;
    if (search) {
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      query.title = { $regex: escapedSearch, $options: 'i' };
    }

    const total = await Submission.countDocuments(query);
    const submissions = await Submission.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-originalCode -correctedCode');

    res.json({
      success: true,
      submissions,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/submissions/:id
export const getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    res.json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/submissions/:id
export const deleteSubmission = async (req, res) => {
  try {
    // Only admins can delete submissions!
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only admins can delete submissions.' });
    }

    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    await logActivity(req.user._id, 'delete_submission', { submissionId: req.params.id });
    res.json({ success: true, message: 'Submission deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/submissions/stats
export const getStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, byLanguage, recentSubmissions, avgScoreRes, timeSeries, qualityTrend] = await Promise.all([
      Submission.countDocuments({ userId }),

      Submission.aggregate([
        { $match: { userId } },
        { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$qualityScore' } } },
        { $sort: { count: -1 } },
      ]),

      Submission.find({ userId }).sort({ createdAt: -1 }).limit(5)
        .select('title language qualityScore createdAt errors'),

      Submission.aggregate([
        { $match: { userId } },
        { $group: { _id: null, avg: { $avg: '$qualityScore' } } },
      ]),

      // Daily analysis count — last 30 days
      Submission.aggregate([
        { $match: { userId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count:      { $sum: 1 },
            errorsFound:{ $sum: { $size: '$errors' } },
            avgScore:   { $avg: '$qualityScore' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Quality trend — last 10 analyses
      Submission.find({ userId }).sort({ createdAt: -1 }).limit(10)
        .select('qualityScore createdAt title'),
    ]);

    res.json({
      success: true,
      stats: {
        totalAnalyses:       total,
        averageQualityScore: Math.round(avgScoreRes[0]?.avg || 0),
        byLanguage,
        recentSubmissions,
        timeSeries,
        qualityTrend: qualityTrend.reverse(), // chronological order
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/submissions/:id/star
export const toggleStarSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    submission.isStarred = !submission.isStarred;
    if (submission.isStarred) {
      submission.expiresAt = undefined;
    } else {
      submission.expiresAt = new Date(submission.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    await submission.save();
    res.json({ success: true, message: submission.isStarred ? 'Submission starred!' : 'Submission unstarred.', submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/submissions/:id/request-delete
export const requestDeleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id, userId: req.user._id });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    submission.isDeleteRequested = true;
    await submission.save();
    res.json({ success: true, message: 'Deletion request sent to admin.', submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

