# SOP — Assessment-first admission + location/offering model (Streams 2+3)

## What shipped
Paying the fee now buys an **assessment**, not enrolment. Locations, course offerings (course ×
location × format) and per-class rates are admin-editable data; a student picks a location and sees
only what it offers. Every student moves through `pending → assessment_paid → assessment_scheduled →
assessed → plan_agreed → enrolled` (`cancelled` from any non-terminal state). Branch
`feature/assessment-first-admission`, PR against `banafix` (see the PR for the final head SHA).
Spec: `docs/superpowers/specs/2026-11-03-assessment-first-admission-design.md`; ledger/plan:
`docs/superpowers/plans/2026-11-03-streams-2-3-assessment-first.md`.

| Commit | What |
|---|---|
| `4fe97fc` | Schema + staged data-preserving migration + seed + migration verifier |
| `14eb8c6` | Status guard, atomic webhook settle, admin assessment/plan/confirm/cancel routes, tuition → enrolled |
| `7845c08` | Admin: locations, offerings, materials, enrollment pipeline UI, walk-in |
| `713a3b2` | Public: location-first browse, per-class rates, assessment wizard, "assessment fee" copy |
| `e7160eb` | `GET /api/enrollments` and `/[id]` now admin-only |
| `684e58a` | Opus review fixes (below) |
| (docs) | this SOP, checklist, blueprint, walk-in SOP |

## Why
John runs Banafix as a music academy: a student applies, pays a non-refundable assessment fee, is
assessed (often at home), and only then is placed on a course, format, schedule and per-class price.
The app treated paying the fee as being enrolled (D1) and priced a course as one lump per delivery
mode in one location. Both were wrong. D6 supersedes D1; D7–D9 and D11 are in the spec.

## How (key decisions)
- **One guard for status** (`lib/enrollment-status.ts`): an allowed-transition table, unit-tested.
  Every write goes through `transitionEnrollment` (`lib/enrollment-transition.ts`), a compare-and-set
  `updateMany where {id, status: from}`, so webhook retry + admin click cannot both win.
- **One money path** (`lib/assessment-payment.ts: settleAssessmentFee`), used by the Paystack webhook
  and the manual verify route. One transaction: claim the `ApplicationPayment` (`status != completed`;
  count 0 ⇒ replay, stop) then `pending → assessment_paid` + `applicationPaid`. **No seat decrement.**
  If the enrollment is not `pending` (legacy `enrolled`, or cancelled while the student was paying) the
  money fact is recorded, status is never moved backwards, and an `enrollment.fee_paid_unexpected_state`
  audit row is written (a cancelled one sends no "you're in" receipt).
- **Fixed on the way (B12):** the old webhook marked the payment `completed` first and then swallowed
  any error, so a failure in the second write left the enrollment `pending` while Paystack never
  retried. Now it is one transaction and the handler rethrows (500 ⇒ Paystack retries). A second money
  path, the unauthenticated `POST /api/enrollments/[id]` manual verify, still wrote the retired
  `application_paid` status and decremented seats; it now calls `settleAssessmentFee`.
- **Fee from data (D11):** `Location.assessmentFee` via `getAssessmentFee`; `lib/application-fee.ts`
  deleted. `applicationFeeAmount` on the enrollment is the snapshot at application time.
- **Plan = snapshot:** `buildPlanSnapshot` validates duration/classes-per-week/planned classes against
  the offering's rates and writes `ratePerClass` to the enrollment. Later `OfferingRate` edits never
  move an agreed plan. Editing a plan while `plan_agreed` re-snapshots the *current* rate deliberately
  (audited, with the previous values).
- **`enrolled`** is reached by recording tuition on a `plan_agreed` enrollment (compare-and-set) or by
  the audited **Confirm enrolment** action. Stream 5 may tighten this.
- **Offerable (B6):** offering active ∧ location active ∧ ≥1 `OfferingRate`. Only offerable offerings
  appear publicly or accept applications. A course with none shows "Enrolment opening soon", never a
  price. Legacy `Course.pricing`/`availableModes`/`location` are not read by any public code.

