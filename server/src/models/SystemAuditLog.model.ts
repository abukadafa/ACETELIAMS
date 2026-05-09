import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemAuditLog extends Document {
    timestamp: Date;
    action: string;
    targetId?: string;
    targetName?: string;
    userId?: mongoose.Types.ObjectId;
    userName?: string;
    officerName?: string; // Legacy
    officerRole?: string; // Legacy
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    resource?: string;
    createdAt: Date;
}

const SystemAuditLogSchema: Schema = new Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    resource: { type: String },
    targetId: { type: String },
    targetName: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
    errorMessage: { type: String }
}, { timestamps: true });

// TTL Index: Auto-expire after 2 years (63,072,000 seconds)
SystemAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// Search indexes
SystemAuditLogSchema.index({ timestamp: -1 });
SystemAuditLogSchema.index({ action: 1 });
SystemAuditLogSchema.index({ userId: 1 });

export default mongoose.model<ISystemAuditLog>('SystemAuditLog', SystemAuditLogSchema);
