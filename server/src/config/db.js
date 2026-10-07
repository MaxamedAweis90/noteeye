import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 */
export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling for termination signals
const handleGracefulShutdown = async (signal) => {
  try {
    await mongoose.connection.close();
    console.log(`MongoDB connection closed due to ${signal}`);
    process.exit(0);
  } catch (error) {
    console.error(`Error during graceful shutdown on ${signal}: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