### Builder decisions (spec left these to the builder)
| # | Decision |
|---|---|
| B1 | `Location.slug` added; chooser persists as `?location=<slug>` |
| B2 | `Assessment` uses `preferredDate` + `preferredTimeBand` (morning/afternoon/evening/flexible) |
| B3 | `Assessment.address`/`landmark` hold the home-visit location (resolves "address discarded" for assessments) |
| B4 | Public enrol creates the `requested` Assessment with the pending Enrollment (cascade-deleted with a stale pending) |
| B5 | One move beyond the spec's table: `assessed → assessment_scheduled` (re-assessment = new Assessment row) |
| B6 | "Offerable" definition above |
| B7 | Walk-in: `locationId` + `courseId` required, `offeringId` optional (admin can register before rates exist) |
| B8 | Public `POST /api/enrollments` requires `offeringId`; the legacy `selectedMode` body is rejected |
| B9 | Duplicate guard blocks any non-`pending`/non-`cancelled` enrollment for the course; stale `pending` still replaced |
| B10 | `PAYSTACK_BASE_URL` env override (default unchanged) so the local mock can exercise the real code |
| B11 | Seat enforcement removed everywhere; admin seat inputs remain with a "no longer enforced" note |
| B13 | Deprecated NOT NULL `Course` columns got DB defaults so a course can be created without them |
| B14 | A re-applying student's stale `pending` enrollment is **cancelled, not deleted** (deleting cascaded its payment away, losing an in-flight bank-transfer charge) |
| B15 | Tuition is accepted only on `plan_agreed`/`enrolled`; payment + `plan_agreed → enrolled` are one transaction; re-sent receipts use the same plan-first expected total |
| — | Offering DELETE and Location DELETE return 409 when referenced (deactivate instead); also `GET /api/enrollments` + `/[id]` made admin-only (D5 partly closed) |

## What's involved
- **Schema/migration:** `prisma/schema.prisma`; `prisma/migrations/20261103150000_assessment_first_admission/migration.sql`
  (Part 1 DDL from `prisma migrate diff`, Part 2 data). New: `Location`, `CourseOffering`, `OfferingRate`,
  `Material`, `Assessment`; `Enrollment` += `locationId, offeringId, durationMins, classesPerWeek, plannedClasses, ratePerClass`.
- **Logic:** `lib/enrollment-status.ts`, `lib/enrollment-transition.ts`, `lib/assessment-payment.ts`,
  `lib/assessment-fee.ts`, `lib/offering-rates.ts`, `lib/offerings.ts`, `lib/assessment-vocab.ts`, `lib/admin-validation.ts`.
- **Webhook/payments:** `app/api/webhooks/paystack/route.ts`, `app/api/enrollments/[id]/route.ts`,
  `…/admin/enrollments/[id]/{mark-paid,tuition}/route.ts`.
- **Admin API (all `withAuth`, all audited):** `locations`, `courses/[id]/offerings` (+`[offeringId]`, `bulk-rate`),
  `courses/[id]/materials`, `enrollments/[id]` GET, `…/assessment` POST schedule / PATCH result, `…/plan`, `…/confirm`, `…/cancel`.
  Audit actions: `location.*`, `offering.*`, `offering.bulk_rate`, `material.*`, `assessment.schedule|reschedule|result|edit_result|…record_only`,
  `plan.agree|edit`, `enrollment.confirm|cancel|enrolled_by_tuition|assessment_paid|fee_paid_unexpected_state`.
- **Admin UI:** `/admin/locations`; course edit Offerings + Materials tabs (`components/admin/{offerings,materials}-tab.tsx`);
  `/admin/enrollments` split into `components/admin/enrollments/*`; walk-in `components/admin/student-registration-modal.tsx`.
- **Public:** `/courses`, `/courses/[id]`, `/enroll` wizard (`components/site/enroll/step-assessment.tsx`),
  `components/site/location-chooser.tsx`, `GET /api/locations`, changed `/api/courses*`, `/api/instructors`.
