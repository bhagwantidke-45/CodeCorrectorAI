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

// Security Middleware
app.use(helmet());
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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

// MongoDB Connection & Server Start
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas connected');
    app.listen(PORT, () => {
      console.log(`🚀 CleanCoder API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
