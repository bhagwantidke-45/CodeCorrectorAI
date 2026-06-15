import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
  input:          { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden:       { type: Boolean, default: false },
  explanation:    { type: String, default: '' },
});

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title too long'],
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
    default: 'medium',
  },
  category: {
    type: String,
    enum: [
      'arrays', 'strings', 'linked-lists', 'trees', 'graphs',
      'dynamic-programming', 'recursion', 'sorting', 'binary-search',
      'hashing', 'two-pointers', 'sliding-window', 'math', 'greedy',
      'backtracking', 'stack-queue', 'heap', 'trie', 'bit-manipulation', 'other',
    ],
    default: 'other',
  },
  tags: [{ type: String, trim: true }],
  companies: [{ type: String, trim: true }],      // e.g. ['Google', 'Amazon']
  topics: [{ type: String, trim: true }],          // e.g. ['BFS', 'DFS']

  starterCode: {
    javascript: { type: String, default: '// Write your solution here\n' },
    python:     { type: String, default: '# Write your solution here\n' },
    java:       { type: String, default: '// Write your solution here\n' },
    cpp:        { type: String, default: '// Write your solution here\n' },
  },

  solutionCode: {
    javascript: { type: String, default: '' },
    python:     { type: String, default: '' },
  },

  testCases:     [testCaseSchema],
  hints:         [{ type: String }],
  constraints:   [{ type: String }],
  examples: [{
    input:       { type: String },
    output:      { type: String },
    explanation: { type: String },
  }],

  // AI-generated flag
  isAiGenerated: { type: Boolean, default: false },
  aiPrompt:      { type: String, default: '' },      // the prompt used to generate

  // Daily challenge metadata
  isDailyChallenge: { type: Boolean, default: false },
  dailyDate:        { type: Date, default: null },

  // Stats
  totalAttempts: { type: Number, default: 0 },
  totalSolved:   { type: Number, default: 0 },
  acceptanceRate:{ type: Number, default: 0 },
  likes:         { type: Number, default: 0 },
  dislikes:      { type: Number, default: 0 },

  // Scoring
  points:        { type: Number, default: 10 },
  timeLimit:     { type: Number, default: 2000 },  // ms
  memoryLimit:   { type: Number, default: 256 },   // MB

  isActive:      { type: Boolean, default: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Auto-generate slug from title
challengeSchema.pre('save', function (next) {
  if (this.isNew && !this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Date.now();
  }
  // Update acceptance rate
  if (this.totalAttempts > 0) {
    this.acceptanceRate = Math.round((this.totalSolved / this.totalAttempts) * 100);
  }
  next();
});

challengeSchema.index({ difficulty: 1, category: 1 });
challengeSchema.index({ companies: 1 });
challengeSchema.index({ isDailyChallenge: 1, dailyDate: -1 });
challengeSchema.index({ isAiGenerated: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
