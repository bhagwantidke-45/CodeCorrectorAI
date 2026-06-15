import mongoose from 'mongoose';

const contestParticipantSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score:      { type: Number, default: 0 },
  rank:       { type: Number, default: 0 },
  solvedAt:   [{ challengeId: mongoose.Schema.Types.ObjectId, time: Number, points: Number }],
  joinedAt:   { type: Date, default: Date.now },
}, { _id: false });

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Contest title is required'],
    trim: true,
    maxlength: [200, 'Title too long'],
  },
  description: { type: String, default: '' },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },

  // Timing
  startTime:  { type: Date, required: true },
  endTime:    { type: Date, required: true },
  duration:   { type: Number, default: 90 },  // minutes

  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended', 'cancelled'],
    default: 'upcoming',
  },

  // Problems
  challenges: [{
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    points:    { type: Number, default: 100 },
    order:     { type: Number, default: 0 },
  }],

  // Participants
  participants:  [contestParticipantSchema],
  maxParticipants: { type: Number, default: 10000 },

  // Contest type
  type: {
    type: String,
    enum: ['weekly', 'daily', 'special', 'company'],
    default: 'weekly',
  },

  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
    default: 'mixed',
  },

  prizes: [{ rank: Number, prize: String }],
  rules:  [{ type: String }],

  // Leaderboard snapshot (cached)
  leaderboard: [{
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:    { type: String },
    score:   { type: Number },
    rank:    { type: Number },
    solvedCount: { type: Number },
  }],

  isActive:  { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Auto-generate slug
contestSchema.pre('save', function (next) {
  if (this.isNew && !this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Date.now();
  }
  // Auto-update status
  const now = new Date();
  if (now < this.startTime) this.status = 'upcoming';
  else if (now >= this.startTime && now < this.endTime) this.status = 'live';
  else if (now >= this.endTime) this.status = 'ended';
  next();
});

contestSchema.index({ startTime: -1 });
contestSchema.index({ status: 1 });
contestSchema.index({ type: 1, status: 1 });

const Contest = mongoose.model('Contest', contestSchema);
export default Contest;
