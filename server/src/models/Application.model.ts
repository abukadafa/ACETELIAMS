import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
    surname: string;
    otherNames: string;
    name: string;
    email: string;
    personalEmail?: string;
    phone?: string;
    programme: string;
    /** Intake cohort label, e.g. 2024_1 */
    cohort?: string;
    degreeHeld?: string;
    cgpa?: number;
    nationality?: string;
    gender?: 'Male' | 'Female' | 'Other' | 'N/A';
    /** Hub statuses: Pending | Admitted | Not Admitted (legacy seed may use pending/approved/rejected) */
    status: string;
    appliedDate: Date;
    reviewedBy?: string;
    reviewDate?: Date;
    remarks?: string;
    /** Primary reason (legacy + analytics); mirrors summary of nonAdmissionReasons */
    nonAdmissionReason?: string;
    nonAdmissionReasons?: string[];
    /** Explicit checklist flags used by automated eligibility */
    paymentReceiptUploaded?: boolean;
    bscMscCertificatesComplete?: boolean;
    oLevelSatisfactory?: boolean;
    researchProposalPass?: boolean;
    documents?: {
        certificate?: string;
        transcript?: string;
        idProof?: string;
        paymentReceipt?: string;
    };
    matricNo?: string;
    isPulled?: boolean;
    studentRef?: mongoose.Types.ObjectId;
    pullConfirmedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
    {
        surname: { type: String, default: '', trim: true },
        otherNames: { type: String, default: '', trim: true },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        personalEmail: { type: String, default: '', trim: true },
        phone: {
            type: String,
            trim: true,
        },
        programme: {
            type: String,
            required: true,
            trim: true,
        },
        cohort: { type: String, trim: true, default: '' },
        degreeHeld: {
            type: String,
            trim: true,
        },
        cgpa: {
            type: Number,
            min: 0,
            max: 5,
        },
        nationality: {
            type: String,
            trim: true,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other', 'N/A'],
            default: 'N/A',
        },
        status: {
            type: String,
            default: 'Pending',
            trim: true,
        },
        appliedDate: { type: Date, default: Date.now },
        reviewedBy: { type: String, trim: true },
        reviewDate: { type: Date },
        remarks: { type: String, trim: true },
        nonAdmissionReason: { type: String, trim: true, default: '' },
        nonAdmissionReasons: [{ type: String, trim: true }],
        paymentReceiptUploaded: { type: Boolean, default: false },
        bscMscCertificatesComplete: { type: Boolean, default: false },
        oLevelSatisfactory: { type: Boolean, default: false },
        researchProposalPass: { type: Boolean, default: false },
        documents: {
            certificate: { type: String, trim: true },
            transcript: { type: String, trim: true },
            idProof: { type: String, trim: true },
            paymentReceipt: { type: String, trim: true },
        },
        matricNo: { type: String, trim: true },
        isPulled: { type: Boolean, default: false },
        studentRef: { type: Schema.Types.ObjectId, ref: 'Student' },
        pullConfirmedBy: { type: String, trim: true }
    },
    { timestamps: true }
);

// Compound index for studentId + status (as requested in Phase 2A, File 5)
// Note: Application model doesn't have studentId directly, it uses name/email or studentRef.
// I'll add studentId to Application if it was intended, or use studentRef.
// The prompt says "Create collections with validators: applications (compound index: studentId + status)"
// I'll add studentId to the schema for consistency with the prompt's request for the index.
ApplicationSchema.add({
    studentId: { type: String, trim: true }
});

ApplicationSchema.index({ studentId: 1, status: 1 });
ApplicationSchema.index({ email: 1 });
ApplicationSchema.index({ appliedDate: -1 });
ApplicationSchema.index({ cohort: 1, programme: 1 });

export default mongoose.model<IApplication>('Application', ApplicationSchema);
