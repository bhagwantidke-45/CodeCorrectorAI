import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name too long'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description too long'],
  },
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
  }],
  language: {
    type: String,
    enum: ['c', 'cpp', 'java', 'python', 'javascript', 'typescript', 'php', 'go', 'mixed'],
    default: 'mixed',
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

projectSchema.index({ userId: 1, createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
