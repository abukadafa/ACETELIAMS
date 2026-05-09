import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Application from '../models/Application.model';
import Student from '../models/Student.model';
import { evaluateApplicationEligibility } from '../services/admissionEvaluation.service';
import SystemAuditLog from '../models/SystemAuditLog.model';
import * as notificationService from '../services/notification.service';

import { authenticate } from '../middleware/auth.middleware';
import { env } from '../config/env';
import { upload, getStoragePath } from '../services/fileUpload';
import { escapeRegex } from '../utils/mongoRegex';

const router = Router();

/** Auto-create registry student when an application is newly admitted (mirrors PUT /:id). */
async function autoPullStudentFromApplication(app: any): Promise<{ ok: boolean; reason?: string }> {
    if (app.status !== 'Admitted' || app.isPulled) return { ok: false, reason: 'not-admitted-or-already-pulled' };

    const duplicate = await Student.findOne({
        $or: [{ name: app.name }, { personalEmail: app.personalEmail || app.email }, { phone: app.phone }],
    });
    if (duplicate) return { ok: false, reason: 'duplicate' };

    const year = new Date().getFullYear();
    const count = await Student.countDocuments({ entrySession: { $regex: new RegExp(`^${year}`) } });
    const matricNo = `ACE/${year}/${(count + 1001).toString()}`;

    const newStudent = new Student({
        matricNo,
        surname: app.surname,
        otherNames: app.otherNames,
        name: app.name,
        cohort: app.cohort || '',
        programme: app.programme,
        semester: 1,
        level: app.programme.includes('PhD') ? 900 : 800,
        nationality: app.nationality,
        gender: app.gender,
        email: app.personalEmail || app.email,
        personalEmail: app.personalEmail || app.email,
        instEmail: `${matricNo.replace(/\//g, '').toLowerCase()}@acetel.edu.ng`,
        phone: app.phone,
        status: 'Active',
        entrySession: `${year}/${year + 1}`,
        isAutoPulled: true,
        applicationRef: app._id,
    });

    await newStudent.save();

    app.isPulled = true;
    app.studentRef = newStudent._id;
    app.matricNo = matricNo;
    await app.save();

    await notificationService.notifyAdmins({
        type: 'admission',
        title: 'New Student Admitted',
        message: `${app.name} has been added to the Admitted Students register.`,
        relatedId: newStudent._id.toString(),
    });

    return { ok: true };
}

/**
 * POST /api/applications/upload
 * Public upload for admission documents (validation + global API rate limits).
 * Authenticated downloads remain on GET /files below.
 */
router.post('/upload', upload.single('file'), async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the relative storage path (key) for DB storage
        const storagePath = getStoragePath(req.file);

        res.json({ 
            message: 'File uploaded successfully',
            key: storagePath,
            url: `/api/applications/files/${storagePath}` 
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error uploading file', error: error.message });
    }
});

/**
 * GET /api/applications/files/*
 * Securely serve institutional documents
 */
router.get(/^\/files\/(.*)/, authenticate, (req: Request, res: Response) => {
    // Extract full path from params (handles subdirectories)
    const relativePath = req.params[0];
    const filePath = path.resolve(env.UPLOAD_PATH, relativePath);
    
    // Security check: Ensure file is within upload directory
    if (!filePath.startsWith(path.resolve(env.UPLOAD_PATH))) {
        return res.status(403).json({ message: 'Access denied' });
    }

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

// GET /api/applications — list with filters
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { status, programme, cohort, search } = req.query;
        const query: any = {};
        if (status) query.status = status;
        if (programme && programme !== 'All Programmes') query.programme = programme;
        if (cohort && cohort !== 'All Cohorts') query.cohort = cohort;
        if (search && typeof search === 'string') {
            const safe = escapeRegex(search.trim().slice(0, 200));
            if (safe.length > 0) {
                query.$or = [
                    { name: { $regex: safe, $options: 'i' } },
                    { email: { $regex: safe, $options: 'i' } },
                ];
            }
        }
        const apps = await Application.find(query).sort({ cohort: 1, programme: 1, appliedDate: -1 });
        res.json(apps);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
});

