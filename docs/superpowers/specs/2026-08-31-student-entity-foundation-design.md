# Foundation: Student Entity + Enrolled Status + Audit Log — Design Spec

- **Date:** 2026-08-31
- **Branch base:** `banafix` @ `8c2e8dd`
- **Status:** Design approved in chat; awaiting spec review before implementation plan.
- **Blueprint refs:** `docs/architecture/banafix-blueprint.md` (§4, §5, §8) · decisions D1, D2, D3, D4.

## 1. Summary

Introduce a canonical `Student` (person) entity, re-point `Enrollment` at it, flip the
enrollment lifecycle so paying the registration fee sets `status = 'enrolled'`, and scaffold an
`AuditLog` for admin/system activity. This is the **foundation** the later modules (tuition
balance, edit-student, parents, birthday automation) all depend on, so it ships first.

The deployed database holds **real data that must be preserved**, so the migration is **staged
and additive** — the first migration only adds structure and backfills; a later, separate
migration drops the now-dormant columns after production is verified.

## 2. Goals / Non-goals

**Goals**
- One canonical person record (`Student`), keyed by unique, immutable `email`.
- `Enrollment` holds only per-course data + a `studentId` link.
- `status = 'enrolled'` is written when the application fee is confirmed; retire
  `application_paid` as a status *value* (the `applicationPaid` boolean remains the payment fact).
- `AuditLog` model + `logAdminAction()` helper, wired into the two mutations Foundation already
  touches (webhook enrollment, tuition record) to prove it end-to-end.
- No data loss; migration verifiable and rollback-able via snapshot.

