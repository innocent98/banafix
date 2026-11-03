# SOP — Scheduling: instructor availability, class sessions, conflict prevention (Stream 4)

## What shipped
Admins can record **when each instructor is available** (per weekday, location and mode), see a **week timetable per instructor**, **assign an instructor and generate a student's classes** from their plan and preferences, **reschedule**, and mark classes **held / missed / cancelled**. Double-booking an instructor or a student is **impossible at the database level** (Postgres exclusion constraints), even for simultaneous requests. Students (online wizard) and admins (walk-in modal) capture **structured preferences**: weekdays, morning/afternoon/evening, optional earliest/latest time, 1 or 2 classes a week. Instructors can teach several courses and a course can have several instructors (`InstructorCourse`).

Branch `feature/scheduling-availability`, PR base `feature/assessment-first-admission` (stacked on PR #12; retargets to `banafix` when #12 merges; see the PR for the final head SHA). Spec: `docs/superpowers/specs/2026-11-03-scheduling-design.md`; ledger/plan: `docs/superpowers/plans/2026-11-03-stream4-scheduling.md`.

| Commit | What |
|---|---|
| `336d917` | Schema + migration (tables, exclusion constraints, checks) + migration verifier |
| `4984219` | Pure logic: Lagos time, bands, overlap, availability, generator, status table, preferences, conflict-error mapper |
| `65bac6c` | Service, routes, instructor/course sync, preference capture in both enrollment POSTs, real-DB tests |
| `5c9aff2` | Admin: availability editor, `/admin/schedule` timetable + assign/reschedule/status dialogs, enrollment-table link |
| `49c3ca9` | Wizard + walk-in structured preference capture |
| `18caf88` | Opus review fixes (below) |
| (docs) | this SOP, FE guide + captures, checklist, blueprint, SOP updates |

## Why
John's requirement: students choose days/times/frequency, classes are 45 min or 1 hour, instructors can teach several courses, and "if an instructor has a student Monday 9:00, nobody else can be booked with them then", respecting centres vs online vs home training. Until now nothing recorded a class at all: `Course.instructorId` allowed one instructor per course, availability was free text (`Instructor.availability`), and a student's schedule was one free-text field.

## How (key decisions)
- **The database is the arbiter.** `class_sessions` has two `EXCLUDE USING gist` constraints over `tstzrange("startsAt","endsAt",'[)')`, one per `instructorId`, one per `studentId`, both `WHERE status IN ('scheduled','held')`. Half-open ranges: a class ending 10:00 and one starting 10:00 do not conflict. The app pre-checks only to give readable previews. Two admins booking the same slot at once: one insert wins, the other gets `409 INSTRUCTOR_BUSY` / `STUDENT_BUSY` ("<Name> already has a class at that time"). **Double-booking is never overridable.**
- **Why `endsAt` is stored:** `timestamptz + interval` is not IMMUTABLE, so it cannot be generated or indexed; `CHECK ("endsAt" = "startsAt" + "durationMins" * interval '1 minute')` keeps it honest.
- **Student constraint needs `studentId` on the session**, kept equal to the enrollment's by a **composite FK** `(enrollmentId, studentId) → enrollments(id, studentId)` (new `@@unique([id, studentId])`).
- **Availability** (`InstructorAvailability`): weekday ISO 1..7, minutes from Lagos local midnight, location **and** mode (CENTRE/HOME/ONLINE; ONLINE only at ONLINE-kind locations). A class is available iff it lies wholly inside one window with the same weekday, location and mode. Windows for one instructor cannot overlap (exclusion constraint). Outside availability is **rejected (422)** unless the admin passes `overrideAvailability` + a non-empty `overrideReason`; every use writes `schedule.availability_override` inside the same transaction.
- **Generator** (pure, `lib/scheduling/generator.ts`): fills the free class numbers up to `plannedClasses`; per Mon–Sun week finds preferred days with a free slot (earliest start on a 15-min grid inside preferred window ∩ availability, clear of the instructor's and student's busy time) and spreads `classesPerWeek` across them. At most one class per day; unplaced classes are **reported with reasons**, never dropped. Creating fails (422 `UNPLACEABLE`) unless the admin accepts a partial schedule.
- **`sequence`** names the class slot (1..n) in an enrollment: `scheduled`, `held`, `missed` occupy it (partial unique index); `cancelled` and `rescheduled` free it. Stream 5 (D12) joins on `(enrollmentId, sequence)`; there are **no money columns** here.
- **Reschedule** marks the old row `rescheduled` and inserts a new row with the same sequence and `rescheduledFromId` in one transaction (compare-and-set on the old row). A failed reschedule leaves the original `scheduled` and writes no audit row.
- **Audit inside the transaction** (`tx.auditLog.create`, not the best-effort `logAdminAction`): a booking cannot exist without its record.
- **Many-to-many teaching:** `InstructorCourse` backfilled from `Course.instructorId`. `Course.instructorId` stays the public `/tutors` "primary". `lib/instructor-courses.ts` keeps them in step: setting an instructor's courses never takes a course away from another teacher; the course page's single instructor picker replaces the primary and the previous primary stops teaching it.
- **Timezone:** Africa/Lagos fixed UTC+1 (no DST), `timestamptz` UTC in the DB; `lib/scheduling/time.ts` is the only place local wall-clock is derived.
- **Hooks for S7:** `lib/scheduling/hooks.ts` has no-op `onSessionsScheduled` / `onSessionRescheduled` / `onSessionStatusChanged` marked `TODO(S7)`, called after commit.

### Builder calls (mine, not John's)
| # | Call |
|---|---|
| S1 | ISO weekday 1..7; availability as minutes-from-midnight ints |
| S2 | Availability carries `locationId` **and** `mode` |
| S3 | No travel-time buffer between locations (model it by leaving gaps in availability) |
| S4 | `missed` consumes its slot; `cancelled` frees it. **Confirm with John** |
| S5 | Reschedule = new row, old row `rescheduled` |
| S6 | `held`/`missed` only after the class has started |
| S7 | The instructor must teach the course to be assigned (no override) |
| S8 | `preferredClassesPerWeek` captured at application next to the plan's `classesPerWeek` |
| S9 | Empty preferences mean Mon–Sat, 09:00–21:00 |
| S10 | Dry run is a flag on the generate route |
| S11 | `durationMins` CHECK is 45\|60 (lead decision) although offering rates allow 15–240: a plan with another duration gets `400 DURATION_UNSUPPORTED` and must be re-planned |
| S12 | Override ignores availability for the whole run (it does not mix availability-respecting and not) |

## What's involved
| Area | Where |
|---|---|
| Schema + migration | `prisma/schema.prisma`; `prisma/migrations/20261103170000_scheduling/migration.sql` (DDL from `migrate diff`, then raw SQL: `btree_gist`, 3 exclusion constraints, CHECKs, partial unique, backfill) |
| Pure logic + tests | `lib/scheduling/{time,bands,overlap,availability,availability-input,generator,session-status,preferences,mode,conflict-error}.ts` (+ `*.test.ts`) |
| Service | `lib/scheduling/service.ts` (`setAvailability`, `planSchedule`, `commitSchedule`, `createSchedule`, `rescheduleSession`, `setSessionStatus`, `getTimetable`, `getEnrollmentSchedule`), `lib/scheduling/http.ts`, `lib/scheduling/hooks.ts` |
| Instructor/course sync | `lib/instructor-courses.ts`; `app/api/admin/instructors/**`, `app/api/admin/courses/route.ts`, `app/api/admin/courses/[id]/instructor/route.ts` |
| Routes | `GET/PUT /api/admin/instructors/[id]/availability` · `GET /api/admin/schedule?from&to&instructorId` · `GET/POST /api/admin/enrollments/[id]/schedule` · `POST /api/admin/sessions/[id]/{reschedule,status}` |
| Preferences | `POST /api/enrollments`, `POST /api/admin/enrollments` accept `preferredDays` (`mon..sun`), `preferredTimeBands`, `preferredFromTime`, `preferredToTime`, `preferredClassesPerWeek` (validated by `lib/scheduling/preferences.ts`) |
| UI | `/admin/schedule`, `components/admin/schedule/*`, `components/admin/availability-editor.tsx`, instructor page, `components/site/enroll/schedule-preferences.tsx`, `components/admin/schedule-preferences-fields.tsx` |
| Audit actions | `availability.update`, `schedule.generate`, `session.reschedule`, `session.status`, `schedule.availability_override` |
| Error codes | 409 `INSTRUCTOR_BUSY` `STUDENT_BUSY` `SLOT_TAKEN` `AVAILABILITY_OVERLAP` `CHANGED`; 422 `OUTSIDE_AVAILABILITY` `UNPLACEABLE`; 400 `PLAN_MISSING` `NOT_PLANNED` `LOCATION_MISSING` `DURATION_UNSUPPORTED` `INSTRUCTOR_NOT_ASSIGNED_TO_COURSE` `OVERRIDE_REASON_REQUIRED` `NOT_STARTED` `BAD_TRANSITION` `NOTHING_TO_SCHEDULE` ... |

## Verification
| What | How | Result |
|---|---|---|
| **Migration** on an ephemeral Postgres 17 with the legacy fixture (+ an instructor on two courses) | `scripts/verify-scheduling-migration.sh` | 40 assertions pass: no row lost, statuses/preferences untouched, `InstructorCourse` backfilled, `btree_gist` installed, overlap/identical/held/student/sequence conflicts rejected **by SQL**, back-to-back and cancelled/rescheduled rows accepted, `endsAt`/duration/status/mode/composite-FK/availability CHECKs reject bad rows, instructor with classes cannot be deleted, **no schema drift** vs `schema.prisma` |
| Stream 2+3 migration still passes with the new one applied after it | `scripts/verify-migration.sh` | all assertions pass |
| **Concurrency, real DB (no mocks)** | `scripts/test-scheduling-db.sh` (`npm run test:scheduling-db`), 21 tests, run 3x for flakiness | 10 simultaneous inserts of one instructor slot: exactly 1 succeeds, 9 map to `instructor`; 10 admins committing plans made against the same empty calendar: exactly 1 booking, 9 `INSTRUCTOR_BUSY` with the friendly message, and no audit rows from the losers; one student/two instructors: exactly one wins, the other `STUDENT_BUSY`; a reschedule racing a new booking: exactly one wins and the loser leaves the original `scheduled` and writes nothing; no overlapping active rows afterwards |
| Override | same suite | outside availability: 422 / `UNPLACEABLE` without override; 400 without a reason; with reason it books and writes `schedule.availability_override` (admin id, reason, session ids) in the same transaction; a double-booking with override is still refused and its audit rows roll back |
| Other service rules | same suite | missing plan / unplanned status / unassigned instructor / bad date / unsupported duration rejected; cancel frees a class number, missed keeps it; past classes refused unless `allowPast` (audited `backfill`); held blocks time; availability replace-all rolls back on error; legacy `Monday` day names work; the exclusion constraints and the partial unique index exist in the catalog (guards a future `migrate dev` dropping them) |
| Pure logic | `npm test` | 158 pass on the merged tree (74 scheduling, incl. Lagos midnight/Sunday/month-year rollovers, half-open overlap, bands, generator incl. partial first week, spreading, busy/own output, `earliest`, `maxWeeks`) + the 21 DB tests skipped without `SCHEDULING_DB_URL` |
| Types / build | `npx tsc --noEmit`, `npx next build` (dummy env) | clean / succeeds |
| **Live API** | `scripts/dev/capture-scheduling.sh` against the production build on a scratch DB | 22 real request/response pairs in `docs/captures/scheduling/`, used by `docs/fe-integration-guide-scheduling.md`; the live 409 `INSTRUCTOR_BUSY` is among them |
| **Browser** | production build on scratch DB, demo seed | 1280px: timetable with shaded availability, needs-scheduling panel with preference summaries (incl. the legacy `Monday` row), assign dialog preview (Mon 09:00 x6) and create (6 rows + `schedule.generate` audit), booked card in the instructor's window. 375px: agenda view, no horizontal scroll (after fixing the shared admin layout, which overflowed: `/admin/locations` is still wider than the screen at 375px, pre-existing), wizard step 2 preferences block |
| Preferences end to end | `POST /api/admin/enrollments` with structured fields | stored as `{mon,wed}\|{evening}\|18:30\|20:00\|2`; bad day / inverted range give 400 with readable messages |

**Not verified:** the public `POST /api/enrollments` with preferences against a live server (needs a Paystack key; it shares the validator with the walk-in route that was); the availability editor dialog, reschedule/status dialogs and the walk-in modal preferences were **built and type-checked but not clicked through in the browser** (the assign flow, timetable and wizard block were); `CONFLICT_RETRY` (deadlock) only by code; the 409 text through **Prisma Accelerate** (production URL), tested only on a direct connection: check one live conflict after deploy; admin pages other than the schedule page at 375px.

### Opus review (one pass, migration + concurrent bookings)
Read-only review; no blocker, no path to an overlapping active booking or an unaudited override found. Fixed in `18caf88`:
| Finding | Severity | Resolution |
|---|---|---|
| Two exclusion inserts can deadlock (40P01 / Prisma P2034) and surface as a 500 | should-fix | `withRetry` (3 attempts) on every transaction; exhausted ⇒ `409 CONFLICT_RETRY` |
| Partial unique index/exclusion constraints are invisible to Prisma and a future `migrate dev` could drop them | should-fix | catalog test + `verify-scheduling-migration.sh` drift check; comments on the schema |
| Generate accepted past start dates (classes that never happened could be marked held and feed S5 billing) | should-fix | slots before now are never proposed; `allowPast` backfill flag, audited as `backfill` (not in the UI) |
| `/tutors` reads only `Course.instructorId`, so an instructor added through the many-to-many list does not appear publicly | should-fix | **documented, not changed** (staged by design): see Follow-ups |
| Concurrent availability edits could merge; JSON `null` body gave 500; bad `courseIds` gave 500; deleting a location with availability gave 500; instructor delete race | notes | instructor row locked `FOR UPDATE`; `null` ⇒ 400; 400/409 mapping added |
Left as follow-ups (notes): `commitSchedule` does not re-check enrollment status inside the transaction (DB still guards double-booking); cancelled enrollments keep blocking instructor time until someone cancels their classes; two concurrent PATCHes removing the same course can leave `Course.instructorId` on a just-removed teacher.


## Operate / roll back
1. **Snapshot production first** and use the **direct (non-Accelerate) DB URL**: `postinstall` runs `prisma migrate deploy`, and the migration needs DDL rights.
1a. **Migration ordering.** `20261103170000_scheduling` sorts *before* migrations production already has (`…180000_fee_once_per_student`, `…180000_per_class_tuition`). `prisma migrate deploy` still applies a pending older-named migration; proven by `scripts/verify-scheduling-deploy.sh` (own scratch port): (a) the full 13-migration chain from an empty database, (b) production simulation: every migration except scheduling first, realistic data loaded, then `migrate deploy` applies scheduling on top (CREATE EXTENSION, 3 exclusion constraints, partial unique index, `InstructorCourse` backfill, no row loss, `migrate status` up to date, no drift, and an overlapping booking is rejected on the migrated database). Do not rename or reorder any already-applied migration directory.
2. **`btree_gist` must be creatable.** The migration runs `CREATE EXTENSION IF NOT EXISTS btree_gist`. On PG13+ it is a *trusted* extension (the database owner may create it); on a managed host confirm it is available (`select name from pg_available_extensions where name='btree_gist'`) **before** deploying. If it fails, the migration aborts (and later deploys wedge with P3009 until resolved): create the extension as a superuser, then `prisma migrate resolve --rolled-back 20261103170000_scheduling` and redeploy.
3. The migration is **additive**: no column or row dropped; `Course.instructorId` unchanged; existing enrollments untouched (new preference columns default empty). A code-only revert is safe: the new tables are simply unused. Full rollback = restore the snapshot (or drop `class_sessions`, `instructor_availability`, `instructor_courses` and the new `enrollments` columns/unique index by hand).
4. After deploy, in `/admin`: add each instructor's **availability** (Instructors → Availability) and **courses taught**; until then generating classes reports "The instructor has no availability set" and the admin must use the audited override.
5. Local verification: `scripts/verify-scheduling-migration.sh` (migration + legacy fixture, port 5470), `scripts/test-scheduling-db.sh` (real-DB service and concurrency tests), `npx tsx scripts/dev/seed-scheduling-demo.ts` (demo data for browser checks, refuses non-local DBs). **Never `npm install` without `--ignore-scripts`; `.env` is production.**

## Follow-ups
- **Behaviour change to know:** setting an instructor's courses no longer *takes* a course from its current instructor (before: one instructor per course, assigning reassigned it). `Course.instructorId` (the primary) is only set when empty, and `/tutors` still lists primaries only, so a second teacher added from the instructor page teaches but is not shown publicly. Decide whether `/tutors` should read the many-to-many list.
- **Ask John:** does a `missed` (no-show) class count as delivered (current: yes, slot consumed) or get made up? Are 30-minute classes ever needed (DB check is 45|60)? Any travel-time rule between locations?
- Stream 5 joins `(enrollmentId, sequence)` for paid-class derivation; Stream 7 wires the `TODO(S7)` hooks (scheduled / rescheduled / cancelled / missed).
- No student-facing view or login (out of scope); no recurring-series edit ("move all remaining Mondays to 10:00"): reschedule is per class.
- Existing classes are not re-validated when availability is later reduced (they were valid when booked); the timetable shows them outside the shaded availability.
- Availability replace-all is per instructor; no copy-week/holiday/leave concept yet.
