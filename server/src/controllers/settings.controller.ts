import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import configService from '../services/config.service';
import emailService from '../services/email.service';

// Get all system settings (admin only)
export const getSettings = async (req: AuthRequest, res: Response) => {
    try {
        const general = await configService.get('general');
        const smtp = await configService.get('smtp');
        const templates = await configService.get('notification_templates');

        res.json({
            general: general || { appName: 'ACETEL IAMS', logoUrl: '', faviconUrl: '', primaryColor: '#1e3a8a', secondaryColor: '#3b6d11' },
            smtp: smtp ? { ...smtp, auth: { user: (smtp as any).auth?.user || '', pass: '***' } } : null,
            notification_templates: templates || {}
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
};

// Update system settings (admin only)
export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const { key, value } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!['general', 'smtp', 'notification_templates'].includes(key)) {
            return res.status(400).json({ message: 'Invalid settings key' });
        }

        await configService.set(key, value, userId);

        res.json({ message: 'Settings updated successfully', key });
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
};

// Test SMTP connection
export const testSMTP = async (req: AuthRequest, res: Response) => {
    try {
        const { smtpConfig } = req.body;

        await emailService.testConnection(smtpConfig);

        res.json({ message: 'SMTP connection successful' });
    } catch (error: any) {
        res.status(500).json({ message: 'SMTP connection failed', error: error.message });
    }
};
