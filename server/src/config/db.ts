import mongoose from 'mongoose';
import { seedInitialUser } from '../controllers/authController.js';

/**
 * Connect to MongoDB database
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} (Database: ${conn.connection.name})`);

    // Seed initial user on startup if not already seeded
    await seedInitialUser();

    return conn;
  } catch (error: any) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const handleGracefulShutdown = async (signal: string) => {
  try {
    await mongoose.connection.close();
    console.log(`[MongoDB] Connection closed gracefully on ${signal}`);
    process.exit(0);
  } catch (error: any) {
    console.error(`[MongoDB] Error during graceful shutdown on ${signal}: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
