import { Router, Request, Response } from 'express';
import Student from '../models/Student.model';
import User from '../models/User.model';
import Course from '../models/Course.model';
import AcademicEvent from '../models/AcademicEvent.model';
import AcademicCourse from '../models/AcademicCourse.model';
import Application from '../models/Application.model';
import AlumniModel from '../models/Alumni.model';
import CronJob from '../models/CronJob.model';

const router = Router();

/**
 * GET /api/dashboard/cron-stats
 * Monitoring endpoint for automated institutional tasks.
 */
router.get('/cron-stats', async (_req: Request, res: Response) => {
    try {
        const jobs = await CronJob.find().sort({ name: 1 });
        res.json(jobs);
    } catch (error: any) {
        res.status(500).json({ message: 'Cron stats error', error: error.message });
    }
});

/**
 * GET /api/dashboard/stats
 * Master endpoint for the Analytics Overview tab.
 * Returns ALL institutional metrics in a single efficient query batch.
 * Implements all 13 missing analytics from the audit report.
 */
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [
            // ── STUDENTS ──────────────────────────────────────────────
            studentTotal,
            studentActive,
            studentGraduated,
            studentsByProgramme,
            studentsBySemester,
            studentsByGender,
            studentsByNationality,
            studentsByEntryYear,
            newEnrollmentsThisMonth,

            // ── FACILITATORS ──────────────────────────────────────────
            facilitatorTotal,
            facilitatorsByProgramme,

            // ── SHORT COURSES ─────────────────────────────────────────
            shortCourseTotal,
            shortCourseActive,
            shortCourseTotalTrained,
            topShortCourses,

            // ── ACADEMIC EVENTS ───────────────────────────────────────
            eventTotal,
            eventByType,
            eventTotalAttendees,

            // ── ACADEMIC COURSES (Core/Elective/General) ──────────────
            academicCoursesMatrix,
            academicCoursesByCategory,

            // ── APPLICATIONS ──────────────────────────────────────────
            applicationStats,
            nonAdmissionReasons,

            // ── ENROLLMENT TREND ──────────────────────────────────────
            enrollmentTrend,

            // ── ALUMNI ────────────────────────────────────────────────
            alumniStats,

        ] = await Promise.all([

            // Students
            Student.countDocuments(),
            Student.countDocuments({ status: { $regex: /^active$/i } }),
            Student.countDocuments({ gradYear: { $gt: 0 } }),
            Student.aggregate([
                { $group: { _id: '$programme', count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { programme: 1 } },
            ]),
            Student.aggregate([
                { $group: { _id: '$semester', count: { $sum: 1 } } },
                { $project: { semester: '$_id', count: 1, _id: 0 } },
                { $sort: { _id: 1 } },
            ]),
            Student.aggregate([
                { $group: { _id: { $toLower: '$gender' }, count: { $sum: 1 } } },
                { $project: { gender: '$_id', count: 1, _id: 0 } },
            ]),
            Student.aggregate([
                { $match: { nationality: { $exists: true, $ne: '' } } },
                { $group: { _id: '$nationality', count: { $sum: 1 } } },
                { $project: { country: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ]),
            Student.aggregate([
                { $match: { entrySession: { $exists: true, $ne: '' } } },
                { $group: { _id: '$entrySession', count: { $sum: 1 } } },
                { $project: { session: '$_id', count: 1, _id: 0 } },
                { $sort: { _id: 1 } },
            ]),
            Student.countDocuments({ createdAt: { $gte: startOfMonth } }),

            // Facilitators
            User.countDocuments({ role: 'facilitator' }),
            User.aggregate([
                { $match: { role: 'facilitator' } },
                { $unwind: { path: '$programmes', preserveNullAndEmptyArrays: false } },
                { $group: { _id: '$programmes', count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { programme: 1 } },
            ]),

            // Short Courses
            Course.countDocuments(),
            Course.countDocuments({ status: { $regex: /^active$/i } }),
            Course.aggregate([
                { $project: { c: { $size: '$students' } } },
                { $group: { _id: null, total: { $sum: '$c' } } },
            ]),
            Course.aggregate([
                { $addFields: { enrolledCount: { $size: '$students' } } },
                { $sort: { enrolledCount: -1 } },
                { $limit: 5 },
                { $project: { name: 1, code: 1, department: 1, enrolledCount: 1 } },
            ]),

            // Academic Events
            AcademicEvent.countDocuments(),
            AcademicEvent.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $project: { type: '$_id', count: 1, _id: 0 } },
            ]),
            AcademicEvent.aggregate([
                { $project: { c: { $size: '$attendance' } } },
                { $group: { _id: null, total: { $sum: '$c' } } },
            ]),

            // Academic Courses matrix
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
            ]),
            AcademicCourse.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $project: { category: '$_id', count: 1, _id: 0 } },
            ]),

            // Applications
            Application.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
                        admitted: { $sum: { $cond: [{ $eq: ['$status', 'Admitted'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'Not Admitted'] }, 1, 0] } },
                    },
                },
                {
                    $project: {
                        total: 1, pending: 1, admitted: 1, rejected: 1,
                        conversionRate: {
                            $cond: [
                                { $gt: ['$total', 0] },
                                { $multiply: [{ $divide: ['$admitted', '$total'] }, 100] },
                                0,
                            ],
                        },
                        _id: 0,
                    },
                },
            ]),
            Application.aggregate([
                { $match: { status: 'Not Admitted', nonAdmissionReason: { $exists: true, $ne: '' } } },
                { $group: { _id: '$nonAdmissionReason', count: { $sum: 1 } } },
                { $project: { reason: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]),

            // Enrollment Trend (Last 6 Months)
            Student.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: { $month: '$createdAt' },
                            year: { $year: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // Alumni
            AlumniModel.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        employed: {
                            $sum: {
                                $cond: [
                                    { $and: [{ $ne: ['$employer', null] }, { $ne: ['$employer', ''] }, { $ne: ['$employer', 'N/A'] }] },
                                    1, 0,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        total: 1, employed: 1,
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
        ]);

        // ── COMPUTED ANALYTICS (13 missing metrics) ──────────────────────────────
        const retentionRate = studentTotal > 0
            ? ((studentActive / studentTotal) * 100).toFixed(1)
            : '0.0';

        const graduationRate = studentTotal > 0
            ? ((studentGraduated / studentTotal) * 100).toFixed(1)
            : '0.0';

        const mscCount = studentsByProgramme
            .filter((p: any) => p.programme?.startsWith('MSc'))
            .reduce((a: number, p: any) => a + p.count, 0);

        const phdCount = studentsByProgramme
            .filter((p: any) => p.programme?.startsWith('PhD'))
            .reduce((a: number, p: any) => a + p.count, 0);

        const topNationality = studentsByNationality[0]?.country || 'N/A';

        const facilitatorToStudentRatio = facilitatorTotal > 0
            ? (studentTotal / facilitatorTotal).toFixed(1)
            : 'N/A';

        const femaleCount = studentsByGender.find((g: any) => g.gender === 'female')?.count || 0;
        const genderEquityIndex = studentTotal > 0
            ? ((femaleCount / studentTotal) * 100).toFixed(1)
            : '0.0';

        const shortCourseTrained = shortCourseTotalTrained[0]?.total || 0;
        const avgShortCourseEnrollment = shortCourseTotal > 0
            ? (shortCourseTrained / shortCourseTotal).toFixed(1)
            : '0.0';

        const workshopCount = eventByType.find((e: any) => e.type === 'Workshop')?.count || 0;
        const conferenceCount = eventByType.find((e: any) => e.type === 'Conference')?.count || 0;

        res.json({
            // Core Counts
            students: {
                total: studentTotal,
                active: studentActive,
                graduated: studentGraduated,
                newThisMonth: newEnrollmentsThisMonth,
                byProgramme: studentsByProgramme,
                bySemester: studentsBySemester,
                byGender: studentsByGender,
                byNationality: studentsByNationality,
                byEntryYear: studentsByEntryYear,
                enrollmentTrend: enrollmentTrend,
            },

            // 13 Analytics
            analytics: {
                retentionRate: parseFloat(retentionRate),
                graduationRate: parseFloat(graduationRate),
                mscCount,
                phdCount,
                topNationality,
                genderEquityIndex: parseFloat(genderEquityIndex),
                femaleCount,
                facilitatorToStudentRatio,
                avgShortCourseEnrollment: parseFloat(avgShortCourseEnrollment),
                workshopVsConference: { workshops: workshopCount, conferences: conferenceCount },
                newEnrollmentsThisMonth,
                lastRefresh: new Date().toISOString(),
            },

            facilitators: {
                total: facilitatorTotal,
                byProgramme: facilitatorsByProgramme,
            },

            shortCourses: {
                total: shortCourseTotal,
                active: shortCourseActive,
                trained: shortCourseTrained,
                topCourses: topShortCourses,
            },

            events: {
                total: eventTotal,
                byType: eventByType,
                totalAttendees: eventTotalAttendees[0]?.total || 0,
                workshops: workshopCount,
                conferences: conferenceCount,
            },

            academicCourses: {
                matrix: academicCoursesMatrix,
                byCategory: academicCoursesByCategory,
            },

            applications: {
                ...(applicationStats[0] || { total: 0, pending: 0, admitted: 0, rejected: 0, conversionRate: 0 }),
                nonAdmissionReasons: nonAdmissionReasons
            },

            alumni: alumniStats[0] || { total: 0, employed: 0, employmentRate: 0 },
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Dashboard stats error', error: error.message });
    }
});

/**
 * POST /api/dashboard/wipe
 * DANGEROUS: Wipes all institutional data records for testing purposes.
 * Keeps system users (admins/staff) but clears students, apps, courses, etc.
 */
router.post('/wipe', async (_req: Request, res: Response) => {
    try {
        await Promise.all([
            Student.deleteMany({}),
            Application.deleteMany({}),
            AlumniModel.deleteMany({}),
            Course.deleteMany({}),
            AcademicEvent.deleteMany({}),
            AcademicCourse.deleteMany({}),
            User.deleteMany({ role: 'facilitator' }), // Only clear facilitators, keep admins
            CronJob.deleteMany({}),
        ]);
        res.json({ message: 'System data wiped successfully. Institutional records cleared.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Wipe error', error: error.message });
    }
});

export default router;
