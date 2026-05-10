import { Router, Request, Response } from 'express';
import AdmissionHub from '../models/AdmissionHub.model';
import Application from '../models/Application.model';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// ── helpers ──────────────────────────────────────────────────────────────────
function normEmail(e?: string) { return (e || '').toLowerCase().trim(); }

/**
 * Cross-reference a batch of hub rows against the admitted applications pool.
 * Returns the rows with admissionStatus and rejectionNotes populated.
 */
async function enrichRows(rows: any[]): Promise<any[]> {
    // Build lookup set of admitted emails + matrics from the applications collection
    const admitted = await Application.find({ status: { $in: ['Admitted', 'admitted'] } })
        .select('email personalEmail matricNo')
        .lean();

    const admittedEmails = new Set(
        admitted.flatMap((a) => [normEmail(a.email), normEmail((a as any).personalEmail)]).filter(Boolean)
    );
    const admittedMatrics = new Set(
        admitted.map((a) => (a.matricNo || '').toLowerCase().trim()).filter(Boolean)
    );

    return rows.map((row) => {
        const email = normEmail(row.email);
        const matric = (row.matricNo || '').toLowerCase().trim();

        const isAdmitted =
            (email && admittedEmails.has(email)) ||
            (matric && admittedMatrics.has(matric));

        if (isAdmitted) {
            return { ...row, admissionStatus: 'Admitted', rejectionNotes: [] };
        }

        // Auto-populate rejection notes from standardised reasons if not supplied
        const notes: string[] = Array.isArray(row.rejectionNotes) && row.rejectionNotes.length
            ? row.rejectionNotes
            : parseRejectionNotes(row);

        return { ...row, admissionStatus: 'Not Admitted', rejectionNotes: notes };
    });
}

function parseRejectionNotes(row: any): string[] {
    const raw: string = (row.rejectionNotes || row.rejection_notes || row['Rejection Notes'] || row['Deficiency Notes'] || '').toString();
    if (!raw.trim()) return [];

    const STANDARD_REASONS = [
        'Low CGPA',
        'Unavailability of BSc and MSc Certificates/other relevant documents',
        "Deficiency in O'level results",
        'Research Proposals that were deemed unresearchable and failed assessment',
        'Evidence of application payment receipts not uploaded',
    ];

    // Match against standard reasons (case-insensitive substring match)
    const matched = STANDARD_REASONS.filter((r) =>
        raw.toLowerCase().includes(r.toLowerCase().slice(0, 12))
    );
    if (matched.length) return matched;

    // Fall back to splitting on common delimiters
    return raw.split(/[;,|]/).map((s) => s.trim()).filter(Boolean);
}

// ── GET /api/admission-hub ────────────────────────────────────────────────────
router.get('/', authenticate, async (_req: Request, res: Response) => {
    try {
        const records = await AdmissionHub.find().sort({ cohort: 1, programme: 1, name: 1 });
        res.json(records);
    } catch (err: any) {
        res.status(500).json({ message: 'Error fetching admission hub records', error: err.message });
    }
});

// ── POST /api/admission-hub/bulk ─────────────────────────────────────────────
router.post('/bulk', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: 'records array is required' });
        }

        const enriched = await enrichRows(records);
        const results = { created: 0, updated: 0, errors: [] as string[] };

        for (const row of enriched) {
            try {
                const filter: any = {};
                if (row.email) filter.email = normEmail(row.email);
                else if (row.matricNo) filter.matricNo = row.matricNo;
                else filter.name = row.name;

                await AdmissionHub.findOneAndUpdate(filter, row, { upsert: true, new: true });
                results.created++;
            } catch (e: any) {
                results.errors.push(e.message);
                results.updated++;
            }
        }

        res.json(results);
    } catch (err: any) {
        res.status(500).json({ message: 'Bulk import failed', error: err.message });
    }
});

// ── POST /api/admission-hub (single record) ───────────────────────────────────
router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const [enriched] = await enrichRows([req.body]);
        const record = new AdmissionHub(enriched);
        await record.save();
        res.status(201).json(record);
    } catch (err: any) {
        res.status(400).json({ message: 'Error creating record', error: err.message });
    }
});

// ── PUT /api/admission-hub/:id ────────────────────────────────────────────────
router.put('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const record = await AdmissionHub.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: false }
        );
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json(record);
    } catch (err: any) {
        res.status(400).json({ message: 'Error updating record', error: err.message });
    }
});

// ── DELETE /api/admission-hub/:id ─────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const record = await AdmissionHub.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });
        res.json({ message: 'Deleted successfully', id: req.params.id });
    } catch (err: any) {
        res.status(500).json({ message: 'Error deleting record', error: err.message });
    }
});

// ── POST /api/admission-hub/sync ─────────────────────────────────────────────
// Re-evaluates all hub records against current admitted pool
router.post('/sync', authenticate, authorize('admin'), async (_req: Request, res: Response) => {
    try {
        const all = await AdmissionHub.find().lean();
        const enriched = await enrichRows(all);
        let synced = 0;
        for (const row of enriched) {
            await AdmissionHub.findByIdAndUpdate((row as any)._id, {
                admissionStatus: row.admissionStatus,
                rejectionNotes: row.rejectionNotes,
            });
            synced++;
        }
        res.json({ synced, message: `${synced} records re-evaluated against admitted pool.` });
    } catch (err: any) {
        res.status(500).json({ message: 'Sync failed', error: err.message });
    }
});

export default router;
