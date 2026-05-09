import { Router, Request, Response } from 'express';
import Alumni from '../models/Alumni.model';

const router = Router();

// GET /api/alumni — list with filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const { programme, gradYear, engagement, search, cohort } = req.query;
        const query: any = {};
        if (programme && programme !== 'All Programmes') query.programme = programme;
        if (cohort && cohort !== 'All Cohorts') query.cohort = cohort;
        if (gradYear) query.gradYear = Number(gradYear);
        if (engagement) query.engagement = engagement;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { employer: { $regex: search, $options: 'i' } },
                { matricNo: { $regex: search, $options: 'i' } },
            ];
        }
        const alumni = await Alumni.find(query).sort({ cohort: 1, programme: 1, gradYear: -1, name: 1 });
        res.json(alumni);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching alumni', error: error.message });
    }
});

// GET /api/alumni/stats — employment rate, per-programme breakdown
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [total, byProgramme, byGradYear, employmentStats, byEngagement] = await Promise.all([
            Alumni.countDocuments(),

            Alumni.aggregate([
                { $group: { _id: '$programme', count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { programme: 1 } },
            ]),

            Alumni.aggregate([
                { $group: { _id: '$gradYear', count: { $sum: 1 } } },
                { $project: { year: '$_id', count: 1, _id: 0 } },
                { $sort: { _id: 1 } },
            ]),

            // Employment rate — employed = has employer that's not null/N/A/empty
            Alumni.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        employed: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $ne: ['$employer', null] },
                                            { $ne: ['$employer', ''] },
                                            { $ne: ['$employer', 'N/A'] },
                                        ],
                                    },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        total: 1,
                        employed: 1,
                        employmentRate: {
                            $cond: [
                                { $gt: ['$total', 0] },
                                { $multiply: [{ $divide: ['$employed', '$total'] }, 100] },
                                0,
                            ],
                        },
                        _id: 0,
                    },
                },
            ]),

            Alumni.aggregate([
                { $group: { _id: '$engagement', count: { $sum: 1 } } },
                { $project: { engagement: '$_id', count: 1, _id: 0 } },
            ]),
        ]);

        res.json({
            total,
            byProgramme,
            byGradYear,
            employment: employmentStats[0] || { total: 0, employed: 0, employmentRate: 0 },
            byEngagement,
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching alumni stats', error: error.message });
    }
});

// POST /api/alumni — create one
router.post('/', async (req: Request, res: Response) => {
    try {
        const alumni = new Alumni(req.body);
        await alumni.save();
        res.status(201).json(alumni);
    } catch (error: any) {
        res.status(400).json({ message: 'Error creating alumni record', error: error.message });
    }
});

// POST /api/alumni/bulk — bulk import
router.post('/bulk', async (req: Request, res: Response) => {
    try {
        const { alumni } = req.body;
        if (!Array.isArray(alumni) || alumni.length === 0) {
            return res.status(400).json({ message: 'No alumni data provided' });
        }
        const results = { inserted: 0, skipped: 0, errors: [] as string[] };
        for (const a of alumni) {
            try {
                const identifier = a.matricNo || a['Matric No'] || a['Matric Number'];
                const query = identifier ? { matricNo: identifier } : { name: a.name || a['Name'], programme: a.programme || a['Programme'] };
                await Alumni.findOneAndUpdate(
                    query,
                    {
                        name: a.name || a['Name'] || 'Unknown',
                        matricNo: identifier || '',
                        programme: a.prog || a['Programme'] || a.programme || '',
                        cohort: a.cohort || a['Cohort'] || '',
                        gradYear: parseInt(a.gradYear || a['Grad Year']) || new Date().getFullYear(),
                        employer: a.employer || a['Employer'] || '',
                        jobRole: a.role || a['Job Role'] || '',
                        location: a.location || a['Location'] || '',
                        email: a.email || a['Personal Email'] || a['Email'] || '',
                        phone: a.phone || a['Phone Number'] || '',
                        engagement: a.engagement || 'Medium',
                    },
                    { upsert: true, new: true }
                );
                results.inserted++;
            } catch (err: any) {
                results.skipped++;
                results.errors.push(`${a.name}: ${err.message}`);
            }
        }
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: 'Bulk import error', error: error.message });
    }
});

// PUT /api/alumni/:id — update
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const alumni = await Alumni.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!alumni) return res.status(404).json({ message: 'Alumni record not found' });
        res.json(alumni);
    } catch (error: any) {
        res.status(400).json({ message: 'Error updating alumni', error: error.message });
    }
});

// DELETE /api/alumni/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await Alumni.findByIdAndDelete(req.params.id);
        res.json({ message: 'Alumni record deleted' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting alumni', error: error.message });
    }
});

export default router;
