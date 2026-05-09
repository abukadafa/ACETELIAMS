import mongoose, { Document, Schema } from 'mongoose';

export interface ICronJob extends Document {
    name: string;
    schedule: string;
    description: string;
    lastRun?: Date;
    nextRun?: Date;
    lastStatus?: 'success' | 'failure' | 'running';
    lastError?: string;
    executionCount: number;
    failureCount: number;
    details?: string;
}

const CronJobSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    schedule: { type: String, required: true },
    description: { type: String },
    lastRun: { type: Date },
    nextRun: { type: Date },
    lastStatus: { type: String, enum: ['success', 'failure', 'running'], default: 'success' },
    lastError: { type: String },
    executionCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    details: { type: String }
}, { timestamps: true });

export default mongoose.model<ICronJob>('CronJob', CronJobSchema);
