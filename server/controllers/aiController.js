import { analyzeCodeWithGroq } from '../services/groqService.js';
import { logApiUsage, logError, updateAnalytics } from '../services/firebaseService.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import fs from 'fs';

// POST /api/ai/analyze
export const analyzeCode = async (req, res) => {
  try {
    let { code, language, title } = req.body;

    // Handle file upload
    if (req.file) {
      code = fs.readFileSync(req.file.path, 'utf8');
      fs.unlinkSync(req.file.path); // cleanup
      const extMap = { '.c': 'c', '.cpp': 'cpp', '.java': 'java', '.py': 'python', '.js': 'javascript', '.ts': 'typescript', '.php': 'php', '.go': 'go' };
      const ext = require('path').extname(req.file.originalname).toLowerCase();
      language = language || extMap[ext] || 'javascript';
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Code is required.' });
    }
    if (!language) {
      return res.status(400).json({ success: false, message: 'Language is required.' });
    }
    if (code.length > 50000) {
      return res.status(400).json({ success: false, message: 'Code too large. Max 50,000 characters.' });
    }

    const userId = req.user?._id || null;

    // Call Groq
    const result = await analyzeCodeWithGroq(code, language);

    // Save to MongoDB
    const submission = await Submission.create({
      userId,
      originalCode: code,
      correctedCode: result.correctedCode,
      language,
      errors: result.errors,
      optimizations: result.optimizations,
      explanations: result.explanations,
      timeComplexity: result.timeComplexity,
      spaceComplexity: result.spaceComplexity,
      qualityScore: result.qualityScore,
      summary: result.summary,
      title: title || `${language.toUpperCase()} Analysis`,
      status: 'completed',
      tokenUsage: result.tokenUsage,
    });

    // Update user analysis count
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { analysisCount: 1 } });
    }

    // Firebase logging
    await logApiUsage('/api/ai/analyze', userId, result.tokenUsage, language);
    await updateAnalytics('totalAnalyses');
    if (result.errors.length > 0) await updateAnalytics('totalErrorsFound', result.errors.length);

    res.json({
      success: true,
      message: 'Code analyzed successfully.',
      submissionId: submission._id,
      result,
    });
  } catch (error) {
    console.error('Analysis Error:', error);
    await logError(error, { endpoint: '/api/ai/analyze' });
    res.status(500).json({ success: false, message: `Analysis failed: ${error.message}` });
  }
};
