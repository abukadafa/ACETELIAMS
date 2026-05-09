import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    createUser,
    bulkCreateUsers,
    getPublicStats,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { updateUserSchema } from '../schemas/security.schema';

const router = express.Router();

// Public route for landing page
router.get('/stats', getPublicStats);

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.post('/', authenticate, authorize('admin'), createUser);
router.post('/bulk', authenticate, authorize('admin'), bulkCreateUsers);
router.get('/:id', authenticate, authorize('admin', 'facilitator'), getUserById);
router.put('/:id', authenticate, authorize('admin'), validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

// MFA Management (TASK 2.6)
import { resetUserMFA } from '../controllers/auth.controller';
router.post('/:userId/reset-mfa', authenticate, authorize('admin'), resetUserMFA);

export default router;
