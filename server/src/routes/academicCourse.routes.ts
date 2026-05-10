import { Router, Request, Response } from 'express';
import AcademicCourse from '../models/AcademicCourse.model';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// GET /api/academic-courses — list with optional filters
router.get('/', async (req: Request, res: Response) => {
    try {
        const { programme, category, semester, status } = req.query;
        const query: any = {};
        if (programme) query.programme = programme;
        if (category) query.category = category;
        if (semester) query.semester = Number(semester);
        if (status) query.status = status;

        const courses = await AcademicCourse.find(query).sort({ programme: 1, semester: 1, code: 1 });
        res.json(courses);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching academic courses', error: error.message });
    }
});

// GET /api/academic-courses/stats — counts per programme × category
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [total, byCategory, byProgramme, byCategoryAndProgramme] = await Promise.all([
            AcademicCourse.countDocuments(),

            AcademicCourse.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $project: { category: '$_id', count: 1, _id: 0 } },
            ]),

            AcademicCourse.aggregate([
                { $group: { _id: '$programme', count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { programme: 1 } },
            ]),

            // Matrix: programme × category counts
            AcademicCourse.aggregate([
                {
                    $group: {
                        _id: { programme: '$programme', category: '$category' },
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        programme: '$_id.programme',
                        category: '$_id.category',
                        count: 1,
                        _id: 0,
                    },
                },
                { $sort: { programme: 1, category: 1 } },
            ]),
        ]);

        res.json({ total, byCategory, byProgramme, byCategoryAndProgramme });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching course stats', error: error.message });
    }
});

// POST /api/academic-courses — create one
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const body = { ...req.body };
        if (body.programme) body.programme = normaliseProgramme(body.programme);
        if (body.cat || body.category) { body.category = normaliseCategory(body.cat || body.category); delete body.cat; }
        if (body.sem) { body.semester = Number(body.sem) || 1; delete body.sem; }
        const course = new AcademicCourse(body);
        await course.save();
        res.status(201).json(course);
    } catch (error: any) {
        res.status(400).json({ message: 'Error creating course', error: error.message });
    }
});

// Normalise free-text programme names to the canonical enum values stored in MongoDB
function normaliseProgramme(raw: string): string {
    if (!raw) return 'MSc Artificial Intelligence';
    const r = raw.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
    if (r.includes('phd') || r.includes('doctor')) {
        if (r.includes('cyber') || r.includes('security')) return 'PhD Cybersecurity';
        if (r.includes('mis') || r.includes('management') || r.includes('information')) return 'PhD Management Information System';
        return 'PhD Artificial Intelligence';
    }
    if (r.includes('cyber') || r.includes('security')) return 'MSc Cybersecurity';
    if (r.includes('mis') || r.includes('management') || r.includes('information')) return 'MSc Management Information System';
    return 'MSc Artificial Intelligence';
}

function normaliseCategory(raw: string): 'Core' | 'Elective' | 'General' {
    const r = (raw || '').toLowerCase().trim();
    if (r.includes('elective') || r.includes('elect')) return 'Elective';
    if (r.includes('general') || r.includes('gen')) return 'General';
    return 'Core';
}

// POST /api/academic-courses/bulk — bulk import from Excel parse
router.post('/bulk', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { courses } = req.body;
        if (!Array.isArray(courses) || courses.length === 0) {
            return res.status(400).json({ message: 'No course data provided' });
        }

        const results = { inserted: 0, skipped: 0, errors: [] as string[] };

        for (const c of courses) {
            try {
                await AcademicCourse.findOneAndUpdate(
                    { code: (c.code || c['Course Code'] || '').toUpperCase() },
                    {
                        code: (c.code || c['Course Code'] || '').toUpperCase(),
                        title: c.title || c['Course Title'] || 'Unknown',
                        programme: normaliseProgramme(c.programme || c['Programme'] || c['Program'] || ''),
                        semester: (() => {
                            const s = String(c.sem || c.semester || c['Semester'] || '').toLowerCase().trim();
                            if (s.includes('first') || s.includes('1st') || s === '1') return 1;
                            if (s.includes('second') || s.includes('2nd') || s === '2') return 2;
                            if (s.includes('third') || s.includes('3rd') || s === '3') return 3;
                            if (s.includes('fourth') || s.includes('4th') || s === '4') return 4;
                            if (s.includes('fifth') || s.includes('5th') || s === '5') return 5;
                            if (s.includes('sixth') || s.includes('6th') || s === '6') return 6;
                            const match = s.match(/\d+/);
                            return match ? Math.min(12, Math.max(1, parseInt(match[0]))) : 1;
                        })(),
                        category: normaliseCategory(c.cat || c.category || c['Category'] || c['Category (Core/Elective/General)'] || 'Core'),
                        creditUnits: Number(c.creditUnits || c['Credit Units'] || c['Units']) || 3,
                        status: 'Active',
                    },
                    { upsert: true, new: true }
                );
                results.inserted++;
            } catch (err: any) {
                results.skipped++;
                results.errors.push(`${c.code}: ${err.message}`);
            }
        }
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: 'Bulk import error', error: error.message });
    }
});

// PUT /api/academic-courses/:id — update
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const course = await AcademicCourse.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error: any) {
        res.status(400).json({ message: 'Error updating course', error: error.message });
    }
});

// DELETE /api/academic-courses/:id
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        await AcademicCourse.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
});

export default router;
