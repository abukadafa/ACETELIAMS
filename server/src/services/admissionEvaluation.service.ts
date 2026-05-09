import {
    MIN_ADMISSION_CGPA,
    NON_ADMISSION_REASON,
} from '../constants/institution';

export type AdmissionEvaluationResult = {
    status: 'Admitted' | 'Not Admitted';
    nonAdmissionReasons: string[];
    /** Single-line summary for legacy analytics */
    nonAdmissionReason: string;
};

/**
 * Rule-based eligibility check for the Admissions Hub.
 * Flags default to false when absent — officers should set them via the edit form or uploads.
 */
export function evaluateApplicationEligibility(app: Record<string, unknown>): AdmissionEvaluationResult {
    const reasons: string[] = [];

    const cgpa = typeof app.cgpa === 'number' ? app.cgpa : undefined;
    if (cgpa === undefined || cgpa < MIN_ADMISSION_CGPA) {
        reasons.push(NON_ADMISSION_REASON.LOW_CGPA);
    }

    const documents = app.documents as
        | { certificate?: string; transcript?: string; paymentReceipt?: string }
        | undefined;
    const certificateOk =
        app.bscMscCertificatesComplete === true ||
        !!(documents?.certificate && documents?.certificate.trim() && documents?.transcript && documents?.transcript.trim());
    if (!certificateOk) {
        reasons.push(NON_ADMISSION_REASON.MISSING_CERTS);
    }

    if (app.oLevelSatisfactory !== true) {
        reasons.push(NON_ADMISSION_REASON.OLEVEL_DEFICIENCY);
    }
    if (app.researchProposalPass !== true) {
        reasons.push(NON_ADMISSION_REASON.PROPOSAL_FAILED);
    }

    const paymentOk =
        app.paymentReceiptUploaded === true ||
        !!(documents?.paymentReceipt && String(documents.paymentReceipt).trim());
    if (!paymentOk) {
        reasons.push(NON_ADMISSION_REASON.PAYMENT_RECEIPT_MISSING);
    }

    if (reasons.length === 0) {
        return {
            status: 'Admitted',
            nonAdmissionReasons: [],
            nonAdmissionReason: '',
        };
    }

    return {
        status: 'Not Admitted',
        nonAdmissionReasons: reasons,
        nonAdmissionReason: reasons.join(' | '),
    };
}

export function isPendingStatus(status: unknown): boolean {
    const s = String(status || '').toLowerCase();
    return s === 'pending' || s === '';
}
