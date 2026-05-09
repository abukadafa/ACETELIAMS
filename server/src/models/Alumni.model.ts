import mongoose, { Document, Schema } from 'mongoose';

export interface IAlumni extends Document {
    surname: string;
    otherNames: string;
    name: string; // Combined name (legacy)
    matricNo?: string;
    programme: string;
    cohort?: string;
    gradYear: number;
    level?: number; // Final level at graduation
    employer?: string;
    jobRole?: string;
    location?: string;
    instEmail?: string;
    personalEmail?: string;
    email?: string; // Legacy field
    phone?: string;
    gender?: string;
    nationality?: string;
    engagement: 'High' | 'Medium' | 'Low';
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const AlumniSchema: Schema = new Schema(
    {
        surname: { type: String, default: '', trim: true },
        otherNames: { type: String, default: '', trim: true },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        matricNo: {
            type: String,
            trim: true,
        },
        programme: {
            type: String,
            required: true,
            trim: true,
        },
        cohort: { type: String, trim: true, default: '' },
        gradYear: {
            type: Number,
            required: true,
        },
        level: { type: Number, default: 800 },
        employer: {
            type: String,
            trim: true,
        },
        jobRole: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
        },
        instEmail: { type: String, default: '', trim: true },
        personalEmail: { type: String, default: '', trim: true },
        phone: {
            type: String,
            trim: true,
        },
        gender: { type: String, default: 'N/A' },
        nationality: { type: String, default: '' },
        engagement: {
            type: String,
            enum: ['High', 'Medium', 'Low'],
            default: 'Medium',
        },
        status: { type: String, default: 'Alumni' },
    },
    { timestamps: true }
);

// Indexes for analytics queries
AlumniSchema.index({ cohort: 1, programme: 1 });
AlumniSchema.index({ programme: 1 });
AlumniSchema.index({ gradYear: 1 });
AlumniSchema.index({ engagement: 1 });

export default mongoose.model<IAlumni>('Alumni', AlumniSchema);
