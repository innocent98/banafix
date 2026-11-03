# FE integration guide — Scheduling (Stream 4)

Contract for the admin UI (and any future client) over the scheduling endpoints. **Every payload and error string below was copied from a real response** captured by `scripts/dev/capture-scheduling.sh` against the running app (production build, throwaway Postgres on 127.0.0.1, demo data from `scripts/dev/seed-scheduling-demo.ts`). The raw captures are in [`docs/captures/scheduling/`](captures/scheduling/) (`NN-name.json` = `{request, status, response}`); cite the file number to re-derive any claim. IDs in the captures are demo values, not real data. See the verification table at the end for what was **not** exercised live.

## What it is
After a student's plan is agreed (`plan_agreed` or `enrolled`, with `plannedClasses`, `classesPerWeek`, `durationMins` set), an admin assigns an instructor and the system proposes the classes from the student's preferences and the instructor's availability. Instructors and students can never be double-booked (the database refuses it). All endpoints are admin-only: send `Authorization: Bearer <admin JWT>`; without it you get the standard `401 {"error":"No token provided"}` of `withAuth`.

## Conventions and traps
- **Time zone.** All instants are ISO-8601 **UTC** (`"startsAt": "2026-11-09T08:00:00.000Z"`). The academy is **Africa/Lagos, UTC+1, no DST**: that example is 09:00 Lagos. Never use the browser's local zone; add 60 minutes. Inputs that are dates (`startDate`, `from`, `to`) are Lagos **calendar dates** `YYYY-MM-DD`.
- **Availability is minutes, not times.** `GET` returns `startMinute`/`endMinute` (minutes after Lagos midnight, `540` = 09:00, `1440` = midnight) and `weekday` **ISO 1..7 (Mon..Sun)**. `PUT` takes `"start":"09:00"`, `"end":"12:00"` (`"24:00"` allowed for end) — different shape in and out.
- **Error shape.** Scheduling errors are `{ "error": string, "code": string, "details"?: object }` and `code` is the stable thing to switch on. **Not every route has `code`**: `DELETE /api/admin/instructors/[id]` returns `{ "error": … }` only (capture 22), and the generic `withAuth` 401s have none.
- **`details` is present only for some codes** (`UNPLACEABLE`, `OUTSIDE_AVAILABILITY`, `INSTRUCTOR_BUSY`/`STUDENT_BUSY`, `SLOT_TAKEN`): absent, not null, otherwise.
- **`mode`** is `CENTRE | HOME | ONLINE` (not the delivery-mode names). `status` is `scheduled | held | missed | rescheduled | cancelled`.
- **`sequence`** is the class number within the enrollment (1..`plannedClasses`). A reschedule creates a **new session id** with the same `sequence`; keep the new `id` from the response.
- `preferredDays` on an enrollment may contain **legacy full names** (`"Monday"`, capture 08) as well as `mon..sun`. Display with the shared `describePreferences`.
- Legacy enrollments have `null` plan fields; `POST …/schedule` answers them with `400 PLAN_MISSING`/`NOT_PLANNED`, never a 500.

## Endpoints

### `GET /api/admin/instructors/[id]/availability` → 200 (capture 01)
```json
{ "availability": [ { "id": "…", "weekday": 1, "startMinute": 540, "endMinute": 720, "locationId": "loc_…", "mode": "CENTRE", "location": { "name": "Lagos", "kind": "PHYSICAL" } } ] }
```

### `PUT /api/admin/instructors/[id]/availability` — replaces the whole week
Body `{ "slots": [ { "weekday": 1, "start": "09:00", "end": "12:00", "locationId": "…", "mode": "CENTRE" } ] }` (empty list clears). Returns `{ "availability": [...] }` as raw rows (`id, instructorId, weekday, startMinute, endMinute, locationId, mode, createdAt, updatedAt`) with **no `location` object** (read from code; the success response was not captured live). `ONLINE` mode only at ONLINE-kind locations; `CENTRE`/`HOME` only at physical ones.
- 400 `INVALID_AVAILABILITY`: `{"error":"Monday 09:00 to 12:00 overlaps Monday 11:00 to 13:00","code":"INVALID_AVAILABILITY"}` (capture 02)
- 400 `MODE_LOCATION_MISMATCH`: `{"error":"Lagos is a physical location: use At the centre or At home","code":"MODE_LOCATION_MISMATCH"}` (capture 03)
- 409 `AVAILABILITY_OVERLAP` if two admins race (DB constraint; **not exercised over HTTP**, see table).

