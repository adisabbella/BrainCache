import mongoose from 'mongoose';
import { config } from '../config/index';

/**
 * Connects to MongoDB using the configured URI.
 * Exits the process if the initial connection fails.
 */
export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[Database] Connected to MongoDB');
  } catch (err) {
    console.error('[Database] Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}