**Non-goals (later modules)**
- `Parent` model + parent↔child mapping (req #3).
- Birthday automation / cron (req #4).
- Edit-student UI + `PATCH` endpoint (req #2) — Foundation only makes the data model ready.
- Tuition balance / full-part marking (req #1).
- Dropping the dormant `Enrollment` identity columns — deferred to a cleanup migration.
- Hardening public enrollment reads (D5) — separate follow-up.

## 3. Decisions applied

| Ref | Decision |
| --- | --- |
| D1 | Paying the registration fee **is** enrollment (no approval gate). Webhook sets `status='enrolled'`; `application_paid` status value retired + backfilled. Fee non-refundable (a note, not a status). |
| D2 | Introduce a `Student` entity keyed by unique, immutable email; `Enrollment` references it (Approach A — full normalization). |
| — | `address` **and** `landmark` are person attributes → `Student`. Guardian fields → `Student`. |
| — | Backfill dedup: when one email spans enrollments with differing name/DOB, **most-recent enrollment (`createdAt`) wins**. |
| D3 | (Consumed by later tuition module) expected total tuition = `course.pricing[selectedMode]`. |

## 4. Schema

### 4.1 New model `Student`

```prisma
model Student {
  id            String   @id @default(cuid())
  email         String   @unique          // immutable identity — never updated after create
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
```

### 4.2 `Enrollment` — after cutover

- **Adds:** `studentId String` + `student Student @relation(fields: [studentId], references: [id])`.
- **Removes (later cleanup migration; kept dormant + nullable in Foundation):** `email`,
  `firstName`, `lastName`, `phone`, `dateOfBirth`, `address`, `landmark`, `guardianName`,
  `guardianPhone`, `guardianEmail`.
- **Keeps:** `courseId`, `selectedMode`, `priorLevel`, `schedulePreference`, `preferredDays`,
  `musicExperience`, `goals`, `specialRequests`, `agreeToTerms`, `agreeToRefundPolicy`,
  `consentToEmails`, `applicationPaid`, `applicationFeeAmount`, `status`, `couponCode`,
  `waitlistNotes`, timestamps, `applicationPayments[]`, `tuitionPayments[]`.

### 4.3 New model `AuditLog`

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  adminId    String?                      // null = system action (e.g. webhook)
  action     String                       // "enrollment.enrolled", "tuition.record", ...
  entityType String                       // "enrollment", "tuition_payment", ...
  entityId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([adminId])
  @@map("audit_logs")
}
```

## 5. Migration plan (staged, additive)

**Migration 1 — `add_student_and_audit` (Foundation, this PR).** Prisma-generated schema DDL,
with a hand-authored SQL backfill inserted between the additive and constraint steps:

1. `CREATE TABLE students (...)`; `CREATE TABLE audit_logs (...)`.
2. `ALTER TABLE enrollments ADD COLUMN student_id TEXT;`  (nullable for now)
3. **Backfill (raw SQL in the migration):**
   ```sql
   -- one student per email; most-recent enrollment wins for name/DOB/etc.
   INSERT INTO students (id, email, "firstName", "lastName", phone, "dateOfBirth",
                         address, landmark, "guardianName", "guardianPhone", "guardianEmail",
                         "createdAt", "updatedAt")
   SELECT gen_random_uuid()::text, s.email, s."firstName", s."lastName", s.phone, s."dateOfBirth",
          s.address, s.landmark, s."guardianName", s."guardianPhone", s."guardianEmail",
          now(), now()
   FROM (
     SELECT DISTINCT ON (lower(email)) email, "firstName", "lastName", phone, "dateOfBirth",
            address, landmark, "guardianName", "guardianPhone", "guardianEmail"
     FROM enrollments
     ORDER BY lower(email), "createdAt" DESC
   ) s;

   UPDATE enrollments e
   SET student_id = st.id
   FROM students st
   WHERE lower(e.email) = lower(st.email);
   ```
   *(cuid vs `gen_random_uuid()`: backfilled ids may be UUID-shaped — acceptable, ids are opaque.
   Confirm `pgcrypto`/`gen_random_uuid()` availability on the target Postgres; fall back to a
   generated text id if absent.)*
4. `ALTER TABLE enrollments ALTER COLUMN student_id SET NOT NULL;`
   `ALTER TABLE enrollments ADD CONSTRAINT ... FOREIGN KEY (student_id) REFERENCES students(id);`
5. Make legacy identity columns nullable:
   `ALTER TABLE enrollments ALTER COLUMN email DROP NOT NULL;` (and `firstName`, `lastName`).
6. **Status backfill:**
   ```sql
   UPDATE enrollments
   SET status = 'enrolled'
   WHERE status = 'application_paid' OR "applicationPaid" = true;
   ```

**Migration 2 — `drop_enrollment_identity_columns` (later cleanup PR, after prod verification):**
drop the ten dormant identity columns from `enrollments`.

**Verification gates before deploy:**
- Row counts: `COUNT(enrollments)` unchanged; `COUNT(students) == COUNT(DISTINCT lower(email))`.
- Every `enrollments.student_id` non-null.
- No `status = 'application_paid'` rows remain; previously-paid rows now `enrolled`.

**Rollback:** Foundation migration is additive (no drops), so rollback = restore the pre-deploy
DB snapshot. Take the snapshot immediately before `prisma migrate deploy`.

## 6. Code cutover

`lib/email.ts` and `lib/receipt.ts` are unchanged — they accept plain data objects; only the
callers that build those objects change.

| File | Change |
| --- | --- |
| `lib/audit.ts` (new) | `logAdminAction({ adminId, action, entityType, entityId, metadata })` → best-effort insert; never throws into a request. |
| `app/api/enrollments/route.ts` (POST) | Find-or-create `Student` by `email` (transaction); create `Enrollment` with `studentId` and no identity fields. Duplicate-guard now: student by email → active enrollment on `studentId + courseId`. Ack email data comes from the submitted form (unchanged). |
| `app/api/webhooks/paystack/route.ts` | Include `enrollment.student`; build receipt from `enrollment.student.*`; set `status='enrolled'`; `logAdminAction({adminId:null, action:'enrollment.enrolled', entityType:'enrollment', entityId})`. |
| `app/api/admin/enrollments/[id]/tuition/route.ts` | Include `enrollment.student`; build receipt from `student.*`; `logAdminAction({adminId:admin.id, action:'tuition.record', ...})`. |
| `app/api/receipts/application-fee/[enrollmentId]/route.ts` | Build receipt from `enrollment.student.*`. |
| `app/api/enrollments/[id]/route.ts` (GET) + `/verify` | Include `student`; response nests `student` (or flattens — see §8 open item O1). |
| `app/admin/enrollments/page.tsx` | Read `enrollment.student.*`; badge treats `status==='enrolled'` (and `applicationPaid`) as Enrolled; remove `application_paid` from the status filter; duplicate/paid logic unchanged in meaning. |

## 7. Status model after Foundation

- `pending` → created, fee unpaid.
- `enrolled` → fee confirmed (webhook). `applicationPaid = true` alongside.
- `cancelled` → remains available; no writer yet (unchanged).
- `application_paid` → **retired** as a written value; backfilled to `enrolled`; removed from UI vocabulary.

## 8. Resolved decisions (confirmed)

- **O1 — API response shape:** ✅ **Nest** `student` under enrollment; the admin page and other
  consumers read `enrollment.student.*`. Audit consumers during cutover; none may depend on the
  flat shape.
- **O2 — `gen_random_uuid()` availability:** ✅ Verify against the deploy Postgres during planning;
  if absent (needs `pgcrypto`/PG13+), fall back to app-side id generation in a backfill script.
- **O3 — email casing:** ✅ Store `Student.email` **lowercased**; dedup on `lower(email)`.
- **O4 — re-enrollment with an existing email:** ✅ **Refresh mutable fields** (name, phone, DOB,
  address, guardian) from the new submission (most-recent-wins); `email` immutable. Flagged: once
  the edit-student module (req #2) lands, the edit UI becomes the source of truth and this
  auto-refresh must be reconciled so it can't clobber a manual edit. Acceptable for Foundation.

## 9. Testing strategy

- **Backfill (TDD):** seed a local Postgres with representative rows — a duplicate email across two
  courses (differing name/DOB), an `application_paid` row, a `pending` row — run the migration,
  assert: one `Student` per email, most-recent name/DOB won, all `student_id` set, statuses flipped,
  pre/post `enrollments` count equal.
- **App:** `tsc --noEmit` clean; existing `npm run test:webhook` still green; a fresh local
  enrollment creates exactly one `Student` and links it; a simulated `charge.success` sets
  `enrolled` and writes an `AuditLog` row.
- **Pre-deploy:** DB snapshot; run verification-gate queries (§5) post-migrate.

## 10. Definition of done

- Migrations authored, backfill verified locally on seeded data, no data loss.
- All read/write sites cut over; `tsc` clean; harnesses green.
- New enrollment → `enrolled` on payment; `AuditLog` rows appear for webhook + tuition.
- Blueprint + checklist updated; SOP written for the migration.
- Dormant-column drop deferred to the cleanup migration (tracked).
