# Student Entity Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a canonical `Student` (person) entity, re-point `Enrollment` at it via `studentId`, flip the enrollment lifecycle to write `status='enrolled'` on paid, and scaffold an `AuditLog` — without losing any existing production data.

**Architecture:** Full normalization (spec Approach A) executed as a **staged, additive migration**: migration 1 adds `students`/`audit_logs`, backfills one `Student` per email, links every enrollment, flips statuses, and leaves the old identity columns dormant-but-nullable; a later migration 2 drops them. Code then cuts every read/write over to `enrollment.student.*`.

**Tech Stack:** Next.js 15 (App Router, route handlers), Prisma 6 + PostgreSQL, TypeScript. **No unit-test framework** — verification is by `npx tsc --noEmit`, tsx harness scripts, and assertions against a local/scratch Postgres via `psql`/Prisma.

**Spec:** `docs/superpowers/specs/2026-08-31-student-entity-foundation-design.md`

## Global Constraints

- **Data safety:** deployed DB holds real data. Migration 1 is additive-only (no `DROP`). Take a DB snapshot before `prisma migrate deploy`. Rollback = restore snapshot.
- **Email is immutable identity.** `Student.email` is stored **lowercased**, unique, never updated after create (O3).
- **Dedup rule:** one `Student` per `lower(email)`; when rows differ, **most-recent enrollment (`createdAt`) wins** (backfill) / newest submission wins (re-enroll refresh, O4).
- **API shape:** enrollment responses **nest** `student` (O1) — consumers read `enrollment.student.*`.
- **Status vocabulary:** `enrolled` replaces `application_paid` as the written status value; `applicationPaid` boolean remains the payment fact.
- **No AI attribution** in commits (per repo convention).
- **Commit messages:** conventional-commit style, matching existing history.

---

### Task 1: Schema + staged migration (add Student, AuditLog, studentId; backfill; status flip)

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_add_student_and_audit/migration.sql` (via `--create-only`, then hand-edited)
- Create (scratch, not committed): `/tmp/foundation_seed.sql`, `/tmp/foundation_assert.sql`

**Interfaces:**
- Produces: Prisma models `Student` (fields per spec §4.1), `AuditLog` (spec §4.3), and `Enrollment.studentId: string` + `Enrollment.student: Student` relation. Later tasks consume `prisma.student`, `prisma.auditLog`, and `enrollment.student`.

- [ ] **Step 1: Pre-flight — confirm `gen_random_uuid()` on the target Postgres (O2)**

Run against the deploy DB (read-only):
```sql
SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto');
SELECT gen_random_uuid();
```
Expected: `gen_random_uuid()` returns a uuid. If it errors, add `CREATE EXTENSION IF NOT EXISTS pgcrypto;` as the first line of the migration (Step 4). Record the outcome in the migration file as a comment.

- [ ] **Step 2: Edit `prisma/schema.prisma` to the post-Foundation shape**

Add the two models and re-point `Enrollment`. The identity columns on `Enrollment` become **optional** (dormant) but are kept; add `studentId` + relation.

```prisma
model Student {
  id            String   @id @default(cuid())
  email         String   @unique
  firstName     String
  lastName      String
  phone         String?
  dateOfBirth   DateTime?
  address       String?
  landmark      String?
  guardianName  String?
  guardianPhone String?
  guardianEmail String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  enrollments   Enrollment[]
  @@map("students")
}

model AuditLog {
  id         String   @id @default(cuid())
  adminId    String?
  action     String
  entityType String
  entityId   String
  metadata   Json?
  createdAt  DateTime @default(now())
  @@index([entityType, entityId])
  @@index([adminId])
  @@map("audit_logs")
}
```

In `model Enrollment`: add `studentId String` and `student Student @relation(fields: [studentId], references: [id])`; change `email String` → `email String?`, `firstName String` → `firstName String?`, `lastName String` → `lastName String?` (the other identity fields are already optional). Keep all of them for now.

- [ ] **Step 3: Generate the migration skeleton (do not apply yet)**

Run: `npx prisma migrate dev --create-only --name add_student_and_audit`
Expected: a new folder under `prisma/migrations/` with `migration.sql`. Prisma will emit a required `student_id` column — that is wrong for existing rows, so Step 4 rewrites it.

- [ ] **Step 4: Replace the generated `migration.sql` with the staged, backfilled version**

```sql
-- Optional: only if Step 1 showed gen_random_uuid() unavailable
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. New tables
CREATE TABLE "students" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "address" TEXT,
  "landmark" TEXT,
  "guardianName" TEXT,
  "guardianPhone" TEXT,
  "guardianEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType","entityId");
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- 2. Add nullable FK column
ALTER TABLE "enrollments" ADD COLUMN "studentId" TEXT;

