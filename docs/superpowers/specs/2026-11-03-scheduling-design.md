# Scheduling (Stream 4): instructor availability, class sessions, conflict prevention — design

**Date:** 2026-11-03 · **Status:** approved decisions from the lead (D12 etc.), builder calls marked · **Covers:** Stream 4 of the 2026-11-03 client meeting. Stacked on PR #12 (`feature/assessment-first-admission`). Tuition (S5) and messaging (S7) are out of scope; only seams are named.

## Intent
John runs one-to-one (and small-group) music tuition across physical centres, online, and at students' homes. After assessment and a plan (`plannedClasses`, `classesPerWeek`, `durationMins`), someone must put the real classes on a calendar with a real instructor, and **nobody may ever be double-booked**: if an instructor has a student on Monday 9:00, nobody else can be booked with them then. Done means: an admin can record when each instructor is available (per location or online), see a week timetable per instructor, assign an instructor and generate a student's classes from their preferences, reschedule, and mark classes held/missed/cancelled — and the database itself refuses an overlapping booking even under concurrent requests.

## Client requirements (John)
Students choose preferred weekdays, time ranges (morning/afternoon/evening, optional from/to), and 1 or 2 classes a week; class length 45 min or 1 hour; the system accounts for instructor availability and prevents conflicts; scheduling respects location (physical centre vs online vs home training); instructors are registered and can teach several courses.

## Decisions taken by the lead (do not re-litigate)
| ID | Decision |
|---|---|
| D12 | No money columns on `ClassSession`. Stream 5 derives "which classes are paid" from cumulative payments in class order. We expose a per-enrollment `sequence` (1..n) on each session so S5 can join later. No dependency on S5's schema. |
| TZ | Africa/Lagos fixed (UTC+1, no DST); store `timestamptz` (UTC). |
| Models | `InstructorAvailability`, `InstructorCourse` (M:N, `Course.instructorId` keeps working for `/tutors`, staged, no drop), `ClassSession`, structured preferences on `Enrollment`. |
| DB-level safety | Postgres exclusion constraints (`btree_gist`, `tstzrange`) per instructor **and** per student over active sessions (`scheduled`, `held`); raw-SQL migration; friendly application error mapped from the violation. Availability is enforced in code and rejected unless an explicit, audited admin override is passed. |
| Pure logic | Vitest-tested: recurring-session generator, overlap checker, availability check, time-band mapping. |
| UI | Availability editor on the instructor page; `/admin/schedule` week timetable per instructor; assign instructor + generate sessions for `plan_agreed`/`enrolled` from plan fields; reschedule; mark held/missed/cancelled; every mutation audited; wizard and walk-in capture structured preferences. No student portal. |
| Frozen | Enrollment status machine, the webhook, tuition/payments, emails untouched. S7 gets marked TODO hooks. |

## Data model
Conventions follow the repo: camelCase quoted columns, `@@map` snake-plural tables, vocabularies as `String` + SQL `CHECK`. Weekday is **ISO 1..7 (Mon..Sun)**. All wall-clock fields are Lagos local; instants are UTC.

