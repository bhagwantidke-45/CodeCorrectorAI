import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

reportSchema.index({ userId: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);
export default Report;
