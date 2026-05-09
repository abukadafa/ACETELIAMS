import { Response } from 'express';
import User from '../models/User.model';

/**
 * Get all facilitators (Public/Authenticated)
 */
export const getAllFacilitators = async (req: any, res: Response) => {
    try {
        const facilitators = await User.find({ role: 'facilitator' })
            .select('name email programmes status studentId');
        res.json(facilitators);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
