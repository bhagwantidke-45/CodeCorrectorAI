import Submission from '../models/Submission.js';
import { logActivity } from '../services/firebaseService.js';

// GET /api/submissions
export const getSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, language, search } = req.query;
    const query = { userId: req.user._id };
    if (language) query.language = language;
    if (search) query.title = { $regex: search, $options: 'i' };

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
    const submission = await Submission.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
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
    const [total, byLanguage, recentErrors] = await Promise.all([
      Submission.countDocuments({ userId }),
      Submission.aggregate([
        { $match: { userId } },
        { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$qualityScore' } } },
        { $sort: { count: -1 } },
      ]),
      Submission.find({ userId }).sort({ createdAt: -1 }).limit(5).select('title language qualityScore createdAt errors'),
    ]);

    const avgScore = await Submission.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avg: { $avg: '$qualityScore' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalAnalyses: total,
        averageQualityScore: Math.round(avgScore[0]?.avg || 0),
        byLanguage,
        recentSubmissions: recentErrors,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