### `GET /api/admin/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD[&instructorId=]` → 200 (capture 20)
One call drives the timetable. Sessions of **all statuses** in the range (cancelled/rescheduled included: grey them out), the selected instructor's availability (empty array without `instructorId`), and the global "needs scheduling" list.
```json
{ "sessions": [ { "id": "…", "enrollmentId": "…", "sequence": 1, "startsAt": "2026-11-09T08:00:00.000Z", "endsAt": "2026-11-09T09:00:00.000Z", "durationMins": 60, "status": "scheduled", "mode": "CENTRE", "notes": null, "instructorId": "…", "locationId": "loc_…", "rescheduledFromId": null, "instructor": { "name": "Ada Okafor" }, "location": { "name": "Lagos" }, "enrollment": { "student": { "id": "…", "firstName": "Chi", "lastName": "Eze" }, "course": { "id": "…", "title": "Guitar Foundations" } } } ],
  "availability": [ { "id": "…", "weekday": 1, "startMinute": 540, "endMinute": 720, "locationId": "loc_…", "mode": "CENTRE", "location": { "name": "Lagos", "kind": "PHYSICAL" } } ],
  "needsScheduling": [ { "id": "<enrollmentId>", "plannedClasses": 4, "durationMins": 60, "classesPerWeek": 2, "preferredDays": ["mon", "wed"], "preferredTimeBands": ["evening"], "preferredFromTime": "18:30", "preferredToTime": "20:00", "preferredClassesPerWeek": 2, "schedulePreference": null, "student": { "firstName": "Walk", "lastName": "In" }, "course": { "id": "…", "title": "Guitar Foundations" }, "location": { "name": "Lagos" }, "scheduled": 0 } ] }
```
**Nesting trap:** here the student is under `sessions[].enrollment.student`; in `needsScheduling` it is `student` directly and the enrollment id is the row's own `id`. `needsScheduling.scheduled` counts sessions that occupy a class number (`scheduled`/`held`/`missed`). `needsScheduling` ignores the date range and `instructorId`. 400 `BAD_RANGE` (capture 21): `{"error":"from and to must be dates (YYYY-MM-DD) with to on or after from","code":"BAD_RANGE"}`.

### `GET /api/admin/enrollments/[id]/schedule` → 200 (capture 08)
`{ "enrollment": { id, courseId, status, plannedClasses, durationMins, classesPerWeek, preferredDays, preferredTimeBands, preferredFromTime, preferredToTime, preferredClassesPerWeek, schedulePreference }, "sessions": [ {id, sequence, startsAt, endsAt, durationMins, status, mode, notes, instructorId, instructor:{name}} ], "instructors": [ { "id": "…", "name": "Ada Okafor" } ] }` — `instructors` are those who teach the enrollment's course (the only valid choices for assigning).

### `POST /api/admin/enrollments/[id]/schedule` — assign + generate
Body: `{ "instructorId", "startDate", "count"?, "mode"?, "dryRun"?, "allowPartial"?, "allowPast"?, "overrideAvailability"?, "overrideReason"? }`. Defaults come from the plan; `count` defaults to every free class number; `mode` defaults from the location kind/format.
- **Dry run** (`"dryRun": true`) → **200** `{ "plan": … }`, nothing written (capture 10). Real run → **201** `{ "sessions": [ClassSession], "plan": … }` (capture 11).
```json
{ "plan": { "enrollmentId": "…", "instructor": { "id": "…", "name": "Ada Okafor" }, "student": { "id": "…", "name": "Dayo Ade" }, "mode": "CENTRE", "locationId": "loc_…", "durationMins": 45, "classesPerWeek": 1, "plannedClasses": 6, "alreadyScheduled": 0,
  "placed": [ { "sequence": 1, "startsAt": "2026-11-09T09:00:00.000Z", "endsAt": "2026-11-09T09:45:00.000Z" } ],
  "unplaced": [], "outsideAvailability": [], "overrideAvailability": false } }
```
A `ClassSession` is `{ id, enrollmentId, studentId, instructorId, locationId, mode, startsAt, durationMins, endsAt, status, sequence, rescheduledFromId, notes, createdAt, updatedAt }` (capture 11). **Always dry-run first and show `placed`, `unplaced` (with `reason`) and `outsideAvailability` to the admin.**

