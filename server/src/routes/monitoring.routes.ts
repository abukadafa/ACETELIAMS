import express from 'express';
import { getStatus, getAuditLogs } from '../controllers/monitoring.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Only admins can view monitoring status
router.get('/status', authenticate, authorize('admin'), getStatus);
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);

export default router;
