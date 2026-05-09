import express from 'express';
import { getSettings, updateSettings, testSMTP } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All settings routes require admin authentication
router.get('/', authenticate, authorize('admin'), getSettings);
router.put('/', authenticate, authorize('admin'), updateSettings);
router.post('/test-smtp', authenticate, authorize('admin'), testSMTP);

export default router;
