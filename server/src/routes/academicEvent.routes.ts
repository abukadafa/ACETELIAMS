import { Router, Request, Response } from 'express';
import AcademicEvent from '../models/AcademicEvent.model';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// GET all academic events
router.get('/', async (req: Request, res: Response) => {
    try {
        const events = await AcademicEvent.find().sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching academic events', error });
    }
});

// POST - create a new academic event
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const event = new AcademicEvent(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: 'Error creating academic event', error });
    }
});

// POST /api/academic-events/bulk — bulk import
router.post('/bulk', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { events } = req.body;
        if (!Array.isArray(events)) return res.status(400).json({ message: 'events must be an array' });
        
        const results = { inserted: 0, errors: [] as string[] };
        for (const e of events) {
            try {
                await AcademicEvent.findOneAndUpdate(
                    { name: e.name, date: e.date },
                    { ...e },
                    { upsert: true, new: true }
                );
                results.inserted++;
            } catch (err: any) {
                results.errors.push(err.message);
            }
        }
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Bulk import failed', error });
    }
});

// PATCH - upload/append attendance records to an event
router.patch('/:id/attendance', authenticate, authorize('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const { attendees } = req.body;
        if (!Array.isArray(attendees)) {
            return res.status(400).json({ message: 'attendees must be an array' });
        }
        const event = await AcademicEvent.findByIdAndUpdate(
            req.params.id,
            { $push: { attendance: { $each: attendees } } },
            { new: true }
        );
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error updating attendance', error });
    }
});

// DELETE - remove an academic event
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        await AcademicEvent.findByIdAndDelete(req.params.id);
        res.json({ message: 'Academic event deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting academic event', error });
    }
});

// GET /api/academic-events/stats
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [total, byType, totalAttendees, recentEvents] = await Promise.all([
            AcademicEvent.countDocuments(),
            AcademicEvent.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $project: { type: '$_id', count: 1, _id: 0 } }
            ]),
            AcademicEvent.aggregate([
                { $project: { attendeeCount: { $size: '$attendance' } } },
                { $group: { _id: null, total: { $sum: '$attendeeCount' } } }
            ]),
            AcademicEvent.find()
                .sort({ date: -1 })
                .limit(5)
                .select('name type date location attendance')
        ]);

        const attendeeTotal = totalAttendees[0]?.total || 0;

        res.json({ total, byType, totalAttendees: attendeeTotal, recentEvents });
    } catch (error: any) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

export default router;