-- 3. Backfill: one student per lower(email), most-recent enrollment wins
INSERT INTO "students" ("id","email","firstName","lastName","phone","dateOfBirth",
                        "address","landmark","guardianName","guardianPhone","guardianEmail",
                        "createdAt","updatedAt")
SELECT gen_random_uuid()::text, s."email", s."firstName", s."lastName", s."phone", s."dateOfBirth",
       s."address", s."landmark", s."guardianName", s."guardianPhone", s."guardianEmail",
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (lower("email"))
         lower("email") AS "email", "firstName", "lastName", "phone", "dateOfBirth",
         "address", "landmark", "guardianName", "guardianPhone", "guardianEmail"
  FROM "enrollments"
  ORDER BY lower("email"), "createdAt" DESC
) s;

UPDATE "enrollments" e
SET "studentId" = st."id"
FROM "students" st
WHERE lower(e."email") = st."email";

-- 4. Enforce FK + NOT NULL
ALTER TABLE "enrollments" ALTER COLUMN "studentId" SET NOT NULL;
ALTER TABLE "enrollments"
  ADD CONSTRAINT "enrollments_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- 5. Relax dormant identity columns (kept, unused; dropped in migration 2)
ALTER TABLE "enrollments" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "enrollments" ALTER COLUMN "firstName" DROP NOT NULL;
ALTER TABLE "enrollments" ALTER COLUMN "lastName" DROP NOT NULL;

-- 6. Status flip: paid == enrolled
UPDATE "enrollments"
SET "status" = 'enrolled'
WHERE "status" = 'application_paid' OR "applicationPaid" = true;
```

- [ ] **Step 5: Write the seed + assert scripts for a scratch DB**

`/tmp/foundation_seed.sql` — representative old-shape rows (run against a scratch DB that has the **pre-Foundation** migrations applied):
```sql
-- assumes a valid course id; replace :cid with a real one or insert a course first
INSERT INTO "enrollments" ("id","courseId","email","firstName","lastName","selectedMode","status","applicationPaid","createdAt","updatedAt")
VALUES
 ('e1', :cid, 'Ada@Example.com','Ada','Old','Online','application_paid',true, now() - interval '2 day', now()),
 ('e2', :cid, 'ada@example.com','Ada','New','On-site','pending',false, now() - interval '1 day', now()),  -- same person, newer, different last name
 ('e3', :cid, 'bola@example.com','Bola','Solo','Online','pending',false, now(), now());
```

`/tmp/foundation_assert.sql`:
```sql
-- exactly one student per distinct lower(email)
SELECT (SELECT count(*) FROM students) AS students,
       (SELECT count(DISTINCT lower(email)) FROM enrollments) AS distinct_emails;   -- must be equal (2)
-- every enrollment linked
SELECT count(*) AS unlinked FROM enrollments WHERE "studentId" IS NULL;             -- must be 0
-- most-recent-wins: Ada's student lastName = 'New'
SELECT "lastName" FROM students WHERE email = 'ada@example.com';                     -- must be 'New'
-- status flipped, none left as application_paid
SELECT count(*) AS still_appic FROM enrollments WHERE status = 'application_paid';   -- must be 0
SELECT status FROM enrollments WHERE id = 'e1';                                      -- must be 'enrolled'
-- no rows lost
SELECT count(*) AS enrollments FROM enrollments;                                     -- must be 3
```

- [ ] **Step 6: Run the migration on a scratch DB and verify**

```bash
# scratch DB with pre-Foundation migrations applied, then:
psql "$SCRATCH_DB_URL" -f /tmp/foundation_seed.sql
psql "$SCRATCH_DB_URL" -f prisma/migrations/<timestamp>_add_student_and_audit/migration.sql
psql "$SCRATCH_DB_URL" -f /tmp/foundation_assert.sql
```
Expected: students=2 == distinct_emails, unlinked=0, lastName='New', still_appic=0, e1 status='enrolled', enrollments=3. If any assertion fails, fix the migration SQL and re-run on a fresh scratch DB.

- [ ] **Step 7: Regenerate the Prisma client and typecheck**

Run: `npx prisma generate && npx tsc --noEmit`
Expected: client regenerates; `tsc` will now report errors at every site still reading `enrollment.email`/`firstName`/etc. as required — those are the cutover sites for Tasks 3–5. Note them.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add Student + AuditLog, backfill enrollments, flip status to enrolled"
```

