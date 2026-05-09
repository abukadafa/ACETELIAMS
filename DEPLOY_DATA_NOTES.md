# Deploy & data notes — ACETEL IAMS

## Cohort on existing records

- **Older rows may have an empty `cohort`** until officers set it (bulk import, edit form, or template column **Cohort**).
- The UI **`inferCohort`** helper tries to derive a label like `2024_1` from **entry session** text when it matches `\b(20\d{2}_\d)\b`. If the session string does not match that pattern, cohort stays blank until set explicitly.
- After deploy, plan a **one-off data cleanup** (spreadsheet re-import or admin edit) if you need 100% cohort coverage for historical intakes.

## Automated admission eligibility

- Batch rule evaluation (`POST /api/applications/batch/evaluate-eligibility`) is **strict** when checklist flags and document uploads are missing (e.g. payment receipt, certificates, O’level, proposal flags).
- For **fair, production runs**, officers should complete the **application edit checklist** and **document uploads** before running eligibility, or tune rules in `server/src/services/admissionEvaluation.service.ts` (e.g. minimum CGPA in `server/src/constants/institution.ts`).

## Analytics & date filters

- **Global date range** on the dashboard filters the **`/api/analytics/summary`** payload (primarily `createdAt` / `appliedDate` where applicable). Alumni without timestamps in range still contribute to **totals and cohort/programme breakdowns** when no range is applied; with a range, alumni are filtered by `createdAt` when present.
- Heavy reporting should use **exports** and **indexed fields** (`cohort`, `programme`, `matricNo`, status, dates) — see `server/src/db/indexes.ts`.

## Schema normalization (reference)

- **Canonical cohorts and programmes** are defined in code: `server/src/constants/institution.ts` and `client/src/constants/institution.ts`. MongoDB stores **denormalized** `cohort` and `programme` strings on documents for fast analytics; separate **Cohort** / **Programme** collections can be introduced later if you need referential integrity or CRUD for catalogue rows.

## Facilitator ↔ course linkage

- Facilitators attach to courses via **`facilitatorCourses`** on `User` (JSON in the UI). Validate **semester** `1|2|3` and **category** `Core|Elective|General` to match academic course rules.

## Registry vs admissions (dashboard)

- Under **Students → Alignment**, the UI compares **registry** (`/api/students`) with **admitted** applications (status **Admitted**) by **matric** and **email**, and lists mismatches both ways. Use exports from that tab for cleanup spreadsheets.
- This is a **view-layer reconciliation**; it does not create collections—still denormalized strings only.

## Client ↔ API conventions

- The SPA uses a shared **`/api` axios base**. Paths must **not** repeat `/api` (for example use `/students`, not `/api/students`).
- State-changing requests send **CSRF** (`x-csrf-token` + cookie). **Public application submission** (`POST /api/applications` and `POST /api/applications/upload`) is exempt so applicants do not need a prior API round-trip; abuse is mitigated by **API rate limits** and upload validation.
- **FormData** uploads must not force `Content-Type: application/json` (the client clears it for `FormData`).

## Student write API (manual registration & bulk)

- **`POST /api/students`** creates one student; requires **`authenticate`** + **`authorize('admin')`**. Duplicate **`matricNo`** returns **409** (also Mongo duplicate key **11000** mapped to **409**).
- **`POST /api/students/bulk`** is admin-only; responses include **`duplicateMatrics`** and **`errors`** when rows are skipped.
- **`GET /api/students`** remains open for the dashboard data load in the current setup; tighten with auth if you expose the API beyond trusted clients.

## UI grouping (cohort & programme)

- Student lists can use **grouped** layout (cohort → programme). Academic course lists can group by **programme → semester**. Optional flat list is still available where toggles exist.
- Facilitator **exports** can include a **programme coordinator** column when a facilitator’s course **programme** matches the hard-coded `PROGS` list in the dashboard (same source as other programme labels).
