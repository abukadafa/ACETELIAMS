import express from 'express';
import Student from '../models/Student.model';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { escapeRegex } from '../utils/mongoRegex';

const router = express.Router();

// POST /api/students — single create (duplicate matric → 409)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const b = req.body || {};
        const matricNo = String(b.matricNo || b.id || '').trim();
        if (!matricNo) {
            return res.status(400).json({ message: 'matricNo (or id) is required' });
        }

        const dup = await Student.findOne({ matricNo });
        if (dup) {
            return res.status(409).json({
                message: 'Duplicate matric number: a student with this matric already exists.',
                matricNo,
            });
        }

        const surname = String(b.surname || '').trim() || 'Unknown';
        const otherNames = String(b.otherNames || '').trim();
        const name =
            String(b.name || '').trim() ||
            `${surname} ${otherNames}`.trim() ||
            matricNo;

        const doc = await Student.create({
            matricNo,
            surname,
            otherNames,
            name,
            cohort: String(b.cohort || '').trim(),
            programme: String(b.programme || b.prog || '').trim(),
            semester: Number(b.semester ?? b.sem) || 1,
            level: Number(b.level) || 800,
            nationality: String(b.nationality || b.nat || ''),
            gender: String(b.gender || 'N/A'),
            email: String(b.email || ''),
            personalEmail: String(b.personalEmail || b.email || ''),
            instEmail: String(b.instEmail || ''),
            phone: String(b.phone || ''),
            status: (b.status as string) || 'Active',
            entrySession: String(b.entrySession || b.entry || ''),
            gradYear: typeof b.gradYear === 'number' ? b.gradYear : undefined,
        });

        res.status(201).json(doc);
    } catch (error: any) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: 'Duplicate matric number.' });
        }
        res.status(500).json({ message: 'Error creating student', error: error.message });
    }
});

// POST /api/students/bulk — save uploaded students from dashboard Excel import
router.post('/bulk', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { students } = req.body;
        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'No student data provided' });
        }

        const results: {
            inserted: number;
            skipped: number;
            duplicateMatrics: string[];
            errors: string[];
        } = { inserted: 0, skipped: 0, duplicateMatrics: [], errors: [] };

        for (const s of students) {
            const matricNo = String(s.id || s.matricNo || '').trim();
            if (!matricNo) {
                results.skipped++;
                results.errors.push('Row skipped: missing matric');
                continue;
            }
            try {
                await Student.findOneAndUpdate(
                    { matricNo },
                    {
                        matricNo,
                        name: s.name || 'Unknown',
                        cohort: s.cohort || '',
                        programme: s.prog || s.programme || '',
                        semester: s.sem || 1,
                        nationality: s.nat || s.nationality || '',
                        gender: s.gender || 'N/A',
                        email: s.email || '',
                        phone: s.phone || '',
                        status: s.status || 'Active',
                        entrySession: s.entry || '',
                        gradYear: s.gradYear || 0,
                    },
                    { upsert: true, new: true }
                );
                results.inserted++;
            } catch (e: any) {
                results.skipped++;
                if (e?.code === 11000) {
                    results.duplicateMatrics.push(matricNo);
                } else {
                    results.errors.push(matricNo + ': ' + (e?.message || 'error'));
                }
            }
        }

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: 'Error saving students', error: error.message });
    }
});

// GET /api/students — list with search and filter
router.get('/', async (req, res) => {
    try {
        const { search, programme, cohort } = req.query;
        let query: any = {};

        if (search && typeof search === 'string') {
            const safe = escapeRegex(search.trim().slice(0, 200));
            if (safe.length > 0) {
                query.$or = [
                    { name: { $regex: safe, $options: 'i' } },
                    { matricNo: { $regex: safe, $options: 'i' } },
                ];
            }
        }

        if (programme && programme !== 'All Programmes') {
            query.programme = programme;
        }

        if (cohort && cohort !== 'All Cohorts') {
            query.cohort = cohort;
        }

        const students = await Student.find(query).sort({ cohort: 1, programme: 1, surname: 1, otherNames: 1 });
        res.json(students);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// GET /api/students/stats — aggregates for dashboard
router.get('/stats', async (_req, res) => {
    try {
        const [
            total,
            active,
            graduated,
            nationalities,
            programmes,
            bySemester,
            byGender,
            byEntryYear
        ] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: { $regex: /^active$/i } }),
            Student.countDocuments({ gradYear: { $gt: 0 } }),
            
            Student.aggregate([
                { $match: { nationality: { $exists: true, $ne: '' } } },
                { $group: { _id: '$nationality', count: { $sum: 1 } } },
                { $project: { country: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } }
            ]),

            Student.aggregate([
                { $group: { _id: '$programme', count: { $sum: 1 } } },
                { $project: { name: '$_id', value: '$count', _id: 0 } }
            ]),

            Student.aggregate([
                { $group: { _id: '$semester', count: { $sum: 1 } } },
                { $project: { semester: '$_id', count: 1, _id: 0 } },
                { $sort: { _id: 1 } }
            ]),

            Student.aggregate([
                { $group: { _id: { $toLower: '$gender' }, count: { $sum: 1 } } },
                { $project: { gender: '$_id', count: 1, _id: 0 } }
            ]),

            Student.aggregate([
                { $match: { entrySession: { $exists: true, $ne: '' } } },
                { $group: { _id: '$entrySession', count: { $sum: 1 } } },
                { $project: { session: '$_id', count: 1, _id: 0 } },
                { $sort: { _id: 1 } }
            ])
        ]);

        res.json({ 
            total, 
            active, 
            graduated,
            nationalities, 
            programmes,
            bySemester,
            byGender,
            byEntryYear
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

export default router;

// PUT /api/students/:id — update a student record
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const updates = req.body;
        // Remove fields that shouldn't be overwritten blindly
        delete updates._id;
        delete updates.__v;
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: false }
        );
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating student', error: error.message });
    }
});


// DELETE /api/students/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully', id: req.params.id });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting student', error: error.message });
    }
});