Errors (all `{error, code, details?}`):
| Status | `code` | Real message / meaning | Capture |
|---|---|---|---|
| 400 | `NOT_PLANNED` | `Classes can only be scheduled once the plan is agreed` | 04 |
| 400 | `BAD_START_DATE` | `startDate must be a date like 2026-11-09` | 09 |
| 400 | `OVERRIDE_REASON_REQUIRED` | `Say why the instructor is being booked outside their availability` | 07 |
| 400 | `PLAN_MISSING`, `LOCATION_MISSING`, `DURATION_UNSUPPORTED`, `INSTRUCTOR_NOT_ASSIGNED_TO_COURSE`, `NOTHING_TO_SCHEDULE`, `BAD_COUNT`, `BAD_MODE`, `MODE_LOCATION_MISMATCH`, `INSTRUCTOR_REQUIRED` | message states the fix | message strings from code, **not captured live** |
| 404 | `ENROLLMENT_NOT_FOUND`, `INSTRUCTOR_NOT_FOUND` | | not captured |
| 422 | `UNPLACEABLE` | `No classes could be placed with these preferences and this instructor`, `details.unplaced[] = {sequence, reason}`; with some placed but not all: `Only N of M classes fit…` unless `allowPartial` | 05 |
| 409 | `INSTRUCTOR_BUSY` / `STUDENT_BUSY` | `"<Name> already has a class at that time"`, `details: {sequence, startsAt}` — **never overridable**; refresh and re-preview | 12 (via reschedule) |
| 409 | `SLOT_TAKEN`, `CONFLICT_RETRY` | class number taken by a concurrent request / deadlock retry exhausted: refresh and retry | not exercised over HTTP |

**Override:** send `overrideAvailability: true` with a non-empty `overrideReason`. It ignores the instructor's availability for the **whole run** (the preview with the flag on shows what that means). It never bypasses double-booking. **`allowPast`** is for back-filling classes already taught; the UI must not send it.

### `POST /api/admin/sessions/[id]/reschedule`
Body `{ "startsAt": "<ISO instant>", "instructorId"?, "durationMins"? (45|60), "mode"?, "overrideAvailability"?, "overrideReason"? }` → **200** `{ "session": ClassSession }` (capture 15: new `id`, same `sequence`, `rescheduledFromId` = old id; the old row becomes `rescheduled`). Only `scheduled` classes; the new time must be in the future.
- 409 `INSTRUCTOR_BUSY` (capture 12): `{"error":"Ada Okafor already has a class at that time","code":"INSTRUCTOR_BUSY","details":{"sequence":1,"startsAt":"2026-11-09T08:00:00.000Z"}}` — the original class stays `scheduled`.
- 422 `OUTSIDE_AVAILABILITY` (capture 13): `{"error":"Ada Okafor is not available then. Pick a time inside their availability or override with a reason","code":"OUTSIDE_AVAILABILITY","details":{"startsAt":"2026-11-10T08:00:00.000Z","weekday":2,"minuteOfDay":540}}` (`weekday`/`minuteOfDay` are Lagos local). Offer the override checkbox now.
- 400 `OVERRIDE_REASON_REQUIRED` (capture 14). Others (`NOT_RESCHEDULABLE`, `IN_THE_PAST`, `BAD_START`, …) by code, not captured.