- **Copy:** "application fee" → "assessment fee" in UI, emails, receipts (`lib/email.ts`, `lib/receipt.ts`). DB/column/function names unchanged.

## Verification (what actually ran)
| Check | Result |
|---|---|
| `scripts/verify-migration.sh` — ephemeral Postgres, legacy fixture, migrate up to previous then apply new | 🟢 33/33: no row loss in 6 tables, statuses unchanged (legacy `application_paid` → `enrolled`), 12 locations with correct fee tiers/kinds, **unique slugs** (colliding and all-non-ASCII names), 8 offerings all inactive with 0 rates, orphan mode skipped with notice, case-variant mode matched, padded `' ONDO '` → one Ondo, enrollment backfill (empty-location row stays NULL), plan fields null, new Course can omit deprecated columns, **no schema drift** |
| `npm test` (Vitest) | 🟢 68 tests: guard (every edge), CAS helper, rate/plan snapshot, fee lookup, offerable predicate, admin validators |
| `scripts/test-webhook.mjs` with `WEBHOOK_E2E=1` (real route, ephemeral DB, local Paystack mock) | 🟢 20 checks: assessment_paid, no seat change, one audit row; replay; 3 concurrent deliveries ⇒ one transition; late payment on cancelled / legacy-enrolled ⇒ no status change, audit note; charged-amount mismatch ⇒ not settled + audit; unknown reference ⇒ audit; `charge.failed` never moves a progressed row nor overwrites a completed payment |
| `npx tsc --noEmit`, `npx next build` | 🟢 clean |
| Admin flow in browser (1280px, ephemeral DB): walk-in → mark paid → schedule → result → edit result → plan (₦4,000 × 8 = ₦32,000) → confirm; cancel; legacy row opens read-only | 🟢 audit rows for each step confirmed in DB |
| Public flow in browser: `/courses` all/Lagos/Online/empty, course page, wizard end to end to the mock checkout at 1280px; wizard steps 1–3 and `/courses` at 375px, no horizontal overflow | 🟢; fee follows `Location.assessmentFee` (changed in DB, re-submitted); deactivated offering vanishes and POST ⇒ 400; course with no offerings shows "Enrolment opening soon" with no price |
| **Real Paystack test-mode charge** | ⚠️ **NOT DONE** — needs John's keys. The mock proves our handling of Paystack's responses, not Paystack itself |
| Stage filter exercised in the browser, admin pages at 375px, walk-in "schedule now" input via the UI | ⚠️ not done (schedule-now proven through the API) |

## Operate / roll back — READ BEFORE DEPLOYING
1. **Snapshot production first.** The deploy runs `prisma migrate deploy` from `postinstall`.
2. **Use a direct DB URL** (not the Accelerate proxy) for that migration step; `migrate deploy` cannot run through Accelerate.
3. **Every migrated offering is INACTIVE with NO rates** (legacy `pricing` was per mode, not per class).
   After deploy **every course shows "Enrolment opening soon" and cannot be applied to** until someone
   enters per-class rates in `/admin` (course edit → Offerings → add 45/60 min rates → activate; the
   bulk "Set rate" helper speeds it up). This is intentional (spec anti-goal: never show a lump price as "per class").
4. Locations are seeded from the former hardcoded list with the old fee tiers (Lagos/Abuja/Online ₦5,000,
   Diaspora ₦8,000, others ₦2,000; Online + Diaspora are ONLINE-kind). Edit in `/admin/locations`.
5. Legacy `enrolled`/`pending` rows keep their values; their plan fields stay null; legacy balance still uses
   `Course.pricing[selectedMode]` until Stream 5.
6. **Roll back:** the migration is additive (no column/row dropped, old `Course` columns intact), so a code-only
   revert is safe and the old code still runs on the new schema; full rollback = restore the snapshot.
   The new tables can simply be left in place.
