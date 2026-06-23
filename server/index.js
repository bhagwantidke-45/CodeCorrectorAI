import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Routes
import authRoutes       from './routes/auth.js';
import submissionRoutes from './routes/submissions.js';
import aiRoutes         from './routes/ai.js';
import reportRoutes     from './routes/reports.js';
import adminRoutes      from './routes/admin.js';
import projectRoutes    from './routes/projects.js';
import shareRoutes      from './routes/share.js';
import challengeRoutes  from './routes/challenges.js';
import contestRoutes       from './routes/contests.js';
import githubRoutes         from './routes/github.js';
import notificationRoutes   from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS ────────────────────────────────────────────────────────────────────
// Always allow localhost for dev; allow the production frontend URL from env.
// In Vercel, set CLIENT_URL=https://code-corrector-ai-frontend.vercel.app
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development, allow all origins for convenience
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files (for generated PDFs)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth',        authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/projects',    projectRoutes);
app.use('/api/share',       shareRoutes);
app.use('/api/challenges',    challengeRoutes);
app.use('/api/contests',      contestRoutes);
app.use('/api/github',        githubRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── MongoDB + Server Start ───────────────────────────────────────────────────
// In Vercel serverless, we export the app and let Vercel handle HTTP.
// Locally (NODE_ENV=development or when run directly), we start a real server.
let dbConnected = false;

export const connectDB = async () => {
  if (dbConnected || mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    dbConnected = true;
    console.log('✅ MongoDB Atlas connected');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
};

// Middleware to lazily connect to DB on first request (required for Vercel cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable, please try again.' });
  }
});

// Start server when NOT on Vercel (local dev or traditional hosting)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 CleanCoder API running on http://localhost:${PORT}`);
    });
  }).catch(() => process.exit(1));
}

export default app;

