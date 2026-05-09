/** Cohorts and programmes — must match `server/src/constants/institution.ts` */

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

export const SEMESTER_LABELS: Record<number, string> = {
  1: 'First Semester',
  2: 'Second Semester',
  3: 'Third Semester',
};

const cohortOrder = new Map<string, number>(ACETEL_COHORTS.map((c, i) => [String(c), i]));
const programmeOrder = new Map<string, number>(ACETEL_PROGRAMMES.map((p, i) => [String(p), i]));

export const progRank = (prog: string) => {
  const i = ACETEL_PROGRAMMES.indexOf(prog as (typeof ACETEL_PROGRAMMES)[number]);
  if (i >= 0) return i;
  if (prog === '— Unassigned programme') return 9999;
  return 500;
};

export type CohortProgrammeGroup<T> = {
  cohort: string;
  programmes: { programme: string; items: T[] }[];
};

/** Nested buckets: Cohort → Programme → rows (for grouping UI, exports stay filter-aware). */
export function groupItemsByCohortThenProgramme<T>(
  items: T[],
  getCohort: (x: T) => string | undefined,
  getProg: (x: T) => string | undefined
): CohortProgrammeGroup<T>[] {
  const UN_C = '— Unassigned cohort';
  const UN_P = '— Unassigned programme';
  const map = new Map<string, Map<string, T[]>>();

  for (const it of items) {
    const c = String(getCohort(it) ?? '').trim() || UN_C;
    const p = String(getProg(it) ?? '').trim() || UN_P;
    if (!map.has(c)) map.set(c, new Map());
    const pm = map.get(c)!;
    if (!pm.has(p)) pm.set(p, []);
    pm.get(p)!.push(it);
  }

  const cohortRank = (cohort: string) => {
    const i = ACETEL_COHORTS.indexOf(cohort as (typeof ACETEL_COHORTS)[number]);
    if (i >= 0) return i;
    if (cohort === UN_C) return 9999;
    return 500;
  };

  const cohortKeys = [...map.keys()].sort((a, b) => cohortRank(a) - cohortRank(b) || a.localeCompare(b));

  return cohortKeys.map((cohort) => {
    const pm = map.get(cohort)!;
    const progKeys = [...pm.keys()].sort((a, b) => progRank(a) - progRank(b) || a.localeCompare(b));
    return {
      cohort,
      programmes: progKeys.map((programme) => ({
        programme,
        items: pm.get(programme)!,
      })),
    };
  });
}

export type ProgrammeSemesterGroup<T> = {
  programme: string;
  semesters: { semester: number; label: string; items: T[] }[];
};

export function groupCoursesByProgrammeThenSemester<T extends { prog?: string; sem?: number; programme?: string; semester?: number }>(
  courses: T[],
  semesterLabel: (n: number) => string
): ProgrammeSemesterGroup<T>[] {
  const pm = new Map<string, Map<number, T[]>>();
  for (const c of courses) {
    const p = String(c.prog || c.programme || '').trim() || '— Unassigned programme';
    const s = Number(c.sem || c.semester) || 1;
    if (!pm.has(p)) pm.set(p, new Map());
    const sm = pm.get(p)!;
    if (!sm.has(s)) sm.set(s, []);
    sm.get(s)!.push(c);
  }

  return [...pm.keys()]
    .sort((a, b) => progRank(a) - progRank(b) || a.localeCompare(b))
    .map((programme) => {
      const sm = pm.get(programme)!;
      const sems = [...sm.keys()].sort((a, b) => a - b);
      return {
        programme,
        semesters: sems.map((semester) => ({
          semester,
          label: semesterLabel(semester),
          items: sm.get(semester)!,
        })),
      };
    });
}

export function sortByCohortThenProgramme<T extends { cohort?: string; prog?: string; programme?: string }>(
  a: T,
  b: T
): number {
  const ac = a.cohort || '';
  const bc = b.cohort || '';
  const ai = cohortOrder.has(ac) ? (cohortOrder.get(ac) as number) : 1000;
  const bi = cohortOrder.has(bc) ? (cohortOrder.get(bc) as number) : 1000;
  if (ai !== bi) return ai - bi;
  const ap = a.prog || a.programme || '';
  const bp = b.prog || b.programme || '';
  const api = programmeOrder.has(ap) ? (programmeOrder.get(ap) as number) : 1000;
  const bpi = programmeOrder.has(bp) ? (programmeOrder.get(bp) as number) : 1000;
  if (api !== bpi) return api - bpi;
  return ap.localeCompare(bp);
}

export const NON_ADMISSION_REASONS = [
  'Low CGPA',
  'Unavailability of BSc and MSc Certificates/other relevant documents',
  "Deficiency in O'level results",
  'Research Proposals that were deemed unresearchable and failed assessment',
  'Evidence of application payment receipts not uploaded',
] as const;