7. Local verification recipe: `scripts/dev/ephemeral-pg.sh reset` (port 5466), `npx prisma migrate deploy`,
   `npx tsx prisma/seed.ts`, `node scripts/mock-paystack.mjs`, start the app with `PAYSTACK_BASE_URL=http://127.0.0.1:4010`,
   then `WEBHOOK_E2E=1 node scripts/test-webhook.mjs`. **Never `npm install` without `--ignore-scripts` here**
   (`postinstall` migrates whatever `DATABASE_URL` points at; `.env` is production).

## Policy text that now contradicts the flow (NOT edited — John must review)
`components/site/enroll/policy-dialog.tsx` and `components/site/policies/policies.ts` were left untouched.
Full list (20 items) in the shared notes `policy-contradictions.md`. Headlines: the refund schedule
(100%/75%/50% refunds) and "full refund within 14 days… via your student dashboard" contradict a
non-refundable assessment fee and the absence of any dashboard; PayPal and instalment claims have no
implementation; seat/"place" language is obsolete; "enrollment" is used for what is now an application.

## Follow-ups
- Real Paystack test-mode charge (John's keys) to close the live-webhook gap.
- **Open business rule (theirs):** is the assessment fee charged once per student or per course application?
  Built as once per application (today's behaviour).
- A cash fee recorded while a Paystack charge is still in flight produces a double fee; the webhook audits `enrollment.fee_paid_unexpected_state` but cannot refund. Admin decision needed per case.
- `GET /api/receipts/application-fee/[enrollmentId]` is still unauthenticated (pre-existing).
- Admin courses list still shows a "Seats Utilization" stat computed from `seatsLeft`, which nothing updates now (D9); remove it with the deprecated-column drop.
- Walk-in picker lists all published courses at a location, not only those with an offering there (offering is optional by B7).
- Admin enrollments table still offers "Record tuition" on rows the server now refuses (pre-plan): the server error string is shown; tighten the button with Stream 5.
- `Course` Basic tab on the edit page still has a legacy `location` select writing the deprecated column.
- `lib/locations.ts` is still imported by the course edit form and a dead component; remove with the
  deprecated-column drop PR (Migration 2: drop deprecated `Course` columns + dormant `Enrollment` identity columns).
- Student receipt email links to `/enroll/status/<id>`, which has no page (pre-existing).
- Parent child-picker (`/api/admin/students`) lists only `enrolled` students; consider including assessed students.
- Stream 4 (scheduling), 5 (per-class invoicing from `plannedClasses × ratePerClass` + `Material`), 7 (outbox triggers on these transitions) build on this.

## Review (Opus, one pass at the end)
One Opus pass over the webhook/settle path, migration, plan snapshot/tuition, public + walk-in POST and authorization. Fixed in `684e58a` (+ `e7160eb` from the automated security review):

| Finding | Severity | Resolution |
|---|---|---|
| Migration: two names slugifying identically (or with no ASCII) would violate `locations_slug_key`, fail `migrate deploy` in `postinstall` and wedge later deploys (P3009) | blocker | numbered slug suffixes, empty ⇒ `location`; verifier cases added. **Still run `select slug … having count>1`-style sanity on the prod snapshot** |
| Legacy `application_paid` rows stranded outside the guard | should-fix | mapped to `enrolled` in the migration |
| Deleting a stale `pending` cascaded its payment: an in-flight transfer settled with no record | should-fix (money) | cancel instead of delete, and only after the replacement payment is initialised (B14); unknown reference now audited |
| Charged amount/currency never compared | should-fix | `chargeMatches` before settle; mismatch audited, not settled |
| Tuition on any paid row (pre-plan receipts with a meaningless balance); payment and admit not atomic | should-fix | status restricted, one transaction (B15) |
| Re-sent receipts ignored the plan snapshot | should-fix | shared `expectedTuitionTotal` |
| Unauthenticated manual-verify POST settled with no emails/audit | note | deleted |
| `charge.failed` could overwrite a completed payment | note | guarded + E2E case |
| `offerable` ignored inactive delivery modes | note | added |
| Cash mark-paid during an in-flight Paystack charge ⇒ double fee | note | audited only; follow-up |
Clean per the reviewer: retry semantics after the commit, compare-and-set on every status move, snapshot immutability, `withAuth` on every new admin route.
