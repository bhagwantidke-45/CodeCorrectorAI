import { analyzeCodeWithGroq, analyzeCodeWithGroqStream } from '../services/groqService.js';
import { logApiUsage, logError, updateAnalytics } from '../services/firebaseService.js';
import { updateGamification } from '../services/gamificationService.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';
import fs from 'fs';
import { extname } from 'path';

// POST /api/ai/analyze
export const analyzeCode = async (req, res) => {
  try {
    let { code, language, title } = req.body;

    // Handle file upload
    if (req.file) {
      code = fs.readFileSync(req.file.path, 'utf8');
      fs.unlinkSync(req.file.path);
      const extMap = { '.c': 'c', '.cpp': 'cpp', '.java': 'java', '.py': 'python', '.js': 'javascript', '.ts': 'typescript', '.php': 'php', '.go': 'go' };
      const ext = extname(req.file.originalname).toLowerCase();
      language = language || extMap[ext] || 'javascript';
    }

    if (!code || !code.trim())  return res.status(400).json({ success: false, message: 'Code is required.' });
    if (!language)              return res.status(400).json({ success: false, message: 'Language is required.' });
    if (code.length > 50000)   return res.status(400).json({ success: false, message: 'Code too large. Max 50,000 characters.' });

    const userId = req.user?._id || null;

    const result = await analyzeCodeWithGroq(code, language);

    const submission = await Submission.create({
      userId,
      originalCode:         code,
      correctedCode:        result.correctedCode,
      language,
      errors:               result.errors,
      optimizations:        result.optimizations,
      explanations:         result.explanations,
      timeComplexity:       result.timeComplexity,
      spaceComplexity:      result.spaceComplexity,
      qualityScore:         result.qualityScore,
      summary:              result.summary,
      cyclomaticComplexity: result.cyclomaticComplexity,
      maintainabilityIndex: result.maintainabilityIndex,
      severityScore:        result.severityScore,
      title:                title || `${language.toUpperCase()} Analysis`,
      status:               'completed',
      tokenUsage:           result.tokenUsage,
    });

    // Update user analysis count
    if (userId) {
      await User.findByIdAndUpdate(userId, { $inc: { analysisCount: 1 } });
    }

    // Gamification — streaks & badges
    const gamification = await updateGamification(userId, result);

    // Firebase logging
    await logApiUsage('/api/ai/analyze', userId, result.tokenUsage, language);
    await updateAnalytics('totalAnalyses');
    if (result.errors.length > 0) await updateAnalytics('totalErrorsFound', result.errors.length);

    res.json({
      success: true,
      message: 'Code analyzed successfully.',
      submissionId: submission._id,
      result,
      gamification,
    });
  } catch (error) {
    console.error('Analysis Error:', error);
    await logError(error, { endpoint: '/api/ai/analyze' });
    res.status(500).json({ success: false, message: `Analysis failed: ${error.message}` });
  }
};

// GET /api/ai/analyze/stream — Server-Sent Events streaming analysis
export const analyzeCodeStream = async (req, res) => {
  const { code, language, title } = req.query;

  if (!code || !code.trim())  return res.status(400).json({ success: false, message: 'Code is required.' });
  if (!language)              return res.status(400).json({ success: false, message: 'Language is required.' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const userId = req.user?._id || null;
    sendEvent('start', { message: 'Analysis started...' });

    const result = await analyzeCodeWithGroqStream(code, language, (chunk) => {
      sendEvent('chunk', { text: chunk });
    });

    // Save to DB
    const submission = await Submission.create({
      userId,
      originalCode:         code,
      correctedCode:        result.correctedCode,
      language,
      errors:               result.errors,
      optimizations:        result.optimizations,
      explanations:         result.explanations,
      timeComplexity:       result.timeComplexity,
      spaceComplexity:      result.spaceComplexity,
      qualityScore:         result.qualityScore,
      summary:              result.summary,
      cyclomaticComplexity: result.cyclomaticComplexity,
      maintainabilityIndex: result.maintainabilityIndex,
      severityScore:        result.severityScore,
      title:                title || `${language.toUpperCase()} Analysis`,
      status:               'completed',
    });

    if (userId) await User.findByIdAndUpdate(userId, { $inc: { analysisCount: 1 } });
    const gamification = await updateGamification(userId, result);

    sendEvent('done', { result, submissionId: submission._id, gamification });
    res.end();
  } catch (error) {
    sendEvent('error', { message: error.message });
    res.end();
  }
};