### `POST /api/admin/sessions/[id]/status`
Body `{ "status": "held"|"missed"|"cancelled"|"scheduled", "note"? }` → **200** `{ "session": ClassSession }` (capture 18). Moves: `scheduled → held|missed|cancelled`; `held ↔ missed`/`→ scheduled`; `missed → held|scheduled`; `cancelled` is final. `held`/`missed` only once the class has started.
- 400 `NOT_STARTED`: `A class can only be marked held or missed once it has started` (16)
- 400 `BAD_STATUS`: `status must be scheduled, held, missed or cancelled` (17, e.g. `rescheduled` is not settable)
- 400 `BAD_TRANSITION`: `A cancelled class cannot become scheduled` (19)
- 409 `INSTRUCTOR_BUSY` when reverting a missed/held class onto a slot someone else now holds; 409 `CHANGED` on a concurrent edit (refresh).

### Related changes
- `POST /api/enrollments` and `POST /api/admin/enrollments` accept `preferredDays` (`mon..sun`), `preferredTimeBands` (`morning|afternoon|evening`), `preferredFromTime`, `preferredToTime` (`HH:MM`, from < to), `preferredClassesPerWeek` (1|2). Bad values → 400 with a readable `error`, e.g. `{"error":"Unknown day \"funday\""}`, `{"error":"The earliest time must be before the latest time"}` (observed live against the walk-in route; the public route shares the validator). The old free-text `schedulePreference` is no longer sent.
- `PATCH /api/admin/instructors/[id]` with `courseIds` now sets the many-to-many *teaches* list; **`courses` in instructor responses is that list**. `DELETE /api/admin/instructors/[id]` → **409** `{"error":"Ada Okafor has 10 classes on record and cannot be removed. Reassign or cancel their upcoming classes and keep them on the roster"}` (capture 22). `DELETE /api/admin/locations/[id]` is also refused (409) while availability windows reference it.

## UX consequences the FE must surface
1. **A preview that places fewer classes than planned is normal** (availability/preferences too tight). Show `unplaced` reasons; do not silently schedule fewer. Offer "schedule only those that fit" (`allowPartial`) explicitly.
2. **A 409 busy error is a stop, not a warning**: no override exists. Tell the admin who is busy and offer to pick another time/instructor.
3. **Override needs a reason and is permanent in the audit log** (`schedule.availability_override`). Make that visible next to the checkbox.
4. **Cancelling a class frees its number** (regenerate refills it); **missed keeps it** (counts as delivered).
5. **Times are Lagos.** A card at `08:00Z` must read 09:00.
6. Reducing an instructor's availability does **not** move existing classes; they will show outside the shaded availability.
7. A student who gave no preferences is treated as flexible (Mon–Sat, 09:00–21:00); say so in the assign dialog.

## Verification table
| Behaviour | Status |
|---|---|
| availability GET / PUT validation errors (02, 03) | **verified live** |
| availability PUT success + replace-all + `AVAILABILITY_OVERLAP` race | success path and the constraint verified in the real-DB test (`service.db.test.ts`); **not captured over HTTP** |
| timetable GET and `BAD_RANGE` (20, 21) | **verified live** |
| enrollment schedule GET (08) | **verified live** |
| dry run (10), create (11), unplaceable (05, 06), not planned (04), bad date (09), override needs reason (07) | **verified live** |
| reschedule success (15), busy 409 (12), outside availability 422 (13), override reason (14) | **verified live** |
| status held-too-early / bad status / cancel / after-cancel (16–19) | **verified live** |
| instructor delete 409 (22) | **verified live** |
| `STUDENT_BUSY`, `SLOT_TAKEN`, `CONFLICT_RETRY`, concurrent-booking exactly-one-wins | **DB-level race tests only** (real Postgres, no HTTP); `CONFLICT_RETRY` path is code only (the deadlock needs a specific interleaving) |
| messages for codes marked "not captured" | read from `lib/scheduling/service.ts`, **not live** |
| 409 text through Prisma **Accelerate** (production URL) | **NOT verified**: tested only against a direct connection; check one live 409 after deploy |
| preference validation on the public `POST /api/enrollments` | walk-in route verified live; the public route uses the same validator but was **not called live** (needs a Paystack key) |
