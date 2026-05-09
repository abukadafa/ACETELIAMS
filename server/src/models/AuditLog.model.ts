import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    userId?: mongoose.Types.ObjectId;
    userName?: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: any;
    ipAddress: string;
    userAgent: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    userName: {
        type: String,
        index: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    resource: {
        type: String,
        required: true,
        index: true
    },
    resourceId: {
        type: String,
        index: true
    },
    changes: {
        type: Schema.Types.Mixed
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success',
        required: true
    },
    errorMessage: {
        type: String
    }
}, {
    timestamps: { createdAt: true, updatedAt: false } // Read-only once created
});

// TTL Index for 3-year retention policy (TASK 4.2)
// 3 years = 3 * 365 * 24 * 60 * 60 = 94,608,000 seconds
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 94608000 });

// Enforce read-only at Mongoose level
AuditLogSchema.pre('save', function(this: any) {
    if (!this.isNew) {
        throw new Error('Audit logs are immutable and cannot be modified.');
    }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
