import mongoose, { Document, Schema } from 'mongoose';

/**
 * Short courses / professional development hub (`/api/short-courses`).
 * Stored in the same `courses` collection as any legacy rows; `strict: false` preserves unknown fields.
 */
export interface ICourse extends Document {
    name?: string;
    title?: string;
    students?: unknown[];
    studentsCount?: number;
    status?: string;
}

const CourseSchema: Schema = new Schema(
    {
        name: { type: String, trim: true },
        title: { type: String, trim: true },
        description: { type: String },
        duration: { type: String },
        facilitatorName: { type: String },
        facilitator: { type: String },
        startDate: { type: String },
        courseCode: { type: String, sparse: true },
        programme: { type: String },
        level: { type: String },
        credits: { type: Number },
        semester: { type: String },
        year: { type: Number },
        students: { type: [Schema.Types.Mixed], default: [] },
        studentsCount: { type: Number, default: 0 },
        status: { type: String, default: 'Active' },
    },
    { timestamps: true, strict: false }
);

export default mongoose.model<ICourse>('Course', CourseSchema);