---

### Task 2: `lib/audit.ts` — activity logger

**Files:**
- Create: `lib/audit.ts`
- Create (scratch): `scripts/test-audit.ts`

**Interfaces:**
- Produces: `logAdminAction(entry: { adminId?: string | null; action: string; entityType: string; entityId: string; metadata?: unknown }): Promise<void>` — best-effort, never throws.

- [ ] **Step 1: Write the helper**

```ts
// lib/audit.ts
import { prisma } from './prisma'

export interface AuditEntry {
  adminId?: string | null
  action: string
  entityType: string
  entityId: string
  metadata?: unknown
}

/** Best-effort admin/system activity log. Never throws into a request path. */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: entry.adminId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata === undefined ? undefined : (entry.metadata as any),
      },
    })
  } catch (error) {
    console.error('Failed to write audit log:', entry.action, error)
  }
}
```

- [ ] **Step 2: Write a scratch verification script**

```ts
// scripts/test-audit.ts
import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { logAdminAction } from '../lib/audit'

async function main() {
  await logAdminAction({ adminId: null, action: 'test.system', entityType: 'test', entityId: 't1', metadata: { ok: true } })
  const row = await prisma.auditLog.findFirst({ where: { entityId: 't1' }, orderBy: { createdAt: 'desc' } })
  console.log(row?.action === 'test.system' && row?.adminId === null ? '✅ audit write ok' : '❌ audit write failed', row)
  process.exit(row ? 0 : 1)
}
main()
```

- [ ] **Step 3: Run it (against local DB) + typecheck**

Run: `npx tsx scripts/test-audit.ts && npx tsc --noEmit`
Expected: `✅ audit write ok`; tsc clean for this file.

- [ ] **Step 4: Commit**

```bash
git add lib/audit.ts scripts/test-audit.ts
git commit -m "feat(audit): add logAdminAction best-effort activity logger"
```

---

### Task 3: Enrollment create — find-or-create Student, link, dedup guard, refresh-on-reenroll

**Files:**
- Modify: `app/api/enrollments/route.ts` (the `POST` create block — currently ~lines 110–160)
- Create (scratch): `scripts/test-enroll-create.ts`

**Interfaces:**
- Consumes: `prisma.student`, `Enrollment.studentId` (Task 1).
- Produces: enrollment creation that upserts exactly one `Student` per lowercased email and creates `Enrollment` with `studentId` and no identity fields.

- [ ] **Step 1: Replace the paid-guard + enrollment.create block**

Old paid-guard queries `enrollment.findFirst({ where: { email, courseId, status: { in: ['application_paid','enrolled'] } } })` and `deleteMany({ where: { email, courseId, status: 'pending' } })`, then `enrollment.create` writes identity fields. Replace with a student-first flow:

```ts
const normalizedEmail = String(email).trim().toLowerCase()

// Find-or-create the person; refresh mutable fields on re-enroll (O4). Email immutable.
const student = await prisma.student.upsert({
  where: { email: normalizedEmail },
  update: {
    firstName, lastName,
    phone: phone ?? undefined,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    address: address ?? undefined,
    landmark: landmark ?? undefined,
    guardianName: guardianName ?? undefined,
    guardianPhone: guardianPhone ?? undefined,
    guardianEmail: guardianEmail ?? undefined,
  },
  create: {
    email: normalizedEmail,
    firstName, lastName,
    phone, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    address, landmark, guardianName, guardianPhone, guardianEmail,
  },
})

// Block only if this student already paid/enrolled for THIS course. A stale
// `pending` must not block a retry.
const paidEnrollment = await prisma.enrollment.findFirst({
  where: { studentId: student.id, courseId, status: 'enrolled' },
})
if (paidEnrollment) {
  return createErrorResponse('You are already enrolled in this course', 400)
}
await prisma.enrollment.deleteMany({
  where: { studentId: student.id, courseId, status: 'pending' },
})

const enrollment = await prisma.enrollment.create({
  data: {
    studentId: student.id,
    courseId,
    selectedMode,
    priorLevel,
    schedulePreference,
    preferredDays: preferredDays || [],
    musicExperience,
    goals,
    specialRequests,
    agreeToTerms,
    agreeToRefundPolicy,
    consentToEmails,
    couponCode,
    waitlistNotes,
    status: 'pending',
  },
})
```

Leave the downstream `applicationPayment.create` (uses `email`, `firstName`, `lastName` from the request body — still in scope), Paystack init, and the ack email untouched — they read the request variables, not the enrollment row.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `app/api/enrollments/route.ts` (the create block no longer references removed enrollment fields).

