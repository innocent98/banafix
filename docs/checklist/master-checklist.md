# Banafix — Master Build Checklist

Single source of truth for what's done, in progress, and ahead. An item is checked **only when
built and verified**. See [`docs/architecture/banafix-blueprint.md`](../architecture/banafix-blueprint.md) for the full map.

**Snapshot (2026-09-01):** Modules — ✅ 10 done · all four requested modules + foundation + the public UI redesign shipped (email delivery pending a real `RESEND_API_KEY`)

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

## ✅ Birthday automation  *(req #4, branch `birthday-automation`)*
- [x] `vercel.json` cron (`0 5 * * *` = 06:00 Lagos) + `GET /api/cron/birthdays` guarded by `CRON_SECRET`
- [x] Birthday email templates (student + parent variants) — `sendBirthdayEmail` in `lib/email.ts`
- [x] Today-in-Africa/Lagos match for students (full DOB, UTC month/day) + parents (stored month+day) — `lib/birthdays.ts`
- [x] Dedup via `BirthdayEmailLog` unique `(recipientType, recipientId, year)`, logged only after a successful send (failures retry); additive migration
- [x] `birthday.run` audit per run
- [x] Verify: recipient-match + dedup proven on ephemeral Postgres (2 candidates → 1 after a log row); `tsc` 0 + build
- [~] **Email delivery not verified** — blocked on placeholder `RESEND_API_KEY` (send path built + logic-verified only). Set `CRON_SECRET` + real Resend key in Vercel to go live.

## ✅ Admin audit log  *(NB)*
- [x] `AuditLog` model + migration (`cc2e733`)
- [x] `logAdminAction()` helper (`lib/audit.ts`) — best-effort, never throws (`af81007`)
- [x] Wired into admin mutations that exist today: webhook enrollment-paid (`action: 'enrollment.enrolled'`, `8357dff`) and tuition recording (`action: 'tuition.record'`, `3dd52b4`)
- [x] Recorded (not exposed in UI yet)
- [x] Verify: helper round-trip (write + read back) passed against scratch DB (`af81007`)
- [~] Verify: tuition-record audit row confirmed via `tsc`/build + review, not a live run; webhook's `enrollment.enrolled` audit row not exercised by a live Paystack charge (see Foundation module below) — student-edit / parent-CRUD log rows not yet applicable, those modules aren't built

---

## ✅ Public UI redesign — `Banafix Redesign.dc.html` handoff  *(branch `ui-redesign`)*
Full-parity rebuild of the public site against the Claude Design handoff. See
[`docs/sop/ui-redesign.md`](../sop/ui-redesign.md) and the implementation contract in
[`docs/superpowers/specs/2026-09-01-ui-redesign-contract.md`](../superpowers/specs/2026-09-01-ui-redesign-contract.md).

### Foundation
- [x] `bfx-*` design-token layer appended to `app/globals.css` — additive, so shadcn tokens and `/admin` are untouched
- [x] Instrument Serif + Plus Jakarta Sans added; Inter/Sora retained for `/admin`
- [x] Route group `app/(site)/` — 11 public routes moved via `git mv`, one layout owns cream ground + sticky 76px header + ink footer
- [x] Shared primitives (`PillLink`/`PillButton`/`PillAnchor`, `Eyebrow`, `Display`, `MetaChip`, `LevelBadge`, `CheckPip`), `MediaSlot`, `Wordmark`, `lib/site.ts`
- [x] `app/(site)/error.tsx` — a DB blip now says so instead of rendering "no courses" as fact
- [x] `prefers-reduced-motion` guard on the entrance animation

### Screens (full parity)
- [x] Home — hero, trusted-by, featured courses (**real data**), why-Banafix, how-you-learn (**real per-mode prices**), testimonials, CTA band
- [x] Courses list — sticky level chips at `top-[76px]`, `?instrument=` deep link, two designed empty states
- [x] Course detail — ink hero, tabs, sticky aside at `top-[104px]` with a working format picker
- [x] Tutors — renamed from `/instructors`, permanent redirects in `next.config.ts`
- [x] Enrol — 3-step wizard, **both** consent checkboxes preserved, summary aside
- [x] Enrol success — all five states kept, restyled
- [x] Contact — channels, working form, FAQ accordion, `?subject=trial` preselect

### Secondary pages restyled
- [x] `/faqs` (category counts now derived, filtering restored), `/testimonials`, `/policies` (real `#privacy` / `#terms` anchors), `/admissions`, `/events`, `/dashboard`, `/not-found`

### Correctness fixed along the way
- [x] **Selected delivery mode is no longer discarded** — the course page emits `?mode=`, the wizard validates and submits it. Previously always fell back to `modes[0]`, so the stored mode and billed tuition could be wrong
- [x] **10-course cap removed** — `/courses` called an API defaulting to `limit=10` with no params
- [x] Deleted `app/instructors/[id]` — a hardcoded mock that ignored its route param
- [x] `/faqs` hardcoded category counts (14/3/2…) vs 6 real FAQs
- [x] `/policies#privacy` and `#terms` were dead footer links
- [x] `MediaSlot` image now unmounts on error so the designed empty state shows through

### New endpoint
- [x] `POST /api/contact` — honeypot + per-IP throttle + subject allow-list; returns 502 rather than a fake success
- [~] **Live delivery unproven** — same pre-existing placeholder `RESEND_API_KEY` blocker as every other send path

### Verified
- [x] `npx tsc --noEmit` clean · `npx next build` passes (36/36 pages)
- [x] All 11 public routes 200, `/nope` 404, `/instructors` 308 → `/tutors`
- [x] Enrol POST contract re-proven field-by-field **by execution** against `app/api/enrollments/route.ts`
- [x] `POST /api/contact` exercised live across 7 cases
- [ ] **Visual QA in a browser at 375px / 1280px — not done, the one real gap**

### Needs a product decision (fabricated content removed, not restyled)
- [ ] **`/dashboard`** — was 100% fabricated with zero auth and publicly reachable: a named student + email, invented course progress, and **a payment history showing ₦25,000 and ₦18,000 as paid**. Removed; the route now states there is no student login. Everything removed is listed in the file header. → build a real student session, or drop the route
- [ ] **`/events`** — six hardcoded events, all with dates already passed, invented seat counts, non-functional Register button. `EVENTS` is now an empty array with the removed entries in a comment; the designed grid renders the moment it is non-empty → supply real events, or drop the route
- [ ] **`/admissions` tuition tiers** (₦25,000 / ₦15,000 / ₦12,000 per month) contradict real `course.pricing`. Reframed as indicative with a pointer to `/courses` → probably delete them
- [ ] **`/testimonials` entries 2 and 4** read as video captions ("Watch my journey") with no video → rewrite or supply video
- [ ] Policy pages still stamped "Last updated: December 15, 2024"

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

## Deferred follow-ups — UI redesign
- [ ] Dead-code sweep: `components/enrollment/*`, `components/sections/*`, `components/instructors/{instructor-card,instructor-filters}.tsx` are all unreferenced since the redesign. Left in place so the redesign diff stays a redesign
- [ ] Move `sendContactEnquiry()` into `lib/email.ts`; note the contact route HTML-escapes interpolated fields and `lib/email.ts` does not — a trap for the next public-input template
- [ ] Repair ESLint: `Could not find plugin "@typescript-eslint"` repo-wide. The packages **are** installed; it is an eslint 9 vs legacy `.eslintrc.json` resolution failure. No lint gate exists today
- [ ] `app/(site)/enroll/loading.tsx` still returns `null` (low impact — the page carries its own Suspense fallback)
