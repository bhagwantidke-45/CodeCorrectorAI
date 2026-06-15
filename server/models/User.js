import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  avatar: {
    type: String,
    default: '',
  },
  analysisCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  // JWT refresh token
  refreshToken: {
    type: String,
    default: null,
    select: false,
  },
  refreshTokenExpiry: {
    type: Date,
    default: null,
  },
  // Gamification
  streak: {
    type: Number,
    default: 0,
  },
  lastAnalysisDate: {
    type: Date,
    default: null,
  },
  badges: {
    type: [String],
    default: [],
  },
  xp: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },

  // Challenge Progress
  solvedChallenges: [{
    challenge:  { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    solvedAt:   { type: Date, default: Date.now },
    language:   { type: String, default: 'javascript' },
    timeTaken:  { type: Number, default: 0 },   // seconds
    points:     { type: Number, default: 10 },
  }],
  challengeStreak:    { type: Number, default: 0 },
  lastChallengeDate:  { type: Date, default: null },

  // Contest participation
  contestsJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contest' }],
  contestPoints:  { type: Number, default: 0 },

  // GitHub integration
  githubUsername: { type: String, default: null },
  githubSynced:   { type: Boolean, default: false },
  githubRepos:    [{
    name:        { type: String },
    url:         { type: String },
    language:    { type: String },
    stars:       { type: Number, default: 0 },
    description: { type: String, default: '' },
  }],

  // Learning Path
  learningPath: {
    selectedPath:   { type: String, default: null },   // e.g. 'dsa-beginner'
    completedTopics:{ type: [String], default: [] },
    currentTopic:   { type: String, default: null },
    progress:       { type: Number, default: 0 },       // 0–100
  },

  // Daily challenge
  dailyChallengeStreak:    { type: Number, default: 0 },
  lastDailyChallengeDate:  { type: Date, default: null },
  dailyChallengesCompleted:{ type: Number, default: 0 },

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
