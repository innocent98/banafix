# SOP — Student entity foundation (D1 + D2)

## What shipped
A canonical `Student` (person) entity, keyed by a unique, immutable, lowercased email, now
sits behind every `Enrollment`. Enrolling links to (or creates) a `Student` instead of
duplicating name/email/phone/etc. on every enrollment row. The webhook now writes
`status = 'enrolled'` directly on a paid application fee — the previously-dead
`application_paid` status value is retired and every existing row was backfilled. Every
admin/system mutation that changed as part of this (webhook payment, tuition recording) now
writes an `AuditLog` row via a new best-effort `logAdminAction()` helper.

A final-review fix wave (below, "final-fix-wave" section) then closed out every item the task
reviews had deferred: migration email-normalization parity with the app (`btrim(lower())`),
an index on `enrollments.studentId`, the dropped "Tuition Paid" admin badge, plus two
cosmetic cleanups.

Commits (branch `foundation-student-entity`, off `banafix` @ `9db7731`):
| Commit | What |
| --- | --- |
| `cc2e733` | Schema: `Student`, `AuditLog` models; `Enrollment.studentId` FK; staged migration (backfill + status flip) |
| `af81007` | `lib/audit.ts` — `logAdminAction()` helper |
| `9651c34` | `POST /api/enrollments` — find-or-create `Student`, link, dedup guard, refresh-on-reenroll |
| `8357dff` | Webhook — write `status='enrolled'`, read `student.*`, write `AuditLog` |
| `3dd52b4` | Cut every remaining read-site (admin API/UI, receipts, dashboard) over to `student.*`; admin status vocabulary to `pending`/`enrolled` |
| *(final-fix-wave, see below)* | Migration email-normalization parity, `studentId` index, "Tuition Paid" badge restore, 2 cosmetic cleanups |

## Why
Two open questions blocked three planned modules (tuition-balance editing, parent↔child
mapping, birthday automation):

- **D1 — what does `enrolled` mean, given nothing wrote it?** Decided: paying the
  registration fee **is** enrollment, no separate approval gate. The webhook should set
  `status = 'enrolled'` directly on a verified `charge.success`; the `application_paid`
  status value was redundant with the `applicationPaid` boolean and is retired.
- **D2 — what is a "student" for parent-mapping and birthdays?** Decided: introduce a
  `Student` entity keyed by a unique immutable email. Before this, `Enrollment.email` was
  **not unique** — a person enrolling in two courses was two unrelated rows, so birthdays
  and parent↔child mapping had no stable person to dedupe or attach to.

Root cause of both gaps: the schema had never separated "the person" from "the enrollment
event," so there was no single row to write a lifecycle status onto or attach a parent to.

## How

### Staged, additive migration (not a destructive rewrite)
The single new migration (`prisma/migrations/20260831150105_add_student_and_audit/migration.sql`)
is deliberately staged so it is safe to run against a database already holding real rows:
1. Create `students` and `audit_logs` tables.
2. Add `enrollments.studentId` as **nullable** first (not `NOT NULL` — a naive Prisma-generated
   migration would emit `studentId TEXT NOT NULL` with no backfill, which fails immediately
   against existing rows; confirmed by generating and inspecting that migration during
   verification).
3. Backfill `students`, one row per `lower(email)`, **most-recent-enrollment wins**
   (`DISTINCT ON (lower(email)) ... ORDER BY createdAt DESC`) — so if the same person enrolled
   twice with a different last name, the newer submission becomes the `Student` record.
4. Link every `enrollment.studentId` to its student via `lower(email)` match.
5. **Only then** flip `studentId` to `NOT NULL` and add the FK
   (`ON UPDATE CASCADE ON DELETE RESTRICT`).
6. Relax `enrollments.email`/`firstName`/`lastName` to nullable — the columns are **kept, not
   dropped**. They become dormant (unread by app code after this shipment) rather than removed.
7. Flip `status` to `'enrolled'` wherever `status = 'application_paid' OR "applicationPaid" = true`.

No `DROP TABLE`/`DROP COLUMN` anywhere in the migration.

### Backfill dedup rule
One `Student` per **lowercased** email. When the same email appears on multiple enrollment
rows (a repeat applicant, or the same person spelled their name differently across
submissions), the **most recent** enrollment's identity fields (`createdAt DESC`) win as the
seed `Student` record — matching the live behavior going forward (`upsert` refresh-on-reenroll,
see O4 below). Tie-break between two enrollments with an identical `lower(email)` **and**
identical `createdAt` is non-deterministic (negligible in practice — sub-millisecond
collisions on real traffic).

### Retired `application_paid` status value
`Enrollment.status` no longer has an `application_paid` value anywhere in the live code path.
The migration flipped every existing row to `enrolled`; the webhook writes `enrolled` directly
on paid; nothing in the app writes `application_paid` anymore. The column is still an untyped
`String` at the DB level (no enum/check constraint), so this is a behavioral guarantee from the
code, not a schema-enforced one.

