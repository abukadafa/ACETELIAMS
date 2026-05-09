import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
    name: string;        // e.g., "admissions_officer", "coordinator"
    displayName: string; // e.g., "Admissions Officer"
    permissions: mongoose.Types.ObjectId[]; // References to Permission model
    isSystemRole: boolean; // Protect from deletion if critical
    description: string;
}

const RoleSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true },
    permissions: [{ type: Schema.Types.ObjectId, ref: 'Permission' }],
    isSystemRole: { type: Boolean, default: false },
    description: { type: String }
}, { timestamps: true });

export default mongoose.model<IRole>('Role', RoleSchema);
