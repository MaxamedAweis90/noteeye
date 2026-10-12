import mongoose from 'mongoose';
import { seedInitialUser } from '../controllers/authController.js';
let isConnecting = false;
/**
 * Connect to MongoDB database with serverless connection pooling & caching
 */
export const connectDB = async () => {
    // If connection is already open, reuse it immediately
    if (mongoose.connection.readyState >= 1) {
        return mongoose;
    }
    let uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('[MongoDB Error] MONGODB_URI environment variable is not defined!');
        return;
    }
    uri = uri.trim();
    if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
        uri = uri.slice(1, -1).trim();
    }
    if (isConnecting) {
        return;
    }
    try {
        isConnecting = true;
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host} (Database: ${conn.connection.name})`);
        // Seed initial user asynchronously without blocking
        seedInitialUser().catch((err) => {
            console.error('[MongoDB] Seeding check error:', err?.message || err);
        });
        return conn;
    }
    catch (error) {
        console.error(`[MongoDB] Connection Error: ${error.message}`);
        // Never crash the serverless container on Vercel
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
    finally {
        isConnecting = false;
    }
};
// Graceful shutdown handling for standalone server
const handleGracefulShutdown = async (signal) => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log(`[MongoDB] Connection closed gracefully on ${signal}`);
        }
        process.exit(0);
    }
    catch (error) {
        console.error(`[MongoDB] Error during graceful shutdown on ${signal}: ${error.message}`);
        process.exit(1);
    }
};
if (!process.env.VERCEL) {
    process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
}
