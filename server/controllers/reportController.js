import Submission from '../models/Submission.js';
import Report from '../models/Report.js';
import { generatePDFReport } from '../services/pdfService.js';
import { logActivity } from '../services/firebaseService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// POST /api/reports/generate/:submissionId
export const generateReport = async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.submissionId, userId: req.user._id });
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    const { fileName, filePath, fileSize } = await generatePDFReport(submission, req.user);
    const report = await Report.create({
      submissionId: submission._id,
      userId: req.user._id,
      fileName,
      filePath,
      fileSize,
    });

    await logActivity(req.user._id, 'generate_report', { submissionId: submission._id.toString() });
    res.json({ success: true, message: 'Report generated.', reportId: report._id, fileName });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/download/:reportId
export const downloadReport = async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.reportId, userId: req.user._id });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    if (!fs.existsSync(report.filePath)) {
      return res.status(410).json({ success: false, message: 'Report file expired. Please regenerate.' });
    }

    await Report.findByIdAndUpdate(report._id, { $inc: { downloadCount: 1 } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    fs.createReadStream(report.filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('submissionId', 'title language qualityScore createdAt');
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/reports/:id
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (fs.existsSync(report.filePath)) fs.unlinkSync(report.filePath);
    res.json({ success: true, message: 'Report deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
