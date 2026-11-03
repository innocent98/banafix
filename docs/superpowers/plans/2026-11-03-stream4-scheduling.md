# Stream 4 — Scheduling: Implementation Plan (ledger)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **This file is the ledger**: tick boxes and append to "Ledger log" as work lands.

**Goal:** Admins record instructor availability, assign an instructor to a planned student and generate their classes from preferences, with double-booking impossible at the database level.

**Architecture:** Additive staged migration (3 tables + preference columns) with raw-SQL exclusion constraints (`btree_gist`, `tstzrange`) per instructor and per student over active sessions. Pure functions (`lib/scheduling/*`) own time maths, overlap, availability, bands and the generator; one service module owns every DB mutation (transaction + audit inside it) and maps constraint violations to friendly errors. Routes are thin `withAuth` wrappers.

**Tech Stack:** Next.js 15, Prisma 6 / Postgres 16+, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-scheduling-design.md` (decisions D12, TZ, S1–S10). Executors read it.

## Global Constraints
- Africa/Lagos fixed UTC+1 (no DST); store `timestamptz`; weekday ISO 1..7; availability as minutes from local midnight.
- No money columns on `ClassSession` (D12). Do not touch tuition/payments (S5), emails/messaging (S7), the status machine, or the webhook. Notification points are `TODO(S7)` hooks in `lib/scheduling/hooks.ts` only.
- Every mutation writes `AuditLog` **inside its transaction**. Double-booking is never overridable; availability override needs `overrideReason` and writes `schedule.availability_override`.
- `.env` is PRODUCTION: never run migrate/seed/tests against it. Ephemeral Postgres on **port 5470** only (`EPHEMERAL_PG_PORT=5470 scripts/dev/ephemeral-pg.sh reset`). `npm install --ignore-scripts` only.
- No AI attribution in commits/PR (no `Co-Authored-By`, no session link, no "Generated with" footer), subagents too. Branch pushed to exactly `feature/scheduling-availability`; never `claude/*`. PR base `feature/assessment-first-admission`; never merge.
- Fast checks before each push: `npx tsc --noEmit`, `npx next build`, `npm test`. ESLint is broken (ignore).
- Subagents: no git writes (lead commits), 15-line reports.

## Review Focus (not exercised by the spec's headline tests; each has a test below)
1. Two simultaneous bookings for one instructor slot, one student slot, or a reschedule racing a new booking → exactly one succeeds (T1/T3 real-DB tests).
2. Back-to-back classes (end 10:00, next start 10:00) must NOT conflict; 45-min class ending mid-hour then a 60-min start after it (T2 overlap, T1 DB).
3. Reschedule frees the old slot atomically (old row → `rescheduled`, new row same `sequence`) and a failed reschedule leaves the original `scheduled` (T3).
4. Generator never emits a class outside preferred window ∩ availability, never overlaps busy intervals or its own output, reports `unplaced` instead of dropping, handles the first partial week and month/year rollovers (T2).
5. Legacy data: enrollments with `preferredDays` like `Monday`, null preferences, null plan fields → normaliser and schedule route do not crash and give 400 (not 500) for missing plan (T2/T3).

## File map
**Create:** `lib/scheduling/{time,bands,overlap,availability,generator,session-status,conflict-error,preferences,hooks,service}.ts` (+ `*.test.ts` beside the pure ones; `service` has the real-DB test `service.db.test.ts`) · `lib/instructor-courses.ts` · `prisma/migrations/<ts>_scheduling/migration.sql` · `scripts/verify-scheduling-migration.sh` · `scripts/test-scheduling-db.sh` · API `app/api/admin/instructors/[id]/availability/route.ts`, `app/api/admin/schedule/route.ts`, `app/api/admin/enrollments/[id]/schedule/route.ts`, `app/api/admin/sessions/[id]/{reschedule,status}/route.ts` · UI `app/admin/schedule/page.tsx`, `components/admin/schedule/*`, `components/admin/availability-editor.tsx`, `components/site/enroll/schedule-preferences.tsx`, `components/admin/schedule-preferences-fields.tsx`.
**Modify:** `prisma/schema.prisma`, `scripts/verify-migration.sh` (stop before the new migration), `app/api/admin/instructors/**` + `app/api/admin/courses/[id]/instructor/route.ts` (keep `InstructorCourse` in step; friendly 409 on deleting an instructor with classes), `app/api/enrollments/route.ts` + `app/api/admin/enrollments/route.ts` (capture preferences), `components/site/enroll/{step-details,types,enroll-wizard}.tsx`, `components/admin/{student-registration-modal,instructor-roster-modal,admin-layout}.tsx`, `app/admin/instructors/page.tsx`, `components/admin/enrollments/enrollment-table.tsx` (link), docs.

## Commit plan
1. `feat(db): scheduling schema, exclusion constraints, migration` (T1) · 2. `feat(scheduling): pure logic` (T2) · 3. `feat(scheduling): service, routes, conflict prevention` (T3) · 4. `feat(admin): availability editor, timetable, assignment` (T4) · 5. `feat(site): structured schedule preferences` (T5) · 6. `docs: scheduling SOP, checklist, blueprint` (T6) · + review-fix commit.

---

### Task 0: Tooling
- [ ] `npm ci --ignore-scripts`; `DATABASE_URL=postgresql://postgres@127.0.0.1:5470/postgres npx prisma generate`; scratch Postgres on 5470 starts via `EPHEMERAL_PG_PORT=5470 scripts/dev/ephemeral-pg.sh reset`.

### Task 1: Schema + migration + DB proof (commit 1)
**Files:** `prisma/schema.prisma`, `prisma/migrations/<ts>_scheduling/migration.sql`, `scripts/verify-scheduling-migration.sh`, `scripts/verify-migration.sh` (skip the new migration in step 1).
**Produces (Prisma):** `InstructorAvailability`, `InstructorCourse`, `ClassSession` per the spec; `Enrollment += preferredTimeBands String[] @default([]), preferredFromTime String?, preferredToTime String?, preferredClassesPerWeek Int?, @@unique([id, studentId])`; relations on `Instructor`, `Course`, `Location`, `Enrollment`.
- [ ] Edit schema; DDL from `prisma migrate diff --from-schema-datamodel <S3 schema> --to-schema-datamodel <new> --script`; append the raw-SQL section (extension, 2 exclusion constraints, checks, partial unique, availability exclusion) and the `InstructorCourse` backfill from `courses."instructorId"`.
- [ ] `verify-scheduling-migration.sh` (legacy fixture, instructor with two courses): backfill row count; constraints exist; instructor/student overlap rejected by SQL; back-to-back accepted; cancelled/rescheduled rows do not block; same-sequence duplicates rejected; `endsAt` pin rejects a bad row; `prisma migrate diff` shows no drift; legacy rows untouched.
- [ ] Run the script → all assertions pass; `npx tsc --noEmit`. Commit 1.

### Task 2: Pure logic, TDD (commit 2)
**Files:** `lib/scheduling/{time,bands,overlap,availability,generator,session-status,preferences,conflict-error}.ts` + tests.
**Interfaces — Produces:**
```ts
// time.ts
export const LAGOS_OFFSET_MIN = 60
export type DateKey = string                                   // 'YYYY-MM-DD' Lagos
export function lagosParts(d: Date): { dateKey: DateKey; isoWeekday: number; minuteOfDay: number }
export function fromLagos(dateKey: DateKey, minuteOfDay: number): Date
export function addDays(dateKey: DateKey, n: number): DateKey
export function isoWeekdayOf(dateKey: DateKey): number
export function isDateKey(s: unknown): s is DateKey
// bands.ts
export type Band = 'morning'|'afternoon'|'evening'
export interface MinuteWindow { start: number; end: number }
export const BAND_WINDOWS: Record<Band, MinuteWindow>          // 540-720, 780-1020, 1080-1260 (matches assessment-vocab labels)
export const DEFAULT_WINDOW: MinuteWindow                      // 540-1260
export function parseHHMM(s: unknown): number | null
export function preferredWindows(p: { bands?: string[]; from?: string|null; to?: string|null }): MinuteWindow[]   // union of bands (or DEFAULT), clipped to from/to, merged, empty clip => []
// overlap.ts
export interface Interval { start: Date; end: Date }
export function overlaps(a: Interval, b: Interval): boolean    // half-open
export function findConflicts(c: Interval, existing: Interval[]): Interval[]
// availability.ts
export interface AvailabilityWindow { weekday: number; startMinute: number; endMinute: number; locationId: string; mode: string }
export function isWithinAvailability(i: Interval, windows: AvailabilityWindow[], where: { locationId: string|null; mode: string }): boolean
// generator.ts
export interface GenerateInput { startDate: DateKey; count: number; firstSequence?: number /* or freeSequences */; freeSequences?: number[]; classesPerWeek: number; durationMins: number; preferredDays: number[]; windows: MinuteWindow[]; availability: AvailabilityWindow[] | null; where: { locationId: string|null; mode: string }; busy: Interval[]; stepMins?: number; maxWeeks?: number }
export interface GeneratedSlot { sequence: number; startsAt: Date; endsAt: Date }
export function generateSessions(i: GenerateInput): { placed: GeneratedSlot[]; unplaced: { sequence: number; reason: string }[] }
// session-status.ts
export type SessionStatus = 'scheduled'|'held'|'missed'|'rescheduled'|'cancelled'
export const ACTIVE_STATUSES: readonly SessionStatus[]        // scheduled, held
export const SLOT_STATUSES: readonly SessionStatus[]          // scheduled, held, missed
export function canMoveSession(from: string, to: string): boolean
// preferences.ts
export const WEEKDAY_KEYS: readonly string[]                  // mon..sun
export function normaliseDay(v: unknown): number | null       // 'mon'|'Monday'|'MON' -> 1; junk -> null
export function validatePreferences(input: unknown): { ok: true; value: Prefs } | { ok: false; error: string }
// conflict-error.ts
export class SchedulingConflictError extends Error { kind: 'instructor'|'student'|'sequence'|'availability_overlap' }
export function mapDbConflict(err: unknown, names?: { instructor?: string; student?: string }): SchedulingConflictError | null
```
- [ ] Tests first (red→green) per module: lagosParts across the UTC date boundary (00:30 Lagos is the previous UTC day), `fromLagos` round trip, addDays across month/year/leap; bands merge/clip (from 10:00 to 11:30 with morning ⇒ 600-690; from>to ⇒ []; bad HH:MM ⇒ null); overlap half-open (touching ≠ overlap; containment; identical); availability boundary-inclusive start/end, wrong weekday/location/mode/ spans two windows ⇒ false; generator (1/wk and 2/wk from a mid-week start, first partial week, honours busy incl. own output, respects availability, `availability:null` ignores it, unplaced reasons, rollover Dec→Jan, count 0, free sequences fill holes); transitions table; preference validation (bad day, bad band, from>to, classes 1|2 only); `mapDbConflict` maps by constraint name from Prisma-shaped errors and returns null otherwise.
- [ ] Implement; `npm test`. Commit 2.

### Task 3: Service, routes, DB tests (commit 3)
**Files:** `lib/scheduling/{service,hooks}.ts`, `lib/instructor-courses.ts`, routes listed in the file map, public/admin enrollment POST preference capture, instructor routes sync.
**Interfaces — Produces:**
```ts
// service.ts (db = prisma or tx)
export async function setAvailability(instructorId: string, slots: AvailabilityInput[], admin: {id: string}): Promise<AvailabilityWindow[]>
export async function planSchedule(enrollmentId: string, input: ScheduleInput, admin: {id: string}): Promise<SchedulePlan>   // dry run: placed + unplaced + conflicts + outsideAvailability
export async function createSchedule(enrollmentId: string, input: ScheduleInput, admin: {id: string}): Promise<{ sessions: ClassSession[]; unplaced: ... }>
export async function rescheduleSession(sessionId: string, input: { startsAt: Date; instructorId?: string; durationMins?: number; overrideAvailability?: boolean; overrideReason?: string }, admin): Promise<ClassSession>
export async function setSessionStatus(sessionId: string, to: SessionStatus, note: string|undefined, admin): Promise<ClassSession>
export class SchedulingError extends Error { status: number; code: string; details?: unknown }   // 400/404/409/422
```
Routes (all `withAuth`): `GET/PUT /api/admin/instructors/[id]/availability` (PUT replaces all) · `GET /api/admin/schedule?from=&to=&instructorId=` (sessions + availability + needs-scheduling list) · `GET/POST /api/admin/enrollments/[id]/schedule` (POST `{instructorId,startDate,count?,dryRun?,overrideAvailability?,overrideReason?}`) · `POST /api/admin/sessions/[id]/reschedule` · `POST /api/admin/sessions/[id]/status`. Errors `{ error, code, details? }`: 409 `INSTRUCTOR_BUSY`/`STUDENT_BUSY`, 422 `OUTSIDE_AVAILABILITY`, 400 `PLAN_MISSING` etc.
- [ ] Real-DB tests `service.db.test.ts` (skipped unless `SCHEDULING_DB_URL` is set and local; run via `scripts/test-scheduling-db.sh` which migrates a scratch DB): parallel booking race (10 concurrent `createSchedule` for the same instructor/start ⇒ exactly 1 fulfilled, 9 `INSTRUCTOR_BUSY`); student race (two instructors, same student/time); reschedule racing a new booking; failed reschedule leaves the original; override writes `schedule.availability_override` in the same transaction and a double-booking is refused even with override; plan missing ⇒ 400; non-teaching instructor ⇒ 400; cancel + regenerate refills the sequence; missed keeps it consumed.
- [ ] Wire instructor/course routes to keep `InstructorCourse` in step; deleting an instructor with sessions ⇒ friendly 409.
- [ ] Preference capture in both enrollment POSTs via `validatePreferences`.
- [ ] `npx tsc --noEmit`; `next build`; `npm test`; DB test script. Commit 3.

### Task 4: Admin UI (commit 4) — Sonnet subagent A
**Files:** `components/admin/availability-editor.tsx`, instructor page + roster modal changes, `app/admin/schedule/page.tsx`, `components/admin/schedule/*`, nav, enrollment-table link.
- [ ] Availability editor dialog from the instructor row (per weekday rows: start, end, location, mode; client check mirrors server; server errors surfaced). "Courses taught" multi-select writes `InstructorCourse`.
- [ ] `/admin/schedule`: instructor select + week navigator; 7-column timetable (availability shaded, sessions as cards coloured by status) at ≥768px, per-day agenda at 375px; session dialog (reschedule form with override checkbox + reason, mark held/missed/cancelled); "Needs scheduling" list → assign dialog (instructor, start date, **preview table** with conflicts/unplaced, override, confirm). Dialog states for 409/422 show the server message.
- [ ] `tsc`; `next build`; browser check 1280px + 375px on scratch DB with seeded data.

### Task 5: Student/walk-in preferences UI (commit 5) — Sonnet subagent B
**Files:** `components/site/enroll/{schedule-preferences,step-details,types,enroll-wizard}.tsx`, `components/admin/schedule-preferences-fields.tsx`, `components/admin/student-registration-modal.tsx`.
- [ ] Replace the single "Preferred time" select with the structured block (day chips, band chips, optional from/to, 1 or 2 classes/week); wizard gate no longer requires `schedulePreference`; POST body sends `preferredDays` (`mon..sun`), `preferredTimeBands`, `preferredFromTime`, `preferredToTime`, `preferredClassesPerWeek`. Same fields in the walk-in modal (replacing the free-text input).
- [ ] `tsc`; `next build`; browser check of wizard step 2 at 1280px + 375px.

### Task 6: Docs, verification, Opus review, PR (commit 6)
- [ ] SOP `docs/sop/scheduling.md` (What shipped · Why · How · What's involved · Verification · Operate/roll back incl. snapshot, direct DB URL, `btree_gist` · Follow-ups); tick Stream 4 in the checklist; blueprint update; amend `instructor-roster.md`, `walk-in-registration.md`, `assessment-first-admission.md` where changed.
- [ ] Fast checks, `verify-scheduling-migration.sh`, DB test script, `verify-migration.sh` still passes.
- [ ] **One Opus review** (migration + concurrency + override + reschedule); fix findings; log them.
- [ ] Clean-attribution check, push `HEAD:feature/scheduling-availability`, PR base `feature/assessment-first-admission` (no footer), `get_status`/`bind_pr`. Report (~15 lines). Never merge.

## Self-review (against spec)
Availability model ✔ T1/T4 · M:N ✔ T1/T3 · ClassSession+sequence ✔ T1 · DB exclusion + friendly error ✔ T1/T2/T3 · override audited ✔ T3 · generator/overlap/availability/bands pure+tests ✔ T2 · assign+generate from plan, reschedule, statuses ✔ T3/T4 · timetable ✔ T4 · preferences wizard+walk-in ✔ T5 · S7 hooks ✔ T3 · no status machine/webhook change ✔ · SOP/checklist/blueprint ✔ T6 · concurrency test real DB ✔ T3.

## Ledger log
- 2026-11-03 — Spec + plan written. Branch `feature/scheduling-availability-239ad7` (rename to `feature/scheduling-availability` before first push).