- **`InstructorAvailability`** `{ id, instructorId → Instructor (cascade), weekday Int 1..7, startMinute Int, endMinute Int (minutes from local midnight, 0 <= start < end <= 1440), locationId → Location (restrict), mode String CENTRE|HOME|ONLINE }`. One row = "on this weekday between these times, at this place, in this mode". DB: `CHECK`s plus an exclusion constraint so one instructor's windows on the same weekday cannot overlap (an instructor is not in two places at once).
- **`InstructorCourse`** `{ instructorId, courseId }` composite PK, both cascade. Backfilled from `Course.instructorId`. An instructor "teaches" a course if they have a row here **or** are the course's legacy `instructorId`. The roster and course routes keep both in step (`lib/instructor-courses.ts`).
- **`ClassSession`** `{ id, enrollmentId, studentId, instructorId, locationId?, mode, startsAt timestamptz, durationMins 45|60, endsAt timestamptz, status, sequence, rescheduledFromId?, notes?, createdAt, updatedAt }`.
  - `(enrollmentId, studentId)` is a **composite FK** to `Enrollment(id, studentId)` (new `@@unique([id, studentId])`), so the denormalised `studentId` that the student exclusion constraint needs can never disagree with the enrollment. `instructorId` is `ON DELETE RESTRICT` (an instructor with classes cannot be deleted; the route returns a friendly 409).
  - `status`: `scheduled | held | missed | rescheduled | cancelled`.
  - **Active (blocks time) = `scheduled`, `held`.**
  - `endsAt` is stored (not generated: `timestamptz + interval` is not IMMUTABLE so it cannot be indexed or generated) and pinned by `CHECK (endsAt = startsAt + durationMins * interval '1 minute')`.
  - **`sequence`** names the class slot (1..n) in the enrollment. Slot occupiers: `scheduled`, `held`, `missed` (partial unique index `(enrollmentId, sequence) WHERE status IN ('scheduled','held','missed')`). `rescheduled` and `cancelled` free the slot. A reschedule marks the old row `rescheduled` and inserts a new row with the **same sequence** and `rescheduledFromId`, in one transaction.
- **`Enrollment` preferences** (additive): existing `preferredDays String[]` is reused with the canonical values `mon..sun` (a normaliser also accepts legacy `Monday`-style values); new `preferredTimeBands String[]` (`morning|afternoon|evening`), `preferredFromTime String?`, `preferredToTime String?` (`HH:MM`), `preferredClassesPerWeek Int?` (1|2). Legacy `schedulePreference` is kept and read as a fallback for display; new submissions leave it null.

### Constraints (raw SQL appended to the migration; Prisma does not model these)
1. `CREATE EXTENSION IF NOT EXISTS btree_gist`.
2. `class_sessions_instructor_no_overlap`: `EXCLUDE USING gist ("instructorId" WITH =, tstzrange("startsAt","endsAt",'[)') WITH &&) WHERE (status IN ('scheduled','held'))`.
3. `class_sessions_student_no_overlap`: same on `"studentId"`.
4. `CHECK` on duration, status, mode, `endsAt` pin, `sequence >= 1`; partial unique on sequence; availability `CHECK`s and its exclusion constraint.

Half-open ranges: a class ending 10:00 and one starting 10:00 do not conflict.

## Behaviour
**Availability check (application, overridable).** A class `[start,end)` in Lagos local time is *available* iff one availability row for that instructor has the same weekday, the same location **and** mode as the session, and fully contains the class. Rows are matched to a session by `(locationId, mode)`: `CENTRE`/`HOME` need a PHYSICAL location, `ONLINE` an ONLINE-kind location. A HOME class uses the student's enrollment location (the city whose homes the instructor visits).

**Conflict check (application preview + database truth).** The app pre-checks overlaps to produce a readable preview, but the exclusion constraints are the arbiter: if two admins book the same slot at once, exactly one insert wins and the other receives the friendly error `"<Instructor> already has a class at that time"` / `"<Student> already has a class at that time"` (HTTP 409), mapped from SQLSTATE `23P01` by constraint name. Double-booking is **never overridable**.

**Override (availability only).** `overrideAvailability: true` plus a non-empty `overrideReason` lets sessions outside availability be saved. Without it they are rejected (422 listing each offending slot). Every use writes an `AuditLog` row `schedule.availability_override` (inside the same transaction) naming the sessions, instructor and reason.

**Generator (pure).** Inputs: start date, how many classes to place, first sequence number, classes per week, duration, preferred days, preferred windows (from bands and/or from/to), the instructor's availability (or `null` to ignore it when overriding), and busy intervals (instructor's and student's existing active sessions). Weeks run Mon–Sun; in each week it takes up to `classesPerWeek` of the preferred days in calendar order and, per day, the earliest start on a 15-minute grid at which the class fits inside preferred window ∩ availability and clashes with no busy interval (including ones it just placed). Days that cannot fit are skipped; the result reports `placed` and `unplaced` (with a reason) so nothing is silently dropped. Empty preferred days means Monday–Saturday; empty windows mean 09:00–21:00 (**builder call**).