- [ ] **Step 3: Write a scratch create-flow check**

```ts
// scripts/test-enroll-create.ts — requires a local DB with a published, seatful course
import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const course = await prisma.course.findFirst({ where: { isPublished: true, isActive: true } })
  if (!course) throw new Error('seed a published course first')
  const email = 'Foundation.Test@Example.com'
  await prisma.enrollment.deleteMany({ where: { student: { email: email.toLowerCase() } } })
  await prisma.student.deleteMany({ where: { email: email.toLowerCase() } })

  // simulate two enrollments (same person) via the same upsert path the route uses
  for (const last of ['First', 'Second']) {
    const s = await prisma.student.upsert({
      where: { email: email.toLowerCase() },
      update: { firstName: 'Foundation', lastName: last },
      create: { email: email.toLowerCase(), firstName: 'Foundation', lastName: last },
    })
    await prisma.enrollment.create({ data: { studentId: s.id, courseId: course.id, selectedMode: course.availableModes[0], status: 'pending' } })
  }
  const students = await prisma.student.count({ where: { email: email.toLowerCase() } })
  const s = await prisma.student.findUnique({ where: { email: email.toLowerCase() }, include: { enrollments: true } })
  console.log(students === 1 && s?.lastName === 'Second' && s?.enrollments.length === 2 ? '✅ one student, refreshed, 2 enrollments' : '❌ failed', { students, last: s?.lastName, enrollments: s?.enrollments.length })
  process.exit(students === 1 && s?.lastName === 'Second' ? 0 : 1)
}
main()
```

- [ ] **Step 4: Run it**

Run: `npx tsx scripts/test-enroll-create.ts`
Expected: `✅ one student, refreshed, 2 enrollments`.

- [ ] **Step 5: Commit**

```bash
git add app/api/enrollments/route.ts scripts/test-enroll-create.ts
git commit -m "feat(enroll): create/link Student on enrollment; email-immutable, refresh on re-enroll"
```

---

### Task 4: Webhook — read student, write `enrolled`, audit

**Files:**
- Modify: `app/api/webhooks/paystack/route.ts` (`handleChargeSuccess` + `sendEnrollmentEmails`)

**Interfaces:**
- Consumes: `enrollment.student` include, `logAdminAction` (Task 2).

- [ ] **Step 1: Include `student` in the applicationPayment query**

In the `prisma.applicationPayment.findUnique(... include: { enrollment: { include: { course: {...}, student: true } } })` — add `student: true` alongside the existing `course` include.

- [ ] **Step 2: Flip the status write to `enrolled` + audit**

In the transaction that currently sets the enrollment, change `status: 'application_paid'` → `status: 'enrolled'` (keep `applicationPaid: true`). Immediately after the transaction commits, add:

```ts
await logAdminAction({
  adminId: null,
  action: 'enrollment.enrolled',
  entityType: 'enrollment',
  entityId: applicationPayment.enrollmentId,
  metadata: { reference, amount: applicationPayment.amount },
})
```
(Add `import { logAdminAction } from '@/lib/audit'` at the top.)

- [ ] **Step 3: Build the receipt from `student.*`**

In `sendEnrollmentEmails`, replace `enrollment.firstName/lastName/email/phone` with `enrollment.student.firstName/lastName/email/phone`, and `enrollment.createdAt` stays on enrollment. Same for the admin-notice block.

- [ ] **Step 4: Typecheck + signature harness**

