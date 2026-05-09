import mongoose from 'mongoose';
import { env } from './env';

/**
 * Mongoose connection with institutional retry logic
 */
const connectDB = async (): Promise<void> => {
    const mongoURI = env.MONGODB_URI;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        try {
            attempts++;
            await mongoose.connect(mongoURI);
            console.log('✅ ACETEL IAMS: MongoDB connected successfully');
            return;
        } catch (error: any) {
            console.error(`❌ MongoDB connection attempt ${attempts} failed:`, error.message);
            if (attempts >= maxAttempts) {
                console.error('❌ CRITICAL: Max connection attempts reached. Exiting.');
                throw error;
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

export default connectDB;
