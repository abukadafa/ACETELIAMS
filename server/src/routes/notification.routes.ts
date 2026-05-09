import express from 'express';
import { Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import * as notificationService from '../services/notification.service';

const router = express.Router();

// Get recent notifications for the logged-in user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        
        const notifications = await notificationService.getUserNotifications(userId);
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id as string);
        res.json(notification);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});

export default router;
