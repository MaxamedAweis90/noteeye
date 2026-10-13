import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import trashRoutes from './routes/trashRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Production CORS & Preflight OPTIONS Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;

  // Dynamically allow requesting origin (or fallback to wildcard)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, X-Api-Version, Idempotency-Key, idempotency-key, *'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Fast preflight response for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

// 2. Standard CORS package fallback
app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token',
      'X-Api-Version',
      'Idempotency-Key',
      'idempotency-key',
    ],
  })
);
app.options('*', cors());

// 3. Request body parsing
app.use(express.json({ limit: '10mb' }));

// 4. Serverless MongoDB connection middleware
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('[DB Middleware Error]', err?.message || err);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    app: 'Noteeye API (TypeScript)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

// Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);

// Backward compatibility alias: /api/items -> noteRoutes
app.use('/api/items', noteRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

// Standalone HTTP listener (Local development ONLY, never on Vercel serverless)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL && !process.env.VERCEL_ENV) {
  const killStaleProcess = async (port: number | string) => {
    try {
      const { execSync } = await import('node:child_process');
      const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = stdout.split('\n').filter((l) => l.includes('LISTENING') || l.includes('Listen'));
      const pids = new Set<string>();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1]?.trim();
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          pids.add(pid);
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Server] Automatically cleared stale process ${pid} on port ${port}`);
        } catch {}
      }
    } catch {}
  };

  const startServer = async () => {
    try {
      await connectDB();

      const tryListen = (attemptsLeft = 2) => {
        const server = app.listen(PORT, () => {
          console.log(`[Server] Noteeye API running on port ${PORT}`);
        });

        server.on('error', async (err: any) => {
          if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
            console.warn(`[Server] Port ${PORT} was occupied. Automatically clearing stale process...`);
            await killStaleProcess(PORT);
            setTimeout(() => tryListen(attemptsLeft - 1), 500);
          } else {
            console.error('[Server] Listen error:', err.message);
          }
        });
      };

      tryListen();
    } catch (error: any) {
      console.error(`[Server] Startup error: ${error.message}`);
    }
  };

  startServer();
}

export default app;

