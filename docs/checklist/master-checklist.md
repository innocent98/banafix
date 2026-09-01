# Banafix — Master Build Checklist

Single source of truth for what's done, in progress, and ahead. An item is checked **only when
built and verified**. See [`docs/architecture/banafix-blueprint.md`](../architecture/banafix-blueprint.md) for the full map.

**Snapshot (2026-09-01):** Modules — ✅ 8 done · 🔵 1 planned (req #4 birthdays)

Legend: `[x]` done+verified · `[~]` shipped-but-unproven (note why) · `[ ]` not started

---

## ✅ Enrollment & application-fee payment
- [x] Enrollment form + validation (`/enroll`, `POST /api/enrollments`)
- [x] Location-based application fee (`lib/application-fee.ts`)
- [x] Paystack init → redirect → `/enroll/success` verify
- [x] Duplicate-enrollment guard + stale-pending cleanup
- [x] Webhook `charge.success` → `status='enrolled'` + seat decrement (signature path 🟢 verified)

## ✅ Enrollment emails
- [x] "Application received" ack on submit
- [x] Paid receipt + PDF to student (webhook)
- [x] Admin "new paid enrollment" notice (webhook)
- [x] Local test harnesses (`test:webhook` 🟢 passing, `test:emails` ready)
- [~] **Real delivery** — blocked: `RESEND_API_KEY` is a placeholder; verify `banafix.com` sender domain in Resend

## ✅ Admin — courses & enrollments (view)
- [x] Admin auth (JWT) + course CRUD, curriculum, FAQs, instructor, image upload (Vercel Blob)
- [x] Enrollments list/detail + status badges + tuition recording
- [x] Tuition payment → student receipt + PDF

---

## ✅ Tuition payments — receipt & balance  *(req #1, branch `tuition-receipts`)*
- [x] Student receipt on record (already shipped)
- [x] Admin copy of every tuition receipt → `ADMIN_EMAIL`/`SUPPORT_EMAIL` (separate best-effort send)
- [x] Full vs partial marker per payment (`completed` | `partial`) — admin selector
- [x] Balance-remaining calc + display on receipt (PDF + email), admin modal preview, admin table — `course.pricing[mode]`
- [x] Fix: resend/download route rejected non-`completed` payments (blocked partial receipts) — now allows partial
- [x] Verify: balance arithmetic + edge cases (partial/full/overpay/missing-price) via logic harness; `tsc` 0 + build
- [~] **Live email delivery** of student receipt + admin copy — blocked on placeholder `RESEND_API_KEY` (same pre-existing blocker)

## ✅ Edit student record  *(req #2, branch `student-edit`)*
- [x] `PATCH /api/admin/students/[id]` (JWT) + `GET` to prefill — editable fields, **email immutable** (edit the person, not the enrollment)
- [x] Admin edit UI (names, phone, DOB, address, landmark, guardian) — modal on the enrollments page
- [x] Writes `AuditLog` (`student.update`, changedFields) on each edit
- [x] O4 reconciled: enrollment-create no longer overwrites an existing student's fields on re-enroll (edit UI is source of truth)
- [x] Verify: email-change rejected, blank-name rejected, DOB parsed, blank→null, change-tracking — logic harness; `tsc` 0 + build
- [~] Full live DB-integration run not executed (types + build + harness cover it)

## ✅ Parent records + child mapping  *(req #3, branch `parents-module`)*
- [x] `Parent` model (name, email @unique, phone, address, birthday month+day) + additive migration (`_ParentChildren` join)
- [x] Many-to-many parent ↔ children (Prisma implicit relation)
- [x] Admin UI: `/admin/parents` list + create/edit/delete modal with enrolled-student child picker (`GET /api/admin/students?q=`) + nav link
- [x] Routes: `GET/POST /api/admin/parents`, `GET/PATCH/DELETE /api/admin/parents/[id]`; audit `parent.create|update|delete`
- [x] Verify: one parent ↔ 2 children + reverse + unique-email + detach — round-trip on ephemeral Postgres; `tsc` 0 + build
- [~] Live authed HTTP-route run not executed (types + build + relation scratch-test cover it)

## 🔵 Birthday automation  *(req #4)*
- [ ] **D4 decided** (Vercel Cron recommended)
- [ ] `vercel.json` cron + `GET /api/cron/birthdays` guarded by `CRON_SECRET`
- [ ] Birthday email templates (student + parent) in `lib/email.ts`
- [ ] Today-in-Africa/Lagos match for students (full DOB) + parents (month+day)
- [ ] Dedup so nobody gets two emails
- [ ] Verify: seeded birthday → exactly one email per person on the day

## ✅ Admin audit log  *(NB)*
- [x] `AuditLog` model + migration (`cc2e733`)
- [x] `logAdminAction()` helper (`lib/audit.ts`) — best-effort, never throws (`af81007`)
- [x] Wired into admin mutations that exist today: webhook enrollment-paid (`action: 'enrollment.enrolled'`, `8357dff`) and tuition recording (`action: 'tuition.record'`, `3dd52b4`)
- [x] Recorded (not exposed in UI yet)
- [x] Verify: helper round-trip (write + read back) passed against scratch DB (`af81007`)
- [~] Verify: tuition-record audit row confirmed via `tsc`/build + review, not a live run; webhook's `enrollment.enrolled` audit row not exercised by a live Paystack charge (see Foundation module below) — student-edit / parent-CRUD log rows not yet applicable, those modules aren't built

---

## ✅ Foundation — Student entity + enrolled status  *(D1 + D2)*
Everything below (parents, birthdays, edit) leans on this — built and verified first, as planned.
- [x] `Student` model (unique immutable lowercased email) + staged migration; `Enrollment.studentId` FK (`cc2e733`)
- [x] Backfill: dedupe existing enrollments into `Student` rows by `lower(email)`, most-recent-enrollment-wins (`cc2e733`)
- [x] Webhook sets `status='enrolled'` on paid; retire `application_paid` value + backfill existing rows (`cc2e733` migration + `8357dff` webhook)
- [x] Update badges/filters/duplicate-guard to the `enrolled` vocabulary (`3dd52b4`)
- [x] `AuditLog` model + `logAdminAction()` helper, wired into webhook + tuition recording (`cc2e733`, `af81007`, `8357dff`, `3dd52b4`)
- [x] Verify: new enrollment → one `Student` per lowercased email, mutable fields refresh on re-enroll (O4) (`9651c34`, scratch-DB verified)
- [x] Verify: existing rows migrated correctly — scratch-DB assertions (dedupe count, no orphaned enrollments, `application_paid` fully retired, zero row loss) all 6 passed (`cc2e733`, see `task-1-report.md`)
- [x] Verify: whole-repo `tsc --noEmit` (0 errors) and `npm run build` succeed after full read-site cutover (`3dd52b4`)
- [x] Final-fix-wave (2026-08-31): migration backfill/link normalization changed to `btrim(lower())` to match the app's `.trim().toLowerCase()` — closes a padded-email dedup gap; `@@index([studentId])` added to schema + migration; "Tuition Paid" admin badge restored (distinct from "Enrolled") without reintroducing `application_paid`; re-verified on a fresh scratch DB including a padded/mixed-case-email dedup case — see `docs/sop/student-entity-foundation.md`
- [ ] **Migration 2 — drop the now-dormant `Enrollment` identity columns** (`email`, `firstName`, `lastName`, `phone`, `dateOfBirth`, `address`, `landmark`, `guardianName`, `guardianPhone`, `guardianEmail`) and remove them from `schema.prisma` — **deliberately deferred** to a separate follow-up PR, after this migration is verified in production
- [~] **Live-webhook verification** — the `status='enrolled'` write, `AuditLog` row, and student-sourced receipt fields are verified via scratch-DB assertions + `tsc`/build + code review only. **Not exercised against a real Paystack test-mode charge** (the local harness's fabricated reference fails Paystack's own verify step before this code path runs). Run one real test-mode charge before production use to close this gap.

## Decisions log
- [x] **D1** — paying = enrollment (no gate); webhook sets `enrolled`; fee non-refundable
- [x] **D2** — introduce `Student` person entity (unique email)
- [x] **D4** — Vercel Cron for birthdays
- [x] **D3** — expected-total-tuition = `course.pricing[mode]` (decided; consumed by the future tuition module)
- [ ] **D5** — harden public enrollment read endpoints behind admin auth

## Backlog / upcoming
- [ ] Student dashboard + online tuition payment — *explicitly out of scope for now*
- [ ] Track "actually started lessons" — possible future flag (not a status)

## Deferred follow-ups
- [ ] Auto-send wiring parity review across all receipt types
- [ ] Confirm `FROM_EMAIL` domain verified in Resend before production
- [x] Add an index on `enrollments.studentId` (mirrors the existing `courseId` convention; minor, deferred at Task 1 review) — **done in final-fix-wave, 2026-08-31**
- [x] `lib/audit.ts` — simplify the no-op `metadata` ternary to `entry.metadata as any` (cosmetic, deferred at Task 2 review) — **done in final-fix-wave, 2026-08-31**
- [x] `app/api/enrollments/route.ts` — the paid-guard comment still says "paid/enrolled" but the code only checks `status: 'enrolled'`; fix the wording to match (deferred at Task 3 review) — **done in final-fix-wave, 2026-08-31**
- [ ] Reconcile **O4 refresh-on-reenroll** (student mutable fields overwrite silently on every re-enrollment) against the future **edit-student module (req #2)** — decide whether an admin edit should survive a later re-enrollment overwrite
- [ ] Run one real Paystack test-mode charge end-to-end to close the live-verification gap on the `enrolled`/audit/receipt webhook path (see Foundation module above)
