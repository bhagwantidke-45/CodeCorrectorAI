import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  primary: '#6366f1',
  dark: '#1e1b4b',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  red: '#ef4444',
  green: '#22c55e',
  yellow: '#f59e0b',
  white: '#ffffff',
};

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#22c55e',
};

export const generatePDFReport = async (submission, user) => {
  const reportsDir = path.join(__dirname, '../uploads/reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const fileName = `report-${submission._id}-${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ── Header ──────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 100).fill(COLORS.dark);
    doc.fillColor(COLORS.white).fontSize(28).font('Helvetica-Bold')
      .text('CleanCoder AI', 50, 25, { align: 'left' });
    doc.fontSize(12).font('Helvetica').fillColor('#a5b4fc')
      .text('Code Analysis Report', 50, 60);
    doc.fillColor(COLORS.white).fontSize(10)
      .text(`Generated: ${new Date().toLocaleString()}`, 50, 78);

    // ── User Info ────────────────────────────────────────────
    doc.moveDown(2);
    doc.fillColor(COLORS.dark).fontSize(14).font('Helvetica-Bold').text('Report Details', 50, 115);
    doc.moveTo(50, 132).lineTo(545, 132).strokeColor(COLORS.primary).lineWidth(2).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.gray);
    doc.text(`Analyst: ${user?.name || 'Guest User'}`, 50);
    doc.text(`Email: ${user?.email || 'N/A'}`);
    doc.text(`Language: ${submission.language?.toUpperCase()}`);
    doc.text(`Analysis Date: ${new Date(submission.createdAt).toLocaleDateString()}`);
    doc.text(`Quality Score: ${submission.qualityScore}/100`);
    doc.text(`Errors Found: ${submission.errors?.length || 0}`);

    // ── Summary ───────────────────────────────────────────────
    if (submission.summary) {
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark).text('Summary');
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor(COLORS.primary).lineWidth(2).stroke();
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.gray).text(submission.summary, { width: 495 });
    }

    // ── Errors ────────────────────────────────────────────────
    if (submission.errors?.length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark).text('Errors Detected');
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor('#ef4444').lineWidth(2).stroke();
      doc.moveDown(0.5);
      submission.errors.forEach((err, i) => {
        const sevColor = SEVERITY_COLORS[err.severity] || COLORS.gray;
        doc.fontSize(10).font('Helvetica-Bold').fillColor(sevColor)
          .text(`${i + 1}. [${err.severity?.toUpperCase()}] ${err.message}`, 50, doc.y, { continued: false });
        doc.font('Helvetica').fillColor(COLORS.gray).fontSize(9);
        if (err.line) doc.text(`   Line: ${err.line} | Type: ${err.type}`);
        if (err.fix) doc.text(`   Fix: ${err.fix}`, { width: 490 });
        if (err.explanation) doc.text(`   Explanation: ${err.explanation}`, { width: 490 });
        doc.moveDown(0.4);
      });
    }

    // ── Optimizations ─────────────────────────────────────────
    if (submission.optimizations?.length > 0) {
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark).text('Optimization Suggestions');
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor(COLORS.green).lineWidth(2).stroke();
      doc.moveDown(0.5);
      submission.optimizations.forEach((opt, i) => {
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.gray)
          .text(`${i + 1}. [${opt.category}] ${opt.suggestion}`, { width: 490 });
      });
    }

    // ── Complexity ────────────────────────────────────────────
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark).text('Complexity Analysis');
    doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor(COLORS.primary).lineWidth(2).stroke();
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).fillColor(COLORS.gray);
    doc.text(`Time Complexity: ${submission.timeComplexity || 'N/A'}`);
    doc.text(`Space Complexity: ${submission.spaceComplexity || 'N/A'}`);

    // ── Original Code ─────────────────────────────────────────
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark).text('Original Code');
    doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor(COLORS.gray).lineWidth(2).stroke();
    doc.moveDown(0.5);
    doc.rect(50, doc.y, 495, Math.min(submission.originalCode?.length / 3 + 20, 300))
      .fill('#f8f9fa');
    doc.font('Courier').fontSize(8).fillColor(COLORS.dark)
      .text(submission.originalCode?.substring(0, 3000) || '', 55, doc.y + 5, { width: 485 });

    // ── Corrected Code ────────────────────────────────────────
    if (submission.correctedCode) {
      doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.dark).text('Corrected Code');
      doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor(COLORS.green).lineWidth(2).stroke();
      doc.moveDown(0.5);
      doc.font('Courier').fontSize(8).fillColor(COLORS.dark)
        .text(submission.correctedCode?.substring(0, 3000) || '', 55, doc.y + 5, { width: 485 });
    }

    // ── Footer ────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.fontSize(8).fillColor(COLORS.gray)
        .text(`CleanCoder AI — Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, { align: 'center', width: 495 });
    }

    doc.end();
    stream.on('finish', () => resolve({ fileName, filePath, fileSize: fs.statSync(filePath).size }));
    stream.on('error', reject);
  });
};