### `AuditLog` + `logAdminAction()`
`lib/audit.ts` exports `logAdminAction(entry: AuditEntry): Promise<void>` — a thin wrapper
around `prisma.auditLog.create()`. **Best-effort by design**: wrapped in try/catch, logs to
stderr on failure, never rethrows — so an audit-write failure can never break the request that
triggered it (the webhook's payment-processing response, or the admin's tuition-record
response). Wired into:
- the webhook, after the payment `$transaction` commits (`action: 'enrollment.enrolled'`,
  `adminId: null` since it's a system/webhook action) — deliberately placed *outside* the
  transaction, so an audit-write failure cannot roll back the payment/status update;
- admin tuition recording (`action: 'tuition.record'`, `adminId: admin.id`).

Not yet surfaced in any admin UI — recorded now, to be read later.

### Enrollment-create flow (O3/O4)
`POST /api/enrollments` now does `prisma.student.upsert({ where: { email: normalizedEmail } })`
where `normalizedEmail = String(email).trim().toLowerCase()` (O3 — email always stored
lowercased). On `update` (an existing student re-enrolling), every mutable field (name, phone,
DOB, address, guardian info) is **refreshed** to the new submission's values (O4 — the newest
enrollment form is treated as the current source of truth for that person). Email itself is
never updated after creation — it is the immutable identity key.

The duplicate-enrollment guard was re-scoped from `email + courseId` to `studentId + courseId`,
and now blocks only on `status: 'enrolled'` (not the old `application_paid`/`pending` mix) —
a stale `pending` no longer blocks a retry.

### Read-site cutover
Every remaining site that read `enrollment.email/firstName/lastName/phone/dateOfBirth/address`
directly was cut over to `enrollment.student.*` (nested include, not flattened) — admin
enrollment API + page, tuition recording + receipt regeneration routes, application-fee
receipt route, enrollment verify route, admin dashboard "recent activity" feed, and the tuition
payment modal's local type. Three of these (the admin dashboard stats feed and the tuition
payment modal) were found by a `grep` sweep, not named in the original task briefs — they used
`any`-typed callbacks or a structurally-separate local interface, so `tsc` would not have
caught them; left unfixed they would have silently rendered blank/undefined names.

### Final-review fix wave
Applied 2026-08-31, before the migration had run against prod, so the staged migration file
was edited in place rather than superseded by a second migration:

1. **Migration email-normalization parity (the must-fix).** The backfill/link logic used
   `lower("email")`; the app's create path (`app/api/enrollments/route.ts`) normalizes with
   `String(email).trim().toLowerCase()`. A whitespace-padded pre-existing email would have
   backfilled a padded `students.email`, and a later trimmed re-enrollment would then fail to
   match it on `upsert({ where: { email } })` — silently creating a second `Student` for the
   same person instead of erroring. Changed every normalization site in the migration
   (`DISTINCT ON`, the projected `email`, `ORDER BY`, and the link `UPDATE ... WHERE`) from
   `lower("email")` to `btrim(lower("email"))`, so `students.email` now matches the JS
   `.trim().toLowerCase()` exactly.
2. **`enrollments.studentId` index.** The dedup path (`findFirst`/`deleteMany` on
   `studentId + courseId` in `POST /api/enrollments`) had no supporting index. Added
   `@@index([studentId])` to `model Enrollment` in `prisma/schema.prisma`, and
   `CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");` at the end of the
   same staged migration (appended, not inserted mid-file, so the backfill ordering above is
   untouched).
3. **Restored the "Tuition Paid" admin badge.** The `3dd52b4` cutover had collapsed every
   paid/enrolled row to a single "Enrolled" badge, losing the earlier distinction between
   "paid the application fee" and "also has a completed tuition payment." Restored it without
   reintroducing the retired `application_paid` status: inside the existing
   `status === 'enrolled' || applicationPaid` branch of `getStatusBadge`, an enrollment with
   `tuitionPayments?.some(p => p.status === 'completed')` now renders "Tuition Paid" instead of
   "Enrolled". The `pending`/"Payment Pending" branch and the status-filter dropdown (no
   `application_paid` option) are unchanged.
4. **Cosmetic — `lib/audit.ts`.** `metadata: entry.metadata === undefined ? undefined : (entry.metadata as any)`
   simplified to `metadata: entry.metadata as any` — Prisma already omits an `undefined` field
   from the write, so the ternary was a no-op. Behavior unchanged.
5. **Cosmetic — stale comment.** `app/api/enrollments/route.ts`'s paid-guard comment said
   "already paid/enrolled" when the code only checks `status: 'enrolled'`; reworded to "already
   enrolled in THIS course" to match.

