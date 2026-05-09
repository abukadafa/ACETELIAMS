import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import {
    getAllFacilitators
} from '../controllers/facilitator.controller';

const router = express.Router();

/**
 * @route   GET /api/facilitators/all
 * @desc    Get all facilitators
 * @access  Public
 */
router.get('/all', getAllFacilitators);

/**
 * @route   GET /api/facilitators/stats
 * @desc    Get facilitator statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
    try {
        const User = (await import('../models/User.model')).default;
        const [total, byProgramme] = await Promise.all([
            User.countDocuments({ role: 'facilitator' }),
            User.aggregate([
                { $match: { role: 'facilitator' } },
                { $unwind: '$programmes' },
                { $group: { _id: '$programmes', count: { $sum: 1 } } },
                { $project: { name: '$_id', value: '$count', _id: 0 } }
            ])
        ]);
        res.json({ total, byProgramme });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
