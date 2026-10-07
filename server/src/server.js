import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import trashRoutes from './routes/trashRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure middleware for CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', app: 'Noteeye API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/trash', trashRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
  });
});

// Connect to database before starting HTTP listener
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[Server] Noteeye API running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[Server] Server startup aborted: ${error.message}`);
    process.exit(1);
  }
};

startServer();

export default app;