**Assign + generate (admin).** For an enrollment at `plan_agreed` or `enrolled` with plan fields set. Defaults come from the plan (`durationMins`, `classesPerWeek`, `plannedClasses`). It fills the *free sequence numbers* up to `plannedClasses` (so cancelling a class and regenerating refills that slot; a `missed` class stays consumed by design, see calls). A dry run returns the proposed slots, conflicts and availability problems without writing. The instructor must teach the course. Creation is all-or-nothing in one transaction.

**Status moves.** `scheduled → held | missed | cancelled`; corrections `held → missed | scheduled`, `missed → held | scheduled`; `cancelled` and `rescheduled` are terminal. `held`/`missed` may only be set once the class has started. Reschedule is only for `scheduled` classes (new time and/or instructor), same sequence, link kept.

**Audit.** `availability.update`, `schedule.generate`, `session.reschedule`, `session.status`, `schedule.availability_override`, all through `AuditLog`, written inside the mutation's transaction so a booking cannot exist without its record.

**Seams for later streams.** S5: join on `(enrollmentId, sequence)`; no money here. S7: `lib/scheduling/hooks.ts` exports no-op `onSessionsScheduled` / `onSessionRescheduled` / `onSessionStatusChanged` marked `TODO(S7)`, called after commit.

## Builder calls (mine, not John's)
| # | Call | Why |
|---|---|---|
| S1 | ISO weekday 1..7, availability as minutes-from-midnight ints | no timezone arithmetic in storage; trivial to validate; no DST in Lagos |
| S2 | Availability row carries `locationId` **and** `mode` (CENTRE/HOME/ONLINE) | "physical vs online vs home" is a per-slot fact, the same instructor may do centre mornings and home evenings |
| S3 | No travel-time buffer between locations | unknown to John; admin models it by leaving gaps in availability; noted as a follow-up |
| S4 | `missed` consumes its sequence slot, `cancelled` does not | a no-show is usually still a delivered, billable slot; cancelling is the admin's explicit "give it back". Confirm with John |
| S5 | Reschedule = new row + old row `rescheduled` | keeps history, keeps exclusion semantics trivial |
| S6 | `held`/`missed` only after the start time | prevents marking the future |
| S7 | Instructor must teach the course to be assigned (no override) | the roster is the source of truth; fix it there |
| S8 | `preferredClassesPerWeek` added next to the plan's `classesPerWeek` | the student's wish at application time has to live somewhere before the plan exists |
| S9 | Default windows/days when preferences are empty (Mon–Sat, 09:00–21:00) | still generates something sensible for "flexible" |
| S10 | Dry run is a flag on the generate route, not a separate route | fewer routes, one validation path |

## Anti-goals (a failure even if it "works")
- A double-booking that gets past the constraint under concurrent requests.
- An override that leaves no audit row, or that can also bypass a double-booking.
- Sessions generated for a plan the student hasn't got, or silently fewer classes than planned (unplaced must be reported).
- Changing the status machine, the webhook, or tuition.

## Verification plan
Vitest on all pure logic; migration on an ephemeral Postgres with a legacy fixture (scratch DB port 5470); a **real-DB concurrency test** proving N simultaneous inserts for one instructor slot yield exactly one success (and the same for a student, and for a reschedule racing a new booking); override path asserted to write the audit row; `npx tsc --noEmit`, `npx next build`, `npm test`; browser check of the timetable and the preferences step at 1280px and 375px; one Opus review of the migration and concurrent-booking behaviour.

## Deploy gates
Snapshot production first; use the **direct** (non-Accelerate) DB URL (`postinstall` runs `migrate deploy`); the migration runs `CREATE EXTENSION btree_gist`, so the DB role needs permission to create it (it is a trusted extension on PG13+ for the database owner; on managed hosts confirm it is available before deploy).