## What's involved
| File | Change |
| --- | --- |
| `prisma/schema.prisma` | `model Student`, `model AuditLog`; `Enrollment.studentId` FK; `email`/`firstName`/`lastName` on `Enrollment` relaxed to nullable; `@@index([studentId])` (final-fix-wave) |
| `prisma/migrations/20260831150105_add_student_and_audit/migration.sql` | New staged migration (create tables, nullable FK, backfill, NOT NULL + FK, status flip); backfill/link normalization changed to `btrim(lower())` and `enrollments_studentId_idx` added (final-fix-wave) |
| `lib/audit.ts` | New — `logAdminAction()`; no-op `metadata` ternary simplified (final-fix-wave) |
| `app/api/enrollments/route.ts` | `POST`: student upsert + link + dedup guard rewrite; `GET` list: `student` include + email filter re-keyed to `student.email`; paid-guard comment reworded (final-fix-wave) |
| `app/api/webhooks/paystack/route.ts` | `handleChargeSuccess`: `student` include, `status='enrolled'` write, `logAdminAction` call; `sendEnrollmentEmails`: reads `enrollment.student.*` |
| `app/api/admin/enrollments/[id]/tuition/route.ts` | `student` include, receipt data from `student.*`, `logAdminAction` call |
| `app/api/admin/tuition-payments/[id]/receipt/route.ts` | `student` include, receipt data from `student.*` (GET + POST) |
| `app/api/receipts/application-fee/[enrollmentId]/route.ts` | `student` include, receipt data from `student.*` (GET + POST) |
| `app/api/enrollments/[id]/route.ts` | `student` include on `GET` |
| `app/api/enrollments/verify/route.ts` | `student` include (`firstName`, `email`) |
| `app/api/admin/dashboard/stats/route.ts` | "Recent activity" feed reads `student.firstName/lastName` (found via grep, not in original scope) |
| `app/admin/enrollments/page.tsx` | `student` in `Enrollment` interface; search/table/detail-modal reads; `getStatusBadge` simplified to `pending`/`enrolled`; status filter dropdown drops `application_paid`; `getStatusBadge` now distinguishes "Tuition Paid" from "Enrolled" (final-fix-wave) |
| `components/admin/tuition-payment-modal.tsx` | Local `Enrollment` interface nests `student` (found via grep — required for `tsc` to pass once the page's interface changed) |

No changes to `lib/receipt.ts` or `lib/email.ts` — both take locally-defined DTO parameter
shapes populated by their callers, not raw Prisma `Enrollment` reads.

## Verification
- **Scratch DB (Docker Postgres 16-alpine, `banafix-scratch-pg`, `127.0.0.1:5433`)** — never
  the real Accelerate-proxied `DATABASE_URL`. Bootstrapped to the pre-Foundation schema, seeded
  with enrollments across duplicate/varying-case emails, then the new migration applied and 6
  assertion queries run:
  - 2 distinct lowercased emails → 2 `Student` rows.
  - 0 enrollments unlinked to a student.
  - The most-recent enrollment's `lastName` won the backfill.
  - 0 rows still carrying `application_paid`.
  - The flipped row's status reads `enrolled`.
  - Row count unchanged (3 enrollments in, 3 out) — no data loss.
  All 6 passed on the first clean run (`task-1-report.md`).
- **Create/dedup/refresh flow** — a scratch-DB script (`scripts/test-enroll-create.ts`) submitted
  the same email twice with a different last name; asserted one `Student` row, the refreshed
  (second) `lastName`, and two linked enrollments (`task-3-report.md`).
- **Audit write round-trip** — `scripts/test-audit.ts` wrote and read back an `AuditLog` row
  against scratch DB (`task-2-report.md`).
- **Type safety** — `npx tsc --noEmit` → 0 errors, repo-wide, after the full cutover.
- **Build** — `npm run build` → succeeded, all 35 static pages generated, all dynamic API
  routes built.
- **Webhook signature harness** — `npm run test:webhook` (real dev server): valid signature
  → 200 accepted; forged signature → 400 rejected.
- **Final-fix-wave re-verification (2026-08-31, scratch DB reset from scratch)** — schema
  dropped/recreated, the 3 pre-Foundation migrations reapplied via `psql -f`, then seeded with
  a padded/mixed-case-email row (`'  Ada@Example.com '`, older) and a clean-email row
  (`'ada@example.com'`, newer) for the same person, plus a distinct third person, before
  applying the edited migration:
  - Exactly 1 `Student` row for the padded+clean person (dedup survives the whitespace/case
    difference) — confirmed via `count(*) WHERE email = 'ada@example.com'` = 1.
  - `SELECT * FROM students WHERE email <> btrim(email)` → 0 rows (no padded emails persisted).
  - All 3 enrollments linked (`count(*) = count("studentId")` = 3/3), including the padded-email
    row resolving to the same `studentId` as the clean-email row.
  - `SELECT indexname FROM pg_indexes WHERE tablename='enrollments'` includes
    `enrollments_studentId_idx`.
  - `npx prisma generate && npx tsc --noEmit` → 0 errors.
  - `npm run build` → succeeded (same 35 static pages / dynamic routes as before).
  Full command transcript and assertion output: see the session report referenced in
  `.superpowers/sdd/2026-08-31-student-entity-foundation/final-fix-report.md`.

### Known limitation — stated plainly
The `enrolled` status write, the `AuditLog` row, and the student-sourced receipt/admin-notice
fields inside the webhook's `handleChargeSuccess` are **verified only by types + code review,
not by a live run**. `npm run test:webhook` sends a *fabricated* Paystack reference; the
handler calls `verifyPayment(reference)` against Paystack first, and a fabricated reference
fails that verification — the function returns early, before the `$transaction`, the
`logAdminAction` call, or `sendEnrollmentEmails` are ever reached. No production DB row was
read or written by any test run in this shipment. Closing this gap requires a real Paystack
test-mode charge (webhook fired by Paystack itself, or a manually-verified test reference) —
deliberately out of scope here per the task briefs, which barred touching the live/prod DB or
attempting a real charge.

This is separate from, and does not fix, the **pre-existing, unrelated** email-delivery
blocker: `RESEND_API_KEY` is still a placeholder, so no email in this system — old or new —
actually sends yet.

## Operate / roll back
- **Before applying to production:** take a DB snapshot/backup first. The migration is
  additive and staged (no drops), but it does rewrite `status` on every currently
  `application_paid`/`applicationPaid=true` row and populates `studentId` on every existing
  enrollment — verify the snapshot exists and the row-count/backfill assertions above pass
  against a copy of production data before running for real.
- **Running the migration needs a direct Postgres connection** (`prisma migrate deploy`
  against a real `DATABASE_URL`), **not** the Prisma Accelerate proxy URL the app uses at
  runtime — Accelerate cannot run migrations. Use the project's direct/pooled connection string
  for the migration step only.
- **Rollback:** the migration is additive (no columns/tables dropped), so the schema itself
  needs no destructive rollback — reverting the application-code commits alone restores the old
  read/write behavior (dormant `Enrollment.email/firstName/lastName` columns are still present
  and still populated on old rows, just unread going forward until migration 2 removes them).
  Rolling back the **data** changes (the `enrolled` status flip and the `Student` backfill) is
  not built — there is no down-migration; if a rollback of the data itself is ever needed, take
  it from the pre-migration snapshot.
- **pgcrypto pre-flight:** the migration's `gen_random_uuid()` usage was confirmed available on
  `postgres:16-alpine` with no extension needed (scratch DB only) — the migration's `CREATE
  EXTENSION` line is left commented for prod portability. This was **not** re-confirmed against
  the actual production Postgres version/config; do that check (or uncomment the extension
  line) before deploying.

## Follow-ups
- **Migration 2 (deferred)** — drop the now-dormant `Enrollment` identity columns (`email`,
  `firstName`, `lastName`, `phone`, `dateOfBirth`, `address`, `landmark`, `guardianName`,
  `guardianPhone`, `guardianEmail`) and remove them from `schema.prisma`. Deliberately left for
  a separate follow-up PR, after this migration has been verified running in production —
  keeping the columns around a little longer costs nothing and gives a rollback path if
  something in the backfill turns out to be wrong.
- **Reconcile O4 vs. the future edit-student module (req #2).** Today, every re-enrollment
  silently overwrites the student's mutable fields (name, phone, DOB, address, guardian info)
  with whatever the new enrollment form submitted (O4). Once an admin-facing "edit student
  record" module exists, decide whether an admin's edit should survive a later re-enrollment
  overwrite, or whether re-enrollment should stop refreshing fields once a record has been
  admin-edited. Not resolved by this shipment.
- **Run one real Paystack test-mode charge** to close the live-verification gap described
  above — confirm the `student` relation resolves correctly at runtime and the receipt PDF
  renders the right name/email/phone from a real webhook event, not just types + review.
- ~~Minor, deferred at task review (non-blocking): no `enrollments.studentId` index; no-op
  `metadata` ternary in `lib/audit.ts`; stale paid-guard comment wording.~~ **Resolved in the
  final-fix-wave** (2026-08-31) — see the "Final-review fix wave" subsection under How, and the
  corresponding Verification entry above.
- **Unrelated, pre-existing, not fixed by this shipment:** real email delivery is still
  blocked on a placeholder `RESEND_API_KEY` (see `docs/sop/enrollment-emails.md`).
