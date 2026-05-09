import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
    user: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    replacedByToken?: string;
    revokedAt?: Date;
    revokedByIp?: string;
    createdAt: Date;
    isExpired: boolean;
    isActive: boolean;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    replacedByToken: { type: String },
    revokedAt: { type: Date },
    revokedByIp: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

RefreshTokenSchema.virtual('isExpired').get(function (this: IRefreshToken) {
    return new Date() >= this.expiresAt;
});

RefreshTokenSchema.virtual('isActive').get(function (this: IRefreshToken) {
    return !this.revokedAt && !this.isExpired;
});

RefreshTokenSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        delete ret._id;
        delete ret.id;
        delete ret.user;
    }
});

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
