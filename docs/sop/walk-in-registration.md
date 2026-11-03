# SOP — Admin walk-in student registration + cash fee + location filter

> **Updated 2026-11-03 — superseded in part.** The behaviour below (course + mode picker, `application_paid`-style
> "fee paid = `enrolled`", `calculateApplicationFee`, location filter on `course.location`) describes the original
> 2026 shipment and is **no longer how the code works**. The current walk-in is described in
> "Updated 2026-11-03: assessment-first walk-in" at the end of this file; the wider change is in
> `docs/sop/assessment-first-admission.md`. The history below is kept as shipped.

## What shipped
Admins can now **register a student directly** (walk-in), **mark the application fee paid in cash**
(both at registration and for existing pending enrollments), and **filter enrollments by location**.
Branch `ui-redesign`.

## Why
Students could only be created through the public enrollment flow (which pays via Paystack). A
walk-in at the office had no path: no way to create the student/enrollment and no way to record a
cash application-fee payment. Admins also needed to slice enrollments by location.

## How (key decisions)
- **`POST /api/admin/enrollments`** (JWT) — mirrors the public create: find-or-create `Student`
  (admin is authoritative, so provided fields refresh the record), create `Enrollment` capturing the
  same info we collect today. If `feePaid` → `applicationPaid=true`, `status='enrolled'`, and a
  **completed `ApplicationPayment`** (`paymentMethod` cash/bank-transfer/pos, amount = the
  **location-based fee** `calculateApplicationFee(course.location)`, `paystackReference` left null).
  Else `status='pending'`. Audited `enrollment.admin_create`.
- **`POST /api/admin/enrollments/[id]/mark-paid`** (JWT) — for an existing **pending** enrollment:
  in one transaction, create the completed cash `ApplicationPayment` and flip
  `applicationPaid=true` + `status='enrolled'`. Idempotent (400 if already paid). Audited
  `application.cash_paid`.
- **UI:** `components/admin/student-registration-modal.tsx` (full form + course/mode picker + a
  visible **"Application fee paid (cash)"** switch + method). On `/admin/enrollments`: a **Register
  Student** button, a **"Mark fee paid"** row action (green check, shown only when unpaid), and a
  **Location filter** dropdown (built from the distinct `course.location` values).
- **Location = course location.** A student's location today is the location of the course they
  enrolled in (`Course.location` — Lagos/Abuja/Online), so the filter keys on
  `enrollment.course.location`. Added `location` to the list-GET course `select`.

## What's involved (files)
- `app/api/admin/enrollments/route.ts` (new POST), `app/api/admin/enrollments/[id]/mark-paid/route.ts` (new).
- `app/api/enrollments/route.ts` (list GET: `course.location` added to select).
- `components/admin/student-registration-modal.tsx` (new).
- `app/admin/enrollments/page.tsx` (Register button, mark-paid action + handler, location filter, types).

## Verification
- `npx tsc --noEmit` → 0 · `npm run build` → succeeds (both routes + page present).
- **Not verified live:** the authed HTTP request cycle against real data (types + build cover it).
  The cash `ApplicationPayment` write and the `enrolled` flip are straight Prisma writes; audit is
  best-effort.

## Operate / follow-ups
- Walk-in cash fee uses the same location-based amount as online (Lagos/Abuja ₦5k, Online/other ₦2k,
  Diaspora ₦8k). Change in `lib/application-fee.ts` if the cash price should differ.
- Receipt email on cash payment isn't sent yet (email delivery is blocked on `RESEND_API_KEY`); wire
  a best-effort `sendApplicationFeeReceipt` here once email is live.

---

## Updated 2026-11-03: assessment-first walk-in

**What changed.** Paying the fee no longer enrols a student (decision D6, supersedes D1): it buys an
**assessment**. The walk-in flow was reworked to match. Branch `feature/assessment-first-admission`
(commits `14eb8c6` routes, `7845c08` admin UI). Full context: `docs/sop/assessment-first-admission.md`.

