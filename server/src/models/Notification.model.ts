import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId; // User ID
    type: 'admission' | 'registration' | 'graduation' | 'system' | 'role_assignment';
    title: string;
    message: string;
    read: boolean;
    relatedId?: string; // Optional ID for the entity related to notification
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['admission', 'registration', 'graduation', 'system', 'role_assignment'], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedId: { type: String }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
