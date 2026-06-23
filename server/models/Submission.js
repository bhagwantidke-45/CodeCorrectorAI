import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const errorSchema = new mongoose.Schema({
  line:        { type: Number, default: null },
  type:        { type: String, enum: ['syntax', 'logical', 'runtime', 'warning', 'style'], default: 'syntax' },
  severity:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  message:     { type: String, required: true },
  fix:         { type: String, default: '' },
  explanation: { type: String, default: '' },
}, { _id: false });

const optimizationSchema = new mongoose.Schema({
  category:   { type: String, default: 'general' },
  suggestion: { type: String, required: true },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  originalCode: {
    type: String,
    required: [true, 'Original code is required'],
    maxlength: [100000, 'Code too large (max 100KB)'],
  },
  correctedCode:  { type: String, default: '' },
  language: {
    type: String,
    required: [true, 'Language is required'],
    enum: ['c', 'cpp', 'java', 'python', 'javascript', 'typescript', 'php', 'go'],
  },
  errors:         [errorSchema],
  optimizations:  [optimizationSchema],
  explanations:   [{ type: String }],
  timeComplexity: { type: String, default: 'N/A' },
  spaceComplexity:{ type: String, default: 'N/A' },
  qualityScore:   { type: Number, default: 0, min: 0, max: 100 },
  // NEW: advanced metrics
  cyclomaticComplexity: { type: Number, default: 1 },
  maintainabilityIndex: { type: Number, default: 70 },
  severityScore:        { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  title:      { type: String, default: 'Untitled Analysis' },
  summary:    { type: String, default: '' },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  tokenUsage: { type: Number, default: 0 },
  // Sharing
  slug:       { type: String, unique: true, sparse: true },
  isPublic:   { type: Boolean, default: false },
  isStarred:  { type: Boolean, default: false },
  isDeleteRequested: { type: Boolean, default: false },
  expiresAt:  { type: Date },
}, { timestamps: true });

// Auto-generate slug when making public & set expiry date
submissionSchema.pre('save', function (next) {
  if (this.isPublic && !this.slug) {
    this.slug = uuidv4().split('-')[0] + uuidv4().split('-')[0]; // 16-char slug
  }
  
  if (this.isStarred) {
    this.expiresAt = undefined;
  } else if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

submissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ language: 1 });
submissionSchema.index({ status: 1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