// POST /api/applications/batch/evaluate-eligibility — rule-based Pending → Admitted / Not Admitted
router.post('/batch/evaluate-eligibility', authenticate, async (_req: Request, res: Response) => {
    try {
        const apps = await Application.find({
            $or: [{ status: 'Pending' }, { status: 'pending' }],
        });

        const results: {
            id: string;
            name: string;
            outcome: 'Admitted' | 'Not Admitted';
            reasons?: string[];
            pull?: string;
        }[] = [];

        for (const doc of apps) {
            const plain = doc.toObject() as unknown as Record<string, unknown>;

            const ev = evaluateApplicationEligibility(plain);
            doc.status = ev.status;
            doc.nonAdmissionReasons = ev.nonAdmissionReasons;
            doc.nonAdmissionReason = ev.nonAdmissionReason;

            if (ev.status === 'Admitted') {
                await doc.save();
                const pull = await autoPullStudentFromApplication(doc);
                results.push({
                    id: doc._id.toString(),
                    name: doc.name,
                    outcome: 'Admitted',
                    pull: pull.ok ? 'student-created' : pull.reason,
                });
            } else {
                await doc.save();
                results.push({
                    id: doc._id.toString(),
                    name: doc.name,
                    outcome: 'Not Admitted',
                    reasons: ev.nonAdmissionReasons,
                });
            }
        }

        res.json({ processed: results.length, results });
    } catch (error: any) {
        res.status(500).json({ message: 'Batch evaluation failed', error: error.message });
    }
});

// GET /api/applications/stats — admissions analytics
router.get('/stats', authenticate, async (_req: Request, res: Response) => {
    try {
        const [total, byStatus, byProgramme, conversionRate, recentApps] = await Promise.all([
            Application.countDocuments(),

            Application.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $project: { status: '$_id', count: 1, _id: 0 } },
            ]),

            Application.aggregate([
                { $group: { _id: { programme: '$programme', status: '$status' }, count: { $sum: 1 } } },
                { $project: { programme: '$_id.programme', status: '$_id.status', count: 1, _id: 0 } },
                { $sort: { programme: 1 } },
            ]),

            // Admission conversion rate
            Application.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        admitted: { $sum: { $cond: [{ $eq: ['$status', 'Admitted'] }, 1, 0] } },
                    },
                },
                {
                    $project: {
                        rate: {
                            $cond: [
                                { $gt: ['$total', 0] },
                                { $multiply: [{ $divide: ['$admitted', '$total'] }, 100] },
                                0,
                            ],
                        },
                        total: 1,
                        admitted: 1,
                        _id: 0,
                    },
                },
            ]),

            Application.find().sort({ appliedDate: -1 }).limit(5).select('name programme status appliedDate'),
        ]);

        res.json({
            total,
            byStatus,
            byProgramme,
            conversionRate: conversionRate[0] || { total: 0, admitted: 0, rate: 0 },
            recentApps,
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching application stats', error: error.message });
    }
});

// POST /api/applications/bulk — bulk import candidates
router.post('/bulk', authenticate, async (req: Request, res: Response) => {
    try {
        const { applications } = req.body;
        if (!Array.isArray(applications) || applications.length === 0) {
            return res.status(400).json({ message: 'No application data provided' });
        }

        const results = { inserted: 0, skipped: 0, errors: [] as string[] };

        for (const app of applications) {
            try {
                const email = (app.email || app.personalEmail || '').toLowerCase().trim();
                const name = (app.name || `${app.surname} ${app.otherNames}`).trim();
                const prog = (app.programme || app.prog || 'MSc Artificial Intelligence').trim();

                if (!email && !name) {
                    results.skipped++;
                    results.errors.push(`Row skipped: Missing both email and name.`);
                    continue;
                }

                // Query priority: Email > (Name + Programme)
                const query = email ? { email } : { name, programme: prog };

                const updateData: any = {
                    surname: app.surname || '',
                    otherNames: app.otherNames || '',
                    name: name,
                    personalEmail: app.personalEmail || email,
                    phone: app.phone || '',
                    programme: prog,
                    cohort: app.cohort || '',
                    nationality: app.nationality || 'Unknown',
                    gender: app.gender || 'N/A',
                    status: app.status || 'Pending',
                    appliedDate: app.appliedDate || new Date(),
                };

                // Only set email if we have it, to avoid validation errors if it's missing but name is present
                if (email) {
                    updateData.email = email;
                } else {
                    // If no email, we must ensure the schema doesn't reject it or we provide a placeholder
                    // For now, if email is required, we skip if missing.
                    results.skipped++;
                    results.errors.push(`${name}: Email is required by schema.`);
                    continue;
                }

                await Application.findOneAndUpdate(
                    query,
                    updateData,
                    { upsert: true, new: true, runValidators: true }
                );
                results.inserted++;
            } catch (err: any) {
                results.skipped++;
                results.errors.push(`${app.name || 'Unknown'}: ${err.message}`);
            }
        }

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ message: 'Bulk import failed', error: error.message });
    }
});