Run: `npx tsc --noEmit && (npm run dev &) && sleep 6 && npm run test:webhook; pkill -f "next dev"`
Expected: tsc clean; `test:webhook` shows 200 accept / 400 reject. (Note: a fabricated reference still stops at Paystack verify before the DB writes — the `enrolled`/audit path is covered by tsc + review here; a full live assertion needs a real test-mode charge, tracked as a known limitation in the SOP.)

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/paystack/route.ts
git commit -m "feat(webhook): set status=enrolled on paid, read student.*, write audit log"
```

---

### Task 5: Read-site + admin UI cutover

**Files:**
- Modify: `app/api/admin/enrollments/[id]/tuition/route.ts` (receipt build + audit on record)
- Modify: `app/api/receipts/application-fee/[enrollmentId]/route.ts` (receipt build)
- Modify: `app/api/enrollments/[id]/route.ts` (GET include `student`, nest)
- Modify: `app/api/enrollments/verify/route.ts` (include `student` if it reads identity)
- Modify: `app/admin/enrollments/page.tsx` (read `student.*`, badge/filter vocabulary)

**Interfaces:**
- Consumes: `enrollment.student` (Task 1), `logAdminAction` (Task 2).

- [ ] **Step 1: Tuition route — include student, build receipt from `student.*`, audit**

Add `student: true` to the enrollment include; change `enrollment.firstName/lastName/email/phone` → `enrollment.student.*`. After the tuition payment is created, add:
```ts
await logAdminAction({ adminId: admin.id, action: 'tuition.record', entityType: 'tuition_payment', entityId: tuitionPayment.id, metadata: { enrollmentId, amount } })
```
(import `logAdminAction`.)

- [ ] **Step 2: Application-fee receipt route — build from `student.*`**

Add `student: true` include; swap identity reads to `enrollment.student.*`.

- [ ] **Step 3: Enrollment `[id]` GET + verify — include and nest `student`**

Add `student: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, address: true } }` to the include; ensure the JSON response nests it (no flattening).

- [ ] **Step 4: Admin enrollments page — read `student.*`, fix status vocabulary**

Update the `Enrollment` TS interface in the page to nest `student`. Change table cells reading `enrollment.firstName`/`lastName`/`email`/`phone` → `enrollment.student.*`. In `getStatusBadge`, treat `status === 'enrolled' || applicationPaid` as the paid/enrolled branch (label "Enrolled"); remove the `application_paid` `SelectItem` from the status filter, keep `pending` and `enrolled`.

- [ ] **Step 5: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no type errors; production build succeeds.

- [ ] **Step 6: Smoke-check the admin page locally**

Run the dev server, open `/admin/enrollments`, confirm names/emails render (from `student.*`), a paid enrollment shows the "Enrolled" badge, and the status filter lists only Pending / Enrolled.

- [ ] **Step 7: Commit**

```bash
git add app/api/admin/enrollments/[id]/tuition/route.ts app/api/receipts/application-fee/[enrollmentId]/route.ts app/api/enrollments/[id]/route.ts app/api/enrollments/verify/route.ts app/admin/enrollments/page.tsx
git commit -m "refactor(enroll): cut reads over to student.*; enrolled status vocabulary in admin UI"
```

---

### Task 6: Docs sync + SOP

**Files:**
- Modify: `docs/architecture/banafix-blueprint.md` (promote Student/status claims to CODE; update state machine + data model)
- Modify: `docs/checklist/master-checklist.md` (tick Foundation items)
- Create: `docs/sop/student-entity-foundation.md`
- Regenerate: the blueprint Artifact from the updated `.md`

- [ ] **Step 1: Update blueprint** — mark Student entity + `enrolled` write as 🟡 CODE; update §4 state machine (pending → enrolled is now real) and §5 data model (Student present). Note migration 2 (column drop) still pending.

- [ ] **Step 2: Update checklist** — tick the Foundation module items that are built + verified; leave the dormant-column-drop unticked with a note.

- [ ] **Step 3: Write the SOP** (`docs/sop/student-entity-foundation.md`) covering: what shipped, the staged-migration approach + backfill dedup rule, the retired `application_paid` value, verification (scratch-DB assertions), the deferred migration 2, and the known live-webhook test limitation.

- [ ] **Step 4: Regenerate the Artifact** from the updated blueprint `.md` (same URL) and commit docs.

```bash
git add docs/
git commit -m "docs: sync blueprint/checklist + SOP for Student entity foundation"
```

---

## Deferred (separate follow-up PR, after prod verification)

- **Migration 2** — drop the dormant `enrollments` identity columns (`email`, `firstName`, `lastName`, `phone`, `dateOfBirth`, `address`, `landmark`, `guardianName`, `guardianPhone`, `guardianEmail`) and remove them from `schema.prisma`.
- Reconcile O4 refresh-on-reenroll vs the edit-student module (req #2) source-of-truth when that lands.

## Self-review notes

- **Spec coverage:** Student model (T1) · AuditLog (T1/T2) · Enrollment.studentId + backfill (T1) · status flip + backfill (T1) · create cutover incl. O3/O4 (T3) · webhook enrolled + audit (T4) · read-sites + O1 nesting + admin vocabulary (T5) · migration 2 deferred (documented) · docs/SOP (T6). All spec sections mapped.
- **Data safety:** only T1 touches data; additive; scratch-DB verified before prod; snapshot + row-count gate.
- **Type consistency:** `logAdminAction(entry)` signature identical across T2/T4/T5; `student` relation name consistent; `enrolled` status string consistent.
