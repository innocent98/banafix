# Banafix — Master Build Checklist

Single source of truth for what's done, in progress, and ahead. An item is checked **only when
built and verified**. See [`docs/architecture/banafix-blueprint.md`](../architecture/banafix-blueprint.md) for the full map.

**Snapshot (2026-11-03):** Modules — ✅ 12 done (four requested modules + foundation + instructor roster + public UI redesign + admin UX/walk-in registration; email delivery pending a real `RESEND_API_KEY`) · 🆕 8 streams from the 2026-11-03 client meeting — **Streams 2+3 and 5 built (PRs open, unmerged)**, others planned

## 🆕 Client meeting 2026-11-03 — assessment-first academy platform  *(Streams 2+3 built, see below; others planned)*
Source: meeting summary (John walkthrough). Design: [`docs/superpowers/specs/2026-11-03-assessment-first-admission-design.md`](../superpowers/specs/2026-11-03-assessment-first-admission-design.md) (Streams 2+3). **Principle (D11): every price, fee, format, duration, material and availability is admin-editable data. John fills it in via `/admin`; none of it blocks code.** Order: 0+1 now → 2 → 3 → 4/5 → 6/7 → 8.

### Stream 0 — Unblock operations (config, not code)
- [ ] Real `RESEND_API_KEY` + verify `banafix.com` sender domain (blocks every email)
- [ ] `CRON_SECRET` in Vercel; direct DB URL + prod snapshot, then deploy pending migrations
- [ ] John's Paystack account + keys → one real test-mode charge to close the live-webhook gap
- [ ] Official contact + feedback email addresses and forwarding

### Stream 1 — Quick wins (independent)
- [ ] Copy: per-class pricing / 12 modules wording; remove monthly tiers on `/admissions`, "Twelve-week programmes", `/courses` heading
- [ ] `CurriculumModule.weeks` optional (admin forms, API, public render); drop `parseWeeks` caption
- [ ] Add Vitest for pure logic (no test runner exists today)
- [x] ~~Testimonials / trusted-by / events data-ready~~ → moved into Stream 8 (admin-managed content, D11)

### Stream 2 — Location + offering model  *(foundation for 3–5)*  ✅ built 2026-11-03, branch `feature/assessment-first-admission` (PR open, not merged)
- [x] `Location` entity (physical/online, assessment fee, active) + admin CRUD (`/admin/locations`); seeded from the old `lib/locations.ts` + `lib/application-fee.ts` tiers by the migration and `prisma/seed.ts`
- [x] `CourseOffering` (course × location × format) + `OfferingRate` (per-class price per duration) + classes-per-week options; admin Offerings matrix with bulk "set rate"
- [x] `Material` (course-level books/materials: name, price, required) + admin Materials tab
- [x] Staged migration: legacy courses → offerings **inactive**, no rates (verified: `scripts/verify-migration.sh`, 33 assertions on an ephemeral Postgres with a legacy fixture)
- [x] Public flow: location → course → format → per-class rate (`?location=<slug>`); "Enrolment opening soon" when nothing is offerable; admin course form Offerings + Materials tabs
- [x] Retire seat enforcement (D9) — webhook, public POST, wizard no longer count seats
- [~] Browser QA: 1280px admin + public and 375px public (`/courses`, wizard steps 1–3) done; admin at 375px and the stage filter exercised in the UI **not done**
- [ ] **Deploy gate:** snapshot prod, direct DB URL, then enter per-class rates in `/admin` (every migrated offering is inactive until then)

