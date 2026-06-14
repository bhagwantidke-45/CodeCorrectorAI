import mongoose from 'mongoose';

const errorSchema = new mongoose.Schema({
  line: { type: Number, default: null },
  type: { type: String, enum: ['syntax', 'logical', 'runtime', 'warning', 'style'], default: 'syntax' },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  message: { type: String, required: true },
  fix: { type: String, default: '' },
  explanation: { type: String, default: '' },
}, { _id: false });

const optimizationSchema = new mongoose.Schema({
  category: { type: String, default: 'general' },
  suggestion: { type: String, required: true },
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null for guest users
  },
  originalCode: {
    type: String,
    required: [true, 'Original code is required'],
    maxlength: [100000, 'Code too large (max 100KB)'],
  },
  correctedCode: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    enum: ['c', 'cpp', 'java', 'python', 'javascript', 'typescript', 'php', 'go'],
  },
  errors: [errorSchema],
  optimizations: [optimizationSchema],
  explanations: [{ type: String }],
  timeComplexity: { type: String, default: 'N/A' },
  spaceComplexity: { type: String, default: 'N/A' },
  qualityScore: { type: Number, default: 0, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  title: { type: String, default: 'Untitled Analysis' },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  tokenUsage: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for fast queries
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ language: 1 });
submissionSchema.index({ status: 1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
