import mongoose, { Document, Schema } from 'mongoose';

export interface IAcademicCourse extends Document {
    code: string;
    title: string;
    programme: string;
    semester: number;
    category: 'Core' | 'Elective' | 'General';
    creditUnits: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const AcademicCourseSchema: Schema = new Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        programme: {
            type: String,
            required: true,
            enum: [
                'MSc Artificial Intelligence',
                'MSc Cybersecurity',
                'MSc Management Information System',
                'PhD Artificial Intelligence',
                'PhD Cybersecurity',
                'PhD Management Information System',
                'General', // for cross-programme General courses
            ],
            trim: true,
        },
        semester: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
        },
        category: {
            type: String,
            required: true,
            enum: ['Core', 'Elective', 'General'],
        },
        creditUnits: {
            type: Number,
            default: 3,
            min: 1,
            max: 6,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Archived'],
            default: 'Active',
        },
    },
    { timestamps: true }
);

// Index for fast per-programme + per-category queries
AcademicCourseSchema.index({ programme: 1, category: 1 });
AcademicCourseSchema.index({ programme: 1, semester: 1 });

export default mongoose.model<IAcademicCourse>('AcademicCourse', AcademicCourseSchema);
