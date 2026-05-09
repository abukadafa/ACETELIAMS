import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import Student from '../models/Student.model';
import Application from '../models/Application.model';
import AlumniModel from '../models/Alumni.model';
import AcademicCourse from '../models/AcademicCourse.model';
import User from '../models/User.model';
import Course from '../models/Course.model';
import AcademicEvent from '../models/AcademicEvent.model';
import { MIN_ADMISSION_CGPA } from '../constants/institution';

const router = Router();

function parseRange(req: Request): { from?: Date; to?: Date } {
    const { from, to } = req.query;
    let fromD: Date | undefined;
    let toD: Date | undefined;
    if (from && typeof from === 'string') {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) fromD = d;
    }
    if (to && typeof to === 'string') {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) {
            d.setHours(23, 59, 59, 999);
            toD = d;
        }
    }
    return { from: fromD, to: toD };
}

function createdRange(from?: Date, to?: Date): Record<string, unknown> {
    const r: { $gte?: Date; $lte?: Date } = {};
    if (from) r.$gte = from;
    if (to) r.$lte = to;
    if (!Object.keys(r).length) return {};
    return { createdAt: r };
}

function appliedRange(from?: Date, to?: Date): Record<string, unknown> {
    const r: { $gte?: Date; $lte?: Date } = {};
    if (from) r.$gte = from;
    if (to) r.$lte = to;
    if (!Object.keys(r).length) return {};
    return { appliedDate: r };
}

type Insight = { title: string; body: string; severity: 'info' | 'warning' | 'critical' };

function buildInsights(payload: {
    admissionRate: number;
    topReasons: { reason: string; count: number }[];
    programmeDemand: { programme: string; applications: number; students: number }[];
    cohortStudents: { cohort: string; count: number }[];
    facilitatorLoads: { name: string; assignments: number }[];
    courseByProgramme: { programme: string; count: number }[];
}): Insight[] {
    const insights: Insight[] = [];

    if (payload.admissionRate < 15 && payload.admissionRate >= 0) {
        insights.push({
            title: 'Admission rate',
            body: `Current admission rate is ${payload.admissionRate.toFixed(1)}%. Review pending pipeline and eligibility criteria.`,
            severity: 'warning',
        });
    }

    const cgpaReason = payload.topReasons.find((r) => r.reason?.includes('CGPA'));
    if (cgpaReason && cgpaReason.count > 0) {
        insights.push({
            title: 'CGPA-related non-admissions',
            body: `${cgpaReason.count} record(s) cite low CGPA (threshold ${MIN_ADMISSION_CGPA}). Consider outreach or pathway programmes.`,
            severity: 'info',
        });
    }

    const topProg = payload.programmeDemand[0];
    if (topProg) {
        insights.push({
            title: 'Programme demand',
            body: `${topProg.programme || 'Top programme'} leads applications (${topProg.applications}) vs registered students (${topProg.students}).`,
            severity: 'info',
        });
    }

    const loads = payload.facilitatorLoads;
    if (loads.length >= 2) {
        const max = loads[0]?.assignments || 0;
        const min = loads[loads.length - 1]?.assignments || 0;
        if (max - min >= 3) {
            insights.push({
                title: 'Facilitator workload spread',
                body: `Assignment counts range from ${min} to ${max}. Consider rebalancing high-load facilitators.`,
                severity: 'warning',
            });
        }
    }

    const cohortSorted = [...payload.cohortStudents].sort((a, b) => b.count - a.count);
    const cohortTop = cohortSorted[0];
    if (cohortTop?.cohort) {
        insights.push({
            title: 'Cohort concentration',
            body: `Largest registered cohort bucket: ${cohortTop.cohort} (${cohortTop.count} students).`,
            severity: 'info',
        });
    }

    const topCourseProg = payload.courseByProgramme[0];
    if (topCourseProg) {
        insights.push({
            title: 'Course catalogue density',
            body: `Most academic modules are under ${topCourseProg.programme || 'Unknown'} (${topCourseProg.count} courses).`,
            severity: 'info',
        });
    }

    return insights;
}

