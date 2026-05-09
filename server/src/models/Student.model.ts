import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  matricNo: string;
  surname: string;
  otherNames: string;
  name: string;
  /** Intake cohort, e.g. 2024_2 */
  cohort?: string;
  programme: string;
  semester: number;
  level: number;
  year: number;
  nationality: string;
  gender: string;
  email: string;
  personalEmail: string;
  instEmail: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended';
  entrySession: string;
  gradYear?: number;
  isAutoPulled?: boolean;
  applicationRef?: mongoose.Types.ObjectId;
}

const StudentSchema = new Schema<IStudent>({
  matricNo: { type: String, unique: true, sparse: true },
  surname: { type: String, default: '' },
  otherNames: { type: String, default: '' },
  name: { type: String, required: true },
  cohort: { type: String, default: '', trim: true },
  programme: { type: String, default: '' },
  semester: { type: Number, default: 1 },
  level: { type: Number, default: 800 },
  year: { type: Number, default: 1 },
  nationality: { type: String, default: '' },
  gender: { type: String, default: 'N/A' },
  email: { type: String, default: '' },
  personalEmail: { type: String, default: '' },
  instEmail: { type: String, default: '' },
  phone: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated', 'Suspended'], default: 'Active' },
  entrySession: { type: String, default: '' },
  gradYear: { type: Number },
  isAutoPulled: { type: Boolean, default: false },
  applicationRef: { type: Schema.Types.ObjectId, ref: 'Application' },
}, { timestamps: true });

StudentSchema.index({ cohort: 1, programme: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
