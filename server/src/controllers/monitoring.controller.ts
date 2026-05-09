import { Request, Response } from 'express';
import monitoringService from '../services/monitoring.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getStatus = async (req: AuthRequest, res: Response) => {
    try {
        const status = await monitoringService.getSystemStatus();
        res.json(status);
    } catch (error: any) {
        console.error('Monitoring Controller Error:', error);
        res.status(500).json({
            message: 'Failed to fetch monitoring status',
            error: error.message
        });
    }
};

import auditLogService from '../services/audit-log.service';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { limit, action, resource } = req.query;
        const logs = await auditLogService.getAuditLogs({
            limit: parseInt(limit as string) || 100,
            action,
            resource
        });
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
};
