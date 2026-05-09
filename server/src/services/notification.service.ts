import Notification from '../models/Notification.model';
import User from '../models/User.model';

/**
 * Notification Service
 * Handles system-wide notifications and persistent storage
 */

export const initNotifications = () => {
    console.log('🔔 Notification service initialized');
};

export const createNotification = async (data: {
    recipient: string;
    type: 'admission' | 'registration' | 'graduation' | 'system' | 'role_assignment';
    title: string;
    message: string;
    relatedId?: string;
}) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        
        // In a real production app with WebSockets, you'd emit to the recipient here
        // io.to(data.recipient).emit('notification', notification);
        
        return notification;
    } catch (error) {
        console.error('[Notification Service] Error creating notification:', error);
    }
};

/**
 * Convenience method to notify all admins
 */
export const notifyAdmins = async (data: {
    type: 'system' | 'admission';
    title: string;
    message: string;
    relatedId?: string;
}) => {
    try {
        const admins = await User.find({ role: 'admin' });
        const notifications = admins.map(admin => ({
            ...data,
            recipient: admin._id
        }));
        
        await Notification.insertMany(notifications);
    } catch (error) {
        console.error('[Notification Service] Error notifying admins:', error);
    }
};

/**
 * Fetch unread notifications for a user
 */
export const getUserNotifications = async (userId: string, limit = 20) => {
    return await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string) => {
    return await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
};
