/** Canonical cohorts and programmes for ACETEL IAMS institutional grouping */

export const ACETEL_COHORTS = [
    '2021_1',
    '2021_2',
    '2022_1',
    '2022_2',
    '2023_1',
    '2023_2',
    '2024_1',
    '2024_2',
    '2025_1',
    '2026_1',
] as const;

export const ACETEL_PROGRAMMES = [
    'MSc Artificial Intelligence',
    'MSc Cybersecurity',
    'MSc Management Information System',
    'PhD Artificial Intelligence',
    'PhD Cybersecurity',
    'PhD Management Information System',
] as const;

/** Human-readable rejection reasons (must stay aligned with client Admissions Hub) */
export const NON_ADMISSION_REASON = {
    LOW_CGPA: 'Low CGPA',
    MISSING_CERTS: 'Unavailability of BSc and MSc Certificates/other relevant documents',
    OLEVEL_DEFICIENCY: "Deficiency in O'level results",
    PROPOSAL_FAILED:
        'Research Proposals that were deemed unresearchable and failed assessment',
    PAYMENT_RECEIPT_MISSING: 'Evidence of application payment receipts not uploaded',
} as const;

/** Minimum CGPA for automatic eligibility (postgraduate intake — configurable) */
export const MIN_ADMISSION_CGPA = 3.0;
