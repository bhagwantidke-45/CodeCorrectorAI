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
import authRoutes         from './routes/auth.js';
import submissionRoutes   from './routes/submissions.js';
import aiRoutes           from './routes/ai.js';
import reportRoutes       from './routes/reports.js';
import adminRoutes        from './routes/admin.js';
import projectRoutes      from './routes/projects.js';
import shareRoutes        from './routes/share.js';
import challengeRoutes    from './routes/challenges.js';
import contestRoutes      from './routes/contests.js';
import githubRoutes       from './routes/github.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MongoDB connection (singleton, safe for serverless) ──────────────────────
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected || mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set');
  }
  await mongoose.connect(process.env.MONGO_URI);
  dbConnected = true;
  console.log('✅ MongoDB connected');
};

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow localhost (dev) + the deployed frontend URL (set CLIENT_URL in Vercel)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);                     // curl / Postman
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') return callback(null, true); // dev: allow all
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Standard middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files (PDFs etc.)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// ── DB connection middleware — MUST be before routes ─────────────────────────
// On Vercel each cold-start needs to (re-)establish the connection.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable. Please try again in a moment.' });
  }
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/submissions',   submissionRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/reports',       reportRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/share',         shareRoutes);
app.use('/api/challenges',    challengeRoutes);
app.use('/api/contests',      contestRoutes);
app.use('/api/github',        githubRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check (useful to verify Vercel deployment is alive)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0',
  });
});

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start server (local dev only — Vercel uses the exported app) ─────────────
if (process.env.NODE_ENV !== 'production') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('Startup failed:', err.message);
      process.exit(1);
    });
}

export default app;
