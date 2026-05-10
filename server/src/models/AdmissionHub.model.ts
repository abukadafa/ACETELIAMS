import mongoose, { Document, Schema } from 'mongoose';

export const NON_ADMISSION_REASONS = [
    'Low CGPA',
    'Unavailability of BSc and MSc Certificates/other relevant documents',
    'Deficiency in O\'level results',
    'Research Proposals that were deemed unresearchable and failed assessment',
    'Evidence of application payment receipts not uploaded',
] as const;

export type NonAdmissionReason = typeof NON_ADMISSION_REASONS[number];

export interface IAdmissionHub extends Document {
    name: string;
    surname?: string;
    otherNames?: string;
    email?: string;
    phone?: string;
    programme?: string;
    cohort?: string;
    matricNo?: string;
    admissionStatus: 'Admitted' | 'Not Admitted' | 'Pending';
    rejectionNotes: string[];
    linkedApplicationId?: mongoose.Types.ObjectId;
    uploadedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AdmissionHubSchema = new Schema<IAdmissionHub>(
    {
        name: { type: String, required: true, trim: true },
        surname: { type: String, trim: true },
        otherNames: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        programme: { type: String, trim: true },
        cohort: { type: String, trim: true },
        matricNo: { type: String, trim: true },
        admissionStatus: {
            type: String,
            enum: ['Admitted', 'Not Admitted', 'Pending'],
            default: 'Pending',
        },
        rejectionNotes: { type: [String], default: [] },
        linkedApplicationId: { type: Schema.Types.ObjectId, ref: 'Application', default: null },
        uploadedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

AdmissionHubSchema.index({ email: 1 });
AdmissionHubSchema.index({ cohort: 1, programme: 1 });
AdmissionHubSchema.index({ admissionStatus: 1 });

export default mongoose.model<IAdmissionHub>('AdmissionHub', AdmissionHubSchema);