/**
 * GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get('/summary', authenticate, async (req: Request, res: Response) => {
    try {
        const { from, to } = parseRange(req);
        const cr = createdRange(from, to);
        const ar = appliedRange(from, to);

        const appReasonMatch: Record<string, unknown> = { status: 'Not Admitted' };
        if (Object.keys(ar).length) Object.assign(appReasonMatch, ar);

        const atRiskStatus = {
            $or: [{ status: 'Pending' }, { status: 'pending' }],
        };
        const atRiskFlags = {
            $or: [
                { paymentReceiptUploaded: { $ne: true } },
                { bscMscCertificatesComplete: { $ne: true } },
                { oLevelSatisfactory: { $ne: true } },
                { researchProposalPass: { $ne: true } },
                { $or: [{ cgpa: { $exists: false } }, { cgpa: { $lt: MIN_ADMISSION_CGPA } }] },
            ],
        };
        const atRiskFilter = {
            $and: [...(Object.keys(ar).length ? [ar] : []), atRiskStatus, atRiskFlags],
        };

        const [
            studentTotal,
            studentByCohort,
            studentByProgramme,
            studentMonthly,
            appTotal,
            appByStatus,
            appByCohort,
            appByProgramme,
            appMonthly,
            appReasons,
            alumniTotal,
            alumniByCohort,
            alumniByProgramme,
            alumniYearly,
            courseTotal,
            courseByProgramme,
            courseByCategory,
            courseBySemester,
            facTotal,
            facWorkload,
            shortTotal,
            eventTotal,
            atRisk,
        ] = await Promise.all([
            Student.countDocuments(Object.keys(cr).length ? cr : {}),
            Student.aggregate([
                { $match: Object.keys(cr).length ? cr : {} },
                { $group: { _id: { $ifNull: ['$cohort', ''] }, count: { $sum: 1 } } },
                { $project: { cohort: '$_id', count: 1, _id: 0 } },
                { $sort: { cohort: 1 } },
            ]),
            Student.aggregate([
                { $match: Object.keys(cr).length ? cr : {} },
                { $group: { _id: { $ifNull: ['$programme', ''] }, count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
            ]),
            Student.aggregate([
                { $match: Object.keys(cr).length ? cr : {} },
                {
                    $group: {
                        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.y': 1, '_id.m': 1 } },
                { $project: { period: { $concat: [{ $toString: '$_id.y' }, '-', { $toString: '$_id.m' }] }, count: 1, _id: 0 } },
            ]),

            Application.countDocuments(Object.keys(ar).length ? ar : {}),
            Application.aggregate([
                { $match: Object.keys(ar).length ? ar : {} },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { status: '$_id', count: 1, _id: 0 } },
            ]),
            Application.aggregate([
                { $match: Object.keys(ar).length ? ar : {} },
                { $group: { _id: { $ifNull: ['$cohort', ''] }, count: { $sum: 1 } } },
                { $project: { cohort: '$_id', count: 1, _id: 0 } },
                { $sort: { cohort: 1 } },
            ]),
            Application.aggregate([
                { $match: Object.keys(ar).length ? ar : {} },
                { $group: { _id: { $ifNull: ['$programme', ''] }, count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
            ]),
            Application.aggregate([
                { $match: Object.keys(ar).length ? ar : {} },
                {
                    $group: {
                        _id: { y: { $year: '$appliedDate' }, m: { $month: '$appliedDate' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.y': 1, '_id.m': 1 } },
                { $project: { period: { $concat: [{ $toString: '$_id.y' }, '-', { $toString: '$_id.m' }] }, count: 1, _id: 0 } },
            ]),
            Application.aggregate([
                { $match: appReasonMatch },
                {
                    $addFields: {
                        reasonList: {
                            $cond: [
                                { $gt: [{ $size: { $ifNull: ['$nonAdmissionReasons', []] } }, 0] },
                                '$nonAdmissionReasons',
                                {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ne: ['$nonAdmissionReason', null] },
                                                { $ne: ['$nonAdmissionReason', ''] },
                                            ],
                                        },
                                        ['$nonAdmissionReason'],
                                        ['Unknown'],
                                    ],
                                },
                            ],
                        },
                    },
                },
                { $unwind: '$reasonList' },
                { $group: { _id: '$reasonList', count: { $sum: 1 } } },
                { $project: { reason: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
                { $limit: 12 },
            ]),

            AlumniModel.countDocuments(Object.keys(cr).length ? cr : {}),
            AlumniModel.aggregate([
                { $match: Object.keys(cr).length ? cr : {} },
                { $group: { _id: { $ifNull: ['$cohort', ''] }, count: { $sum: 1 } } },
                { $project: { cohort: '$_id', count: 1, _id: 0 } },
                { $sort: { cohort: 1 } },
            ]),
            AlumniModel.aggregate([
                { $match: Object.keys(cr).length ? cr : {} },
                { $group: { _id: { $ifNull: ['$programme', ''] }, count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
            ]),
            AlumniModel.aggregate([
                { $match: Object.keys(cr).length ? cr : {} },
                { $group: { _id: '$gradYear', count: { $sum: 1 } } },
                { $project: { year: '$_id', count: 1, _id: 0 } },
                { $sort: { year: -1 } },
            ]),

            AcademicCourse.countDocuments({}),
            AcademicCourse.aggregate([
                { $group: { _id: { $ifNull: ['$programme', ''] }, count: { $sum: 1 } } },
                { $project: { programme: '$_id', count: 1, _id: 0 } },
                { $sort: { count: -1 } },
            ]),
            AcademicCourse.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $project: { category: '$_id', count: 1, _id: 0 } },
            ]),
            AcademicCourse.aggregate([
                { $group: { _id: '$semester', count: { $sum: 1 } } },
                { $project: { semester: '$_id', count: 1, _id: 0 } },
                { $sort: { semester: 1 } },
            ]),

            User.countDocuments({ role: 'facilitator' }),
            User.aggregate([
                { $match: { role: 'facilitator' } },
                {
                    $project: {
                        name: 1,
                        assignments: { $size: { $ifNull: ['$facilitatorCourses', []] } },
                    },
                },
                { $sort: { assignments: -1 } },
                { $limit: 40 },
            ]),

            Course.countDocuments({}),
            AcademicEvent.countDocuments({}),

            Application.find(atRiskFilter)
                .limit(40)
                .select(
                    'name email cohort programme cgpa paymentReceiptUploaded bscMscCertificatesComplete oLevelSatisfactory researchProposalPass'
                )
                .lean(),
        ]);

        const statusRows = appByStatus as { status: string; count: number }[];
        const statusMap = Object.fromEntries(statusRows.map((s) => [String(s.status), s.count]));
        const admitted = (statusMap.Admitted || 0) + (statusMap.approved || 0);
        const pending = statusMap.Pending || statusMap.pending || 0;
        const rejected = statusMap['Not Admitted'] || statusMap.rejected || 0;
        const admissionRate = appTotal > 0 ? (admitted / appTotal) * 100 : 0;

        const programmeKeys = new Set<string>();
        (appByProgramme as { programme: string; count: number }[]).forEach((p) => {
            if (p.programme) programmeKeys.add(p.programme);
        });
        (studentByProgramme as { programme: string; count: number }[]).forEach((p) => {
            if (p.programme) programmeKeys.add(p.programme);
        });

        const programmeDemand = [...programmeKeys].map((programme) => ({
            programme,
            applications: (appByProgramme as { programme: string; count: number }[]).find((p) => p.programme === programme)?.count || 0,
            students: (studentByProgramme as { programme: string; count: number }[]).find((p) => p.programme === programme)?.count || 0,
        }));
        programmeDemand.sort((a, b) => b.applications - a.applications);

        const reasonRows = appReasons as { reason: string; count: number }[];
        const insights = buildInsights({
            admissionRate,
            topReasons: reasonRows.map((r) => ({ reason: r.reason, count: r.count })),
            programmeDemand,
            cohortStudents: studentByCohort as { cohort: string; count: number }[],
            facilitatorLoads: (facWorkload as { name: string; assignments: number }[]).map((f) => ({
                name: f.name,
                assignments: f.assignments,
            })),
            courseByProgramme: courseByProgramme as { programme: string; count: number }[],
        });

        type AtRiskLean = {
            name: string;
            email: string;
            cohort?: string;
            programme?: string;
            cgpa?: number;
            paymentReceiptUploaded?: boolean;
            bscMscCertificatesComplete?: boolean;
            oLevelSatisfactory?: boolean;
            researchProposalPass?: boolean;
        };
        const atRiskApplicants = (atRisk as AtRiskLean[]).map((a) => {
            const reasons: string[] = [];
            if (a.paymentReceiptUploaded !== true) reasons.push('Payment receipt not marked uploaded');
            if (a.bscMscCertificatesComplete !== true) reasons.push('Degree certificates incomplete');
            if (a.oLevelSatisfactory !== true) reasons.push('O-Level requirement not satisfied');
            if (a.researchProposalPass !== true) reasons.push('Research proposal not passed');
            if (a.cgpa === undefined || a.cgpa === null || a.cgpa < MIN_ADMISSION_CGPA) {
                reasons.push(`CGPA below threshold (${MIN_ADMISSION_CGPA}) or missing`);
            }
            return {
                name: a.name,
                email: a.email,
                cohort: a.cohort,
                programme: a.programme,
                reasons: reasons.length ? reasons : ['Incomplete eligibility checklist'],
            };
        });

        res.json({
            range: { from: from?.toISOString() || null, to: to?.toISOString() || null },
            students: {
                total: studentTotal,
                byCohort: studentByCohort,
                byProgramme: studentByProgramme,
                monthlyTrend: studentMonthly,
            },
            applications: {
                total: appTotal,
                pending,
                admitted,
                notAdmitted: rejected,
                admissionRate,
                byCohort: appByCohort,
                byProgramme: appByProgramme,
                monthlyTrend: appMonthly,
                nonAdmissionReasons: appReasons,
            },
            alumni: {
                total: alumniTotal,
                byCohort: alumniByCohort,
                byProgramme: alumniByProgramme,
                byGradYear: alumniYearly,
            },
            courses: {
                total: courseTotal,
                byProgramme: courseByProgramme,
                byCategory: courseByCategory,
                bySemester: courseBySemester,
            },
            facilitators: {
                total: facTotal,
                workload: facWorkload,
            },
            workshops: { total: eventTotal },
            shortCourses: { total: shortTotal },
            programmes: {
                popularity: programmeDemand,
            },
            ai: {
                insights,
                atRiskApplicants,
            },
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Analytics summary error', error: error.message });
    }
});

export default router;
