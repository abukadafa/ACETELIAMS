import mongoose from 'mongoose';
import { env } from './env';
import logger from '../utils/logger';

/**
 * Mongoose connection with institutional retry logic
 */
const connectDB = async (): Promise<void> => {
    const mongoURI = env.MONGODB_URI;
    let attempts = 0;
    const maxAttempts = 5;

    // Enable detailed logging for queries in development or if SLOW_QUERY_LOG is enabled
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_QUERIES === 'true') {
        mongoose.set('debug', (collectionName, method, query, doc) => {
            logger.debug(`Mongoose: ${collectionName}.${method}`, { query, doc });
        });
    }

    while (attempts < maxAttempts) {
        try {
            attempts++;
            await mongoose.connect(mongoURI);
            logger.info('ACETEL IAMS: MongoDB connected successfully');
            return;
        } catch (error: any) {
            logger.error(`MongoDB connection attempt ${attempts} failed`, { error: error.message });
            if (attempts >= maxAttempts) {
                logger.error('CRITICAL: Max connection attempts reached. Exiting.');
                throw error;
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

export default connectDB;
