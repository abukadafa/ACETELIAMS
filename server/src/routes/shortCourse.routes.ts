import { Router, Request, Response } from 'express';
import Course from '../models/Course.model';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// GET all short courses
router.get('/', async (req: Request, res: Response) => {
    try {
        const courses = await Course.find().sort({ updatedAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching short courses', error });
    }
});

// POST - create a new short course
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const course = new Course(req.body);
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ message: 'Error creating short course', error });
    }
});

// POST /api/short-courses/bulk — bulk import
router.post('/bulk', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { courses } = req.body;
        if (!Array.isArray(courses)) return res.status(400).json({ message: 'courses must be an array' });
        
        const results = { inserted: 0, errors: [] as string[] };
        for (const c of courses) {
            try {
                await Course.findOneAndUpdate(
                    { title: c.title },
                    { ...c, status: 'Active' },
                    { upsert: true, new: true }
                );
                results.inserted++;
            } catch (e: any) {
                results.errors.push(e.message);
            }
        }
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Bulk import failed', error });
    }
});

// PATCH - upload/append enrolled students to a course
router.patch('/:id/students', authenticate, authorize('admin', 'staff'), async (req: Request, res: Response) => {
    try {
        const { students } = req.body;
        if (!Array.isArray(students)) {
            return res.status(400).json({ message: 'students must be an array' });
        }
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            {
                $push: { students: { $each: students } },
                $inc: { studentsCount: students.length },
            },
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Error updating enrolled students', error });
    }
});

// GET /api/short-courses/stats
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [total, active, totalTrained, topCourses] = await Promise.all([
            Course.countDocuments(),
            Course.countDocuments({ status: { $regex: /^active$/i } }),
            Course.aggregate([
                { $project: { trainedCount: { $size: '$students' } } },
                { $group: { _id: null, total: { $sum: '$trainedCount' } } }
            ]),
            Course.aggregate([
                { $addFields: { enrolledCount: { $size: { $ifNull: ['$students', []] } } } },
                { $sort: { enrolledCount: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        name: { $ifNull: ['$name', '$title'] },
                        title: 1,
                        enrolledCount: 1,
                    },
                },
            ])
        ]);

        const totalTrainedCount = totalTrained[0]?.total || 0;

        res.json({ total, active, totalTrained: totalTrainedCount, topCourses });
    } catch (error: any) {
        res.status(500).json({ message: 'Error', error: error.message });
    }
});

export default router;

// DELETE /api/short-courses/:id
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json({ message: 'Course deleted successfully', id: req.params.id });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
});
