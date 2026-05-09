import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
    name: string;        // e.g., "Create Student"
    code: string;        // e.g., "student:create"
    description: string;
    module: string;      // e.g., "admissions", "registry", "users"
}

const PermissionSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    module: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IPermission>('Permission', PermissionSchema);