### How it works now
| Topic | Before (history above) | Now (code) |
| --- | --- | --- |
| Picker | course + delivery mode | **location -> course -> optional offering (format)** in `components/admin/student-registration-modal.tsx`. `locationId` + `courseId` are required; `offeringId` is optional (B7) so an admin can register a student before any rate exists, and the format and rate are agreed after the assessment. The course list is every published, active course; it is not filtered to the chosen location. Offerings shown are that course's offerings at the chosen location, inactive ones tagged "(inactive)" |
| Offering validation | none | if `offeringId` is sent it must belong to the course **and** the location, else 400 `offeringId must be an offering of this course at the selected location`. `selectedMode` = the offering's format name, or `''` when none chosen |
| Assessment details | none | `arrangement` (`HOME`/`CENTRE`/`ONLINE`, default `CENTRE`), optional `preferredDate`, `preferredTimeBand` (`morning`/`afternoon`/`evening`/`flexible`); for `HOME` the student's `address`/`landmark` are stored on the `Assessment`. An `Assessment{requested}` row is always created |
| Schedule now | n/a | optional `scheduleAssessmentAt`; requires `feePaid` (else 400 `Mark the assessment fee paid to schedule the assessment now`) |
| Fee amount | `calculateApplicationFee(course.location)` (`lib/application-fee.ts`, deleted) | `Location.assessmentFee` of the chosen location via `getAssessmentFee` (admin data, D11). A missing or inactive location is a 400. The amount is snapshotted into `Enrollment.applicationFeeAmount` |
| `feePaid` | `applicationPaid=true`, `status='enrolled'` | creates the completed cash/transfer/POS `ApplicationPayment`, then `pending -> assessment_paid` through the guard (`transitionEnrollment`), all in **one transaction** with the enrollment and assessment. With `scheduleAssessmentAt` it continues `assessment_paid -> assessment_scheduled` in the same transaction. A failed compare-and-set aborts the whole registration |
| Not paid | `status='pending'` | unchanged: `pending`, `applicationPaid=false` |
| Duplicates | n/a | blocked (400 `This student already has an application for this course`) if the student has a non-`pending`, non-`cancelled` enrollment for the course; a stale `pending` one is cancelled first, not deleted (B9, B14) |
| `mark-paid` | `pending` -> `enrolled` | **`pending -> assessment_paid`**. Requires `status === 'pending'` (400 `Cannot record the assessment fee on a <status> enrollment`) and not already paid (400 `Assessment fee is already marked paid`). Amount = the snapshotted `applicationFeeAmount`, else the enrollment's location fee (400 `Enrollment has no location` if neither exists). Payment row + status move are one transaction, so a double click is harmless |
| Audit | `enrollment.admin_create`, `application.cash_paid` | same names, metadata gains `toStatus`/`locationId`/`offeringId`; a schedule-now also writes `assessment.schedule` |
| Location filter | keyed on `enrollment.course.location` | keyed on **`enrollment.location.name`, falling back to `course.location`** for legacy rows with no `locationId` (`enrollmentLocationName()` in `components/admin/enrollments/types.ts`); options are the distinct resolved names |
| Enrollment list | `GET /api/enrollments` select added `course.location` | list also returns `location`, `offering{deliveryMode}` and the latest `assessment`; `course.location`/`course.pricing` are still selected for the legacy fallbacks |

After registration the student sits in the admin pipeline: schedule -> record result -> agree plan -> confirm (or record
tuition) -> `enrolled`. Those steps live in the "Assessment & plan" panel; see the blueprint section 4 for the state machine.

### What's involved (files, this update)
- `app/api/admin/enrollments/route.ts` (walk-in POST rewritten), `app/api/admin/enrollments/[id]/mark-paid/route.ts`.
- `components/admin/student-registration-modal.tsx`; `app/admin/enrollments/page.tsx` + `components/admin/enrollments/*` (filters, table, status badge, panel).
- `lib/assessment-fee.ts`, `lib/enrollment-transition.ts`, `lib/enrollment-status.ts`, `lib/assessment-vocab.ts`.

### Verification
- `npm test` unit coverage for the guard, CAS helper and fee lookup (61 tests passing across the shipment).
- **Not verified live:** the walk-in and mark-paid HTTP routes were not exercised by a recorded authed request (code read only); the
  webhook path they share the guard with is proven on a local Paystack mock (see the blueprint section 10).

### Follow-ups
- A receipt email is still not sent on a cash payment (email delivery remains blocked on `RESEND_API_KEY`).
- The walk-in course picker is not filtered to courses offered at the chosen location (admin may register before offerings exist, by design, B7).
- Whether the assessment fee is once per student or once per course application is an open business rule; today it is once per application.

## Updated 2026-11-03 (fee once per student)
The assessment fee is charged **once per student**. A walk-in for a student who has already paid it starts at `assessment_paid` with the fee marked covered (no payment recorded), and "schedule now" works without `feePaid`; ticking `feePaid` for such a student returns **409** (`This student has already paid the assessment fee; a second fee cannot be recorded.`). Cash mark-paid on a pending application of an already-paid student records no second fee and covers that application. A cash fee supersedes any pending Paystack payment for that enrollment; if that Paystack charge later succeeds it is stored as a `duplicate` and shown as **Refund needed** (refund by hand in Paystack, then Mark refunded). See `docs/sop/assessment-first-admission.md`.