// POST /api/applications — create one
router.post('/', async (req: Request, res: Response) => {
    try {
        const app = new Application(req.body);
        await app.save();

        // Trigger Notification
        await notificationService.notifyAdmins({
            type: 'admission',
            title: 'New Admission Application',
            message: `A new application has been received from ${app.name} for ${app.programme}.`,
            relatedId: app._id.toString()
        });

        res.status(201).json(app);
    } catch (error: any) {
        res.status(400).json({ message: 'Error creating application', error: error.message });
    }
});

// PUT /api/applications/:id — update (Admissons Hub Logic)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { status, overrideDuplicate, officerName, officerRole } = req.body;
        const appId = req.params.id;
        
        const oldApp = await Application.findById(appId);
        if (!oldApp) return res.status(404).json({ message: 'Application not found' });

        // DUPLICATE DETECTION TIER
        if (status === 'Admitted' && !overrideDuplicate) {
            const duplicate = await Student.findOne({
                $or: [
                    { name: oldApp.name },
                    { personalEmail: oldApp.personalEmail || oldApp.email },
                    { phone: oldApp.phone }
                ]
            });

            if (duplicate) {
                return res.status(409).json({
                    message: 'Potential duplicate detected in Student Registry',
                    duplicate: {
                        name: duplicate.name,
                        matricNo: duplicate.matricNo,
                        programme: duplicate.programme
                    }
                });
            }
        }

        const app = await Application.findByIdAndUpdate(appId, req.body, { new: true, runValidators: true });
        if (!app) return res.status(404).json({ message: 'Application not found after update' });

        // INTELLIGENT AUTO-PULL TIER
        if (status === 'Admitted' && !app.isPulled) {
            const year = new Date().getFullYear();
            const count = await Student.countDocuments({ entrySession: { $regex: new RegExp(`^${year}`) } });
            const matricNo = `ACE/${year}/${(count + 1001).toString()}`;

            const newStudent = new Student({
                matricNo,
                surname: app.surname,
                otherNames: app.otherNames,
                name: app.name,
                cohort: app.cohort || '',
                programme: app.programme,
                semester: 1,
                level: app.programme.includes('PhD') ? 900 : 800,
                nationality: app.nationality,
                gender: app.gender,
                email: app.personalEmail || app.email,
                personalEmail: app.personalEmail || app.email,
                instEmail: `${matricNo.replace(/\//g, '').toLowerCase()}@acetel.edu.ng`,
                phone: app.phone,
                status: 'Active',
                entrySession: `${year}/${year + 1}`,
                isAutoPulled: true,
                applicationRef: app._id
            });

            await newStudent.save();

            app.isPulled = true;
            app.studentRef = newStudent._id;
            if (overrideDuplicate) app.pullConfirmedBy = officerName || 'Admin';
            await app.save();

            // NOTIFICATION
            await notificationService.notifyAdmins({
                type: 'admission',
                title: 'New Student Admitted',
                message: `${app.name} has been added to the Admitted Students register.`,
                relatedId: newStudent._id.toString()
            });
        }

        res.json(app);
    } catch (error: any) {
        res.status(400).json({ message: 'Error updating application', error: error.message });
    }
});

// DELETE /api/applications/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        await Application.findByIdAndDelete(req.params.id);
        res.json({ message: 'Application deleted' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting application', error: error.message });
    }
});

export default router;