### Stream 3 — Assessment-first admission  *(supersedes D1)*  ✅ built 2026-11-03 (same branch)
- [x] Status machine `pending → assessment_paid → assessment_scheduled → assessed → plan_agreed → enrolled` (+ `cancelled`, + re-assessment move); one guard + compare-and-set helper, unit-tested; legacy `enrolled`/`pending` grandfathered
- [x] Webhook / cash mark-paid / walk-in → `assessment_paid`, no seat decrement; payment claim + status move in one transaction; replay/concurrent/cancelled/legacy cases proven against a **local Paystack mock**
- [~] **Real Paystack test-mode charge NOT DONE** (needs John's keys) — the mock proves our handling, not Paystack
- [x] `Assessment` entity: arrangement, preferred date + time band, scheduled slot, assessor, result (level, notes, recommended offering), editable + audited
- [x] Plan step: offering, duration, classes/week, planned classes, rate snapshot (later rate edits never move it); tuition on `plan_agreed` or audited "Confirm enrolment" → `enrolled`
- [x] Rename "application fee" → "assessment fee" in UI, emails, receipts (copy only; DB names stay)
- [x] Assessment fee charged **once per student** (decided 2026-11-03): covered applications start at `assessment_paid`, no Paystack; duplicate/superseded payments flagged `duplicate` for a manual refund (admin Refund needed badge/filter, audited Mark refunded); cash supersedes Paystack; reuse latest assessment; real-Postgres concurrency test
- [~] Policy text rewritten (`policy-dialog.tsx`, `policies.ts`, last updated Nov 3, 2026) with no invented numbers: **John must review** `docs/john-review/policy-changes.md` (13 decisions)
- [x] Admin pipeline view (stage filters, schedule + result + plan forms, confirm/cancel); walk-in per spec
- SOP: [`docs/sop/assessment-first-admission.md`](../sop/assessment-first-admission.md) · Plan/ledger: `docs/superpowers/plans/2026-11-03-streams-2-3-assessment-first.md`

### Stream 4 — Scheduling
- [ ] Structured instructor availability (weekly slots per location/online) + `InstructorCourse` many-to-many
- [ ] `ClassSession` (enrollment, instructor, start, duration, status) + transactional conflict prevention
- [ ] Student preferences: days, time bands, frequency; admin timetable + assignment

### Stream 5 — Per-class tuition  ✅ built 2026-11-03, branch `feature/per-class-tuition` (PR open against `feature/assessment-first-admission`, unmerged)
- [x] Charge ledger `TuitionCharge` (CLASSES + MATERIAL, price snapshot, voided never deleted); created with the plan; top-ups at today's rate; derived balance + `classesCovered` (pure, unit-tested; S4 can reuse)
- [x] Partial payments (balance = charges − counted payments; credit on overpayment; overpayment needs confirmation); legacy enrollments keep the old `Course.pricing` balance, isolated and tested
- [x] Manual recording kept (cash / bank transfer / POS / card / cheque / mobile money / other)
- [x] Online tuition: admin generates a Paystack link (default = outstanding), webhook `tuition` branch (replay, concurrent, amount/currency/metadata mismatch, unknown reference, late payment on cancelled), proven against the **local Paystack mock**
- [~] **Real Paystack test-mode charge for tuition NOT DONE** (needs John's keys)
- [x] Materials as charges (required auto-added at the plan step, optional picked); required/optional set in the Materials tab (S3)
- [x] Per-class receipts (PDF + email, student copy + admin copy, point-in-time); PDFs print `NGN` (helvetica has no ₦)
- [x] Admin: ledger modal on the enrollment screen, `/admin/payments` (payments + outstanding, filters, CSV)
- [~] Browser QA of the admin flow at 1280px: see the SOP verification table for what was and was not exercised
- [x] Independent-review round 2 (open links vs the cap, credit/refund-needed visible on `/admin/payments`, admin alert emails, `refund.processed` flagged, URL-less rows, honest outstanding scan); [x] PR #12's `chargeMatches` change (`requested_amount ?? amount`) merged (`878b425`) and re-tested on the mock (110 + 33 checks)
- [ ] **Deploy gate:** snapshot prod, direct DB URL, migrate `20261103180000_per_class_tuition` after `20261103150000_assessment_first_admission`
- [ ] John decides: **tuition refund policy** (not built); whether `plan_agreed → enrolled` should wait for the first class to be paid (built: any counted payment)
- SOP: [`docs/sop/per-class-tuition.md`](../sop/per-class-tuition.md) · Spec: `docs/superpowers/specs/2026-11-03-per-class-tuition-design.md` · Plan/ledger: `docs/superpowers/plans/2026-11-03-stream5-per-class-tuition.md` · API guide: [`docs/fe-integration-guide-per-class-tuition.md`](../fe-integration-guide-per-class-tuition.md)

### Stream 6 — Registration + parents
- [ ] Public form + walk-in modal capture parent, level, format, location, schedule, course; create/link `Parent`; multiple children

### Stream 7 — Communications
- [ ] Channel-agnostic outbox + templates + triggers (ack, payment, assessment scheduled, enrolment, new-month, birthdays incl. parents)
- [ ] Admin announcements; `Feedback` model with testimonial-consent flag
- [ ] WhatsApp/SMS provider plugged in later (John's choice; cost comparison to research)

### Stream 8 — Website content  *(admin-managed data, D11; John supplies real values)*
- [ ] Models + admin CRUD: `Testimonial` (name, text, optional video, publish-permission flag), `TrustedPartner` (name, logo), `SiteEvent` (title, date, location, registration link), `SiteStat` (label, value; real figures only)
- [ ] Public home / testimonials / events render from the DB; honest empty states, no invented content; remove hardcoded `testimonials.ts` / `events.ts` / trusted-by constants
- [ ] Remove "Lagos Music Academy" overreach; stats show only entered values
- [ ] Team-review readiness: noindex/preview guard decision (John wants staff to review before rollout)

### Wave plan (lead session)
- **Wave 1 (now, ≤3 sessions):** S1 quick wins · S2+3 assessment-first admission · S8 site content
- **Wave 2 (after S2 lands):** S4 scheduling · S5 per-class tuition · S7 communications (starts when S3's transitions exist as triggers)
- **Wave 3 (after S3):** S6 registration + parents
- Sub-sessions open PRs, never merge; merging waits for Adebayo's "merge #N"

### John's data entry (via admin, once Streams 2/4 ship — not code blockers)
- [ ] Locations + assessment fee per location · [ ] Offerings and per-class rates (incl. 45 vs 60 min) · [ ] Which courses need materials · [ ] Instructor availability · [ ] Team review of the site

## ✅ Admin UX polish + walk-in registration  *(branch `ui-redesign`, 2026-09-09)*
- [x] Fixed invisible input borders + off-toggle (root cause: `--input` was white) — global token fix in `app/globals.css`; larger/clearer `Switch`; taller `Input`; `DialogContent` scroll cap so popups don't cramp
- [x] Real footer social icons (lucide + inline X) replacing letters — `components/site/site-footer.tsx`
- [x] Walk-in student registration: `POST /api/admin/enrollments` (captures full info; optional cash fee) + `StudentRegistrationModal` + "Register Student" button
- [x] Mark application fee paid (cash) for existing pending enrollments: `POST /api/admin/enrollments/[id]/mark-paid` + row action; audited `enrollment.admin_create` / `application.cash_paid`
- [x] Filter enrollments by location (`course.location`) on `/admin/enrollments` + `location` added to list-GET select
- [x] Verify: `tsc` 0 + build
- [~] Visual + live authed-route confirmation pending on user side (points at prod DB)
- SOPs: `docs/sop/admin-ui-polish.md`, `docs/sop/walk-in-registration.md`

## ✅ Instructor roster  *(branch `instructor-roster`)*
- [x] Flip `Instructor` one-to-one → reusable one-to-many (`Course.instructorId` FK `onDelete:SetNull`; `Instructor.courses[]`); drop `instructors.courseId`
- [x] Data-preserving migration `20260902114015_instructor_roster` — backfill from old `courseId` + **dedup roster by normalized name** (keep highest-rated, repoint courses)
- [x] Roster CRUD: `GET/POST /api/admin/instructors`, `GET/PATCH/DELETE /api/admin/instructors/[id]`; audit `instructor.create|update|delete`; course-set reassignment in PATCH
- [x] `/admin/instructors` page + modal (course multi-select) + nav item
- [x] Rewired `PUT /api/admin/courses/[id]/instructor` (assign existing / update / create+assign / unassign); fixed public `/api/instructors` + dashboard count + seed
- [x] Verify: dup-name migration on ephemeral Postgres (3→2, courses repointed, no loss); `tsc` 0 + build
- [~] Live authed HTTP-route run not executed (types + build + migration scratch-test cover it)

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

### ✅ Round 2 corrections (2026-09-02)
- [x] "Free trial" removed sitewide (copy rewritten, not relabelled); CTA is `ENROL_LABEL` → `ENROL_HREF` (`/courses`); contact `?subject=` aliases updated
- [x] Em/en dashes removed from all public-site copy and the customer-facing email templates
- [x] Course images: `lib/course-photo.ts` instrument fallback (admin upload always wins). **Every photo verified by eye** — the id first earmarked for saxophone was a trumpet
- [x] Home "How you learn" now reads the `DeliveryMode` table: all **four** modes, was three invented ones missing `One-on-One`
- [x] Invented `MODE_NOTES` deleted; format rows show real mode name + real price only
- [x] Rental copy replaced verbatim, "support team" links to `/contact`
- [x] Per-course tab coverage verified live: tutor + FAQ tabs appear only on `sample-guitar-course`, matching the data
- [x] Merged `origin/banafix` (`63609a2` instructor roster); ported `/tutors` + `TutorCard` to the roster shape by hand
- [x] `npx tsc --noEmit` clean · `npx next build` 38/38 · 13 public routes 200

### ✅ Enrolment audit (by execution, not inspection)
- [x] **`dateOfBirth` was never collected** — every student enrolled through the site had a null birthday, so the birthday cron could never fire for them. Now collected and verified persisting
- [x] Expired / fully-booked / no-modes courses now blocked before step 1 (previously only refused at the Pay button, with a raw server string)
- [x] Email trim divergence, whitespace-only name gate, `aria-disabled` Continue button, 6px overflow at 375px, "Preferred day" mislabel
- [x] Server rejections mapped to actionable copy with the right control
- [x] Unsupported claims removed from the wizard, including the **VAT (7.5%) line** (nothing configures or charges VAT; it inflated the shown total by ₦1,500-2,600)
- [x] Full submission exercised end to end to Paystack checkout; all test rows deleted (2 students, 2 enrolments, 2 payments, verified 0 remaining)

### Needs a decision from round 2
- [ ] **Home Training address is discarded for returning students** — `app/api/enrollments/route.ts` upserts with `update: {}` and never writes `address`/`landmark` onto the `Enrollment`. Proven live: a hard client gate collects an address the tutor never receives
- [ ] **Policy dialog contradicts the code** — offers PayPal (no integration) and an instalment plan `installmentPlan` never actions. Left alone: it is text a student legally consents to
- [ ] **`billingAddress`/`City`/`State`** written to every `ApplicationPayment` as empty strings. Drop server-side or collect them
- [ ] **Dead code sweep** — `components/sections/*`, `components/enrollment/*`, `components/contact/faq-section.tsx`, `components/instructors/*` all unreferenced; three still contain "free trial" copy (0 importers, so nothing live)
- [ ] Confirm the removed aside claims stay removed ("Free makeup lesson each term", "End-of-term recital included") and whether `seatsLeft` should be public
- [ ] Six em dashes remain in **admin** UI, deliberately out of scope

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
- [x] **D1** — paying = enrollment (no gate); webhook sets `enrolled`; fee non-refundable — **⚠️ SUPERSEDED by D6 (2026-11-03)**
- [x] **D6** (2026-11-03) — paying the fee buys an *assessment*, not enrolment; admission follows assessment. Existing `enrolled` rows grandfathered. Fee stays non-refundable
- [x] **D7** — `CourseOffering` (course × location × format) replaces `Course.pricing/availableModes/location`
- [x] **D8** — price is per class, stored per duration (`OfferingRate`, 45/60 min)
- [x] **D9** — seat counting retired (columns kept, not enforced)
- [x] **D10** — messaging behind a channel interface; email now, WhatsApp/SMS later
- [x] **D11** — all commercial config (fees, offerings, rates, materials, availability) is admin-editable data, never hardcoded
- [x] **D2** — introduce `Student` person entity (unique email)
- [x] **D4** — Vercel Cron for birthdays
- [x] **D3** — expected-total-tuition = `course.pricing[mode]` — **⚠️ SUPERSEDED by D12 (Stream 5):** now legacy rows only
- [x] **D12** — per-class tuition is a charge ledger; paid status derived, never stored per class
- [ ] **D5** — harden public enrollment read endpoints behind admin auth

## Backlog / upcoming
- [ ] Student dashboard + online tuition payment — *explicitly out of scope for now*
- [ ] Track "actually started lessons" — possible future flag (not a status)

## Deferred follow-ups — Streams 2+3
- [ ] Real Paystack test-mode charge (John's keys) — closes the live-webhook gap for `assessment_paid`
- [ ] John reviews and answers `docs/john-review/policy-changes.md` (tuition refunds, cancellation, missed assessment, late arrival, rental, materials, sibling discounts, when tuition is due, instalments, refund payout, removal refunds, out-of-area home visits, session recordings)
- [ ] Duplicate assessment-fee payments are refunded by hand in Paystack (then Mark refunded in admin); pre-deploy: count students with `applicationPaid` but no completed fee payment (see SOP)
- [ ] Wave 2 tuition must route the Paystack webhook by reference prefix (`app_fee_`) before the ApplicationPayment lookup
- [ ] `GET /api/receipts/application-fee/[enrollmentId]` still unauthenticated; D5 otherwise partly closed
- [ ] Drop deprecated `Course` columns + dormant `Enrollment` identity columns; remove `lib/locations.ts`, stale "Seats Utilization" stat, Basic-tab `location` select
- [ ] Parent child-picker lists only `enrolled` students; admin "Record tuition" button shows on rows the server refuses

- [ ] Real Paystack test charge with "pass charges to customer" ON and OFF: confirms `requested_amount` semantics used by the fee amount check (independent review H1; fixed from the spec, proven on the mock only)
- [ ] Same-day runbook after deploy: enter per-class rates in `/admin` (online intake is closed until then): `docs/sop/assessment-first-admission.md`
- [ ] Review follow-ups: server-side "refund needed" count/filter (L8); cash mark-paid for an already-covered student tracks no cash (L7); explicit BEGIN/COMMIT for migrations in a later migration (L4)
- [x] Independent review of PR #12 fixed: H1 amount check, M1 two-tab fee, M3 covered path now pending + admin confirm, L1/L2/L6/L9/L10

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
