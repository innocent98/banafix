# SOP — Reusable instructor roster

## What shipped
Promoted `Instructor` from a per-course one-to-one record to a **reusable roster** (one instructor
→ many courses), with a dedicated `/admin/instructors` management page. Branch `instructor-roster`
(off `banafix`).

## Why
Instructors were created inline per course and tied one-to-one (`instructors.courseId @unique`,
cascade-deleted with the course). The same teacher on multiple courses meant duplicated records and
no single place to manage them, and there was no admin page. Requested: make instructors reusable +
add a management page.

## How (key decisions)
- **Relation flipped** to one-to-many: `Course` gains nullable `instructorId` (FK, `onDelete: SetNull`);
  `Instructor` gains `courses Course[]` and `createdAt`/`updatedAt`; `instructors.courseId` dropped.
- **Data-preserving migration** (`20260902114015_instructor_roster`): adds `courses.instructorId`,
  backfills it from each instructor's old `courseId`, **dedupes the roster by normalized name**
  (`btrim(lower(name))`, keeping the highest-rated row, tie-break id) and repoints all its courses to
  the canonical instructor, then drops `courseId`. Deleting an instructor now frees its courses
  (SetNull) instead of deleting them.
- **Roster CRUD** at `/api/admin/instructors` + `/[id]`, with `instructor.create|update|delete` audit.
  Editing an instructor can reassign the **set of courses** it teaches (a course has one instructor,
  so assigning here reassigns it).
- **Course→instructor route rewired** (`PUT /api/admin/courses/[id]/instructor`): assign an existing
  instructor by `instructorId`, update the course's current instructor from fields, create+assign a
  new one, or unassign (`instructorId: null`) — the old `upsert by courseId` is gone.
- **Public `/api/instructors`** updated to `courses.some(published)` and returns aggregates
  (primary `course` kept for backward compat, plus `courses` count, combined specialties/students).

## What's involved (files)
- `prisma/schema.prisma` + `prisma/migrations/20260902114015_instructor_roster/migration.sql`.
- `app/api/admin/instructors/route.ts`, `app/api/admin/instructors/[id]/route.ts` (new).
- `app/api/admin/courses/[id]/instructor/route.ts` (rewired), `app/api/instructors/route.ts` (public, fixed).
- `app/api/admin/dashboard/stats/route.ts` (count fix), `prisma/seed.ts` (roster create).
- `app/admin/instructors/page.tsx`, `components/admin/instructor-roster-modal.tsx` (new) + admin nav.

## Verification
- Migration applied on an **ephemeral Postgres 16** with a **duplicate-name** case: 3 instructors
  (John Doe ×2 different casing/rating + Jane) → **2** after dedup; both of John's courses repoint to
  the higher-rated canonical row; Jane intact; **no course lost**; `courseId` dropped. Confirmed.
- `npx tsc --noEmit` → 0 · `npm run build` → succeeds (`/admin/instructors` + routes present).
- **Not verified live:** authed HTTP request cycle (types + build + migration scratch-test cover it).

## Follow-ups
- Course create/edit UI could add an instructor **picker** (assign from roster) alongside the
  existing inline create.
- If two genuinely different instructors share a name, the migration's name-dedup would merge them —
  vanishingly unlikely at this scale, but worth an admin review of the roster after the prod migration.
