# Assessment-first admission + location/offering model — design

**Date:** 2026-11-03 · **Status:** draft for approval · **Covers:** Streams 2 and 3 of the 2026-11-03 client meeting (see `docs/checklist/master-checklist.md`). Streams 4–8 are out of scope here; only the seams they will plug into are named.

## Intent
John (the client) runs Banafix as a music academy, not a booking site. A student applies, pays a
non-refundable **assessment fee**, is assessed (often at home), and only then is placed on a
course, format, schedule and per-class price. The app today treats paying the fee as being
enrolled (decision D1) and prices a course as one lump per delivery mode in a single location. Both
are wrong for how Banafix operates. Done means: an admin can configure locations, offerings and
per-class rates, a student can only see what their location offers, and every student visibly moves
through application → assessment → plan → enrolled, with assessment and enrolment as separate stages.

## Goals
- Location-aware catalogue: the student picks a location, then sees only the courses, formats and per-class prices offered there.
- Per-class pricing, with rates stored per class duration (45 min / 1 hour).
- Assessment as a first-class stage with scheduling, a result, and edit-after-the-fact.
- The assessment fee and tuition remain separate payments; the fee is non-refundable.
- **Everything commercial is admin-editable data (D11):** assessment fee per location, offerings, rates, materials. No price or fee stays hardcoded.
- No existing student, payment or receipt is lost or reinterpreted.

## Non-goals (this spec)
Class scheduling and instructor conflict prevention (Stream 4), tuition invoicing and online tuition (Stream 5), parent capture at registration (Stream 6), messaging providers/WhatsApp/feedback (Stream 7), site content (Stream 8), a student login/dashboard, refunds, coupons.

## Anti-goals (a failure even if it "works")
- Showing a legacy lump price labelled "per class". Old prices were per mode, not per class.
- Any status where `enrolled` means only "fee paid" for a new student.
- Existing paid students dropped, downgraded or re-asked to pay.
- A new hardcoded price, fee or location list anywhere in code.
- Silent failures: Paystack webhook must stay idempotent and keep working through the cutover.

## Constraints
Next.js 15 / Prisma / Postgres on Vercel; `DATABASE_URL` is an Accelerate proxy, migrations need a direct URL (see checklist Stream 0) and a prod snapshot. Follow the repo's **staged migration** precedent (`Student` foundation): additive first, destructive drops in a later PR. Amounts are whole naira `Int`. Money and state changes happen only in the webhook / admin routes, never on the redirect. Every admin mutation writes `AuditLog` via `lib/audit.ts`. No AI attribution in commits/PRs; branches named `feature/<slug>`.

## Decisions taken (with reasons)
| ID | Decision | Why |
|---|---|---|
| D6 | Paying the fee buys an assessment; admission comes after. Supersedes D1. Legacy `enrolled` rows stay `enrolled`. | John's stated process; existing students were told paying = enrolled. |
| D7 | `CourseOffering` (course × location × format) replaces `Course.pricing/availableModes/location`. | A location offers different formats and prices; one `Course` row per city duplicates content. |
| D8 | `OfferingRate` per (offering, durationMins). | Unknown whether 45 min and 1 hr price differently; data answers it without code. |
| D9 | Seat counting retired; columns kept, not enforced. | One-on-one, per-class teaching has no meaningful seat cap. |
| D11 | All commercial config is admin data. | John's inputs aren't known yet; they must not block the build. |

**My calls (not John's):** keep the `Enrollment` table as the single journey record rather than adding an `Application` table (one record per student per course, new status vocabulary; renaming is churn); `Diaspora` seeds as an ONLINE-kind location; a single assessment fee per location (no per-arrangement fee).

## Data model (shape; builder finalises names and indexes)
- **`Location`** `{ name @unique, kind PHYSICAL|ONLINE, assessmentFee Int, isActive, order, address? }`. Seeded from `lib/locations.ts` + the fee tiers in `lib/application-fee.ts` (Lagos/Abuja/Online 5000, other 2000, Diaspora 8000). Replaces the hardcoded `calculateApplicationFee`.
- **`CourseOffering`** `{ courseId, locationId, deliveryModeId, classesPerWeekOptions Int[] (default [1,2]), isActive }`, `@@unique(courseId, locationId, deliveryModeId)`. `DeliveryMode` stays the global format list.
- **`OfferingRate`** `{ offeringId, durationMins Int, pricePerClass Int }`, `@@unique(offeringId, durationMins)`.
- **`Material`** `{ courseId, name, price Int, required Boolean, isActive }` (consumed by Stream 5; admin-editable now).
- **`Assessment`** `{ enrollmentId, status requested|scheduled|completed|cancelled|no_show, arrangement HOME|CENTRE|ONLINE, preferredDate?, preferredTimeBand/Start?, scheduledAt?, assessorId? (Instructor), resultLevel?, resultNotes?, recommendedOfferingId?, completedAt? }`. Many per enrollment (re-assessment). Result is editable after completion; each edit audited.
- **`Enrollment`** keeps its columns; adds `locationId`, `offeringId?`, and plan fields set at plan stage: `durationMins?`, `classesPerWeek?`, `plannedClasses?`, `ratePerClass?` (**snapshot**, so later rate edits never move an existing student's price). `selectedMode` stays for legacy rows.
- **`Course`** loses its role for price/location/format/seats. Columns `pricing, availableModes, location, duration, session*, totalSeats, seatsLeft, unlimitedSeats` are **deprecated, not dropped** here. `CurriculumModule.weeks` becomes optional (Stream 1); 12 modules is a convention shown to admins, not a constraint.

## Status machine (`Enrollment.status`)
`pending` → `assessment_paid` → `assessment_scheduled` → `assessed` → `plan_agreed` → `enrolled`; any non-terminal → `cancelled`.
- `pending → assessment_paid`: Paystack `charge.success` (webhook) or admin cash mark-paid / walk-in `feePaid`. No seat decrement.
- `assessment_paid → assessment_scheduled`: admin sets a slot (from the student's preferred date/time).
- `→ assessed`: instructor/admin records the result.
- `→ plan_agreed`: admin fixes offering, duration, classes/week, planned class count; rate snapshotted.
- `→ enrolled`: recording any tuition payment (`POST /api/admin/enrollments/[id]/tuition`, exists today) on a `plan_agreed` enrollment, or an audited admin "Confirm enrolment" action. **My call;** Stream 5 may tighten it (e.g. first class paid).
- Transitions go through one guard function with a table of allowed moves (unit-tested). `applicationPaid` stays the payment fact.
- Legacy: all existing `enrolled` rows stay `enrolled`; `pending` stays `pending`. Admin can still create assessment/plan records for them.

## Public flow
Location first (header/filter or `?location=`), then courses offered there, then format, then per-class rate ("₦X per class", per duration). Enrol wizard collects assessment arrangement + preferred date/time, then details, then pays the assessment fee (amount from `Location.assessmentFee`). A course with no active offering at the chosen location is not offered there. Online offerings hang off an ONLINE-kind `Location` (Online, Diaspora), which the chooser lists next to the physical centres, so anyone can pick them regardless of where they live. No total tuition is shown before the plan stage.

## Admin UI
`/admin/locations` (CRUD, fee, active); course edit gains **Offerings** (location × format matrix with per-duration rates) and **Materials** tabs, plus a bulk "set rate" helper to speed data entry; `/admin/enrollments` gains stage filters and an assessment/plan panel (schedule, record/edit result, agree plan). Existing split of that 740-line page is the builder's call.

## Migration and cutover
Staged and data-preserving, verified on an ephemeral Postgres (precedent: Foundation, instructor roster): create `Location` rows from distinct `Course.location`; create offerings per `availableModes`; set `Enrollment.locationId/offeringId` for existing rows. **Migrated offerings are created inactive with no rates**, because legacy `pricing` was per mode, not per class. Until John (or you) enters per-class rates, those courses show "enrolment opening soon" instead of a wrong price. Deploy needs a prod snapshot and a direct DB URL.

## UX consequences to surface
Existing courses lose their public price until rates are set; the fee is relabelled "assessment fee" across emails, receipts and the policy dialog (the dialog's PayPal and instalment claims still need John's review); rate edits never change a snapshotted student price; legacy students keep `enrolled`.

## Verification
Vitest on the pure logic (status-transition guard, fee lookup, rate resolution); migration proven on ephemeral Postgres with a legacy-data fixture (no row loss, grandfathering, inactive offerings); `scripts/test-webhook.mjs` extended for `assessment_paid`; one real Paystack test-mode charge; `tsc` + `next build`; browser check at 375px and 1280px of the new location-first flow.

## Builder-check resolutions (my calls, marked as such)
- **Legacy rows:** `enrolled` rows keep null plan fields; emails, receipts and admin filters must tolerate that, and legacy balance keeps using the deprecated `Course.pricing` until Stream 5. A legacy `pending` student whose webhook arrives after cutover goes to `assessment_paid`. Admins may create an `Assessment` for legacy rows retroactively, optionally.
- **`Enrollment.locationId`:** nullable. Backfilled from `Course.location` (which is "Online"/"Diaspora" for online courses, so those map to the ONLINE-kind rows). The assessment fee comes from the chosen offering's location.
- **Walk-in registration** (`POST /api/admin/enrollments`, `StudentRegistrationModal`): the course+mode picker becomes a location + offering picker; arrangement defaults to CENTRE; preferred date/time optional; the admin can schedule the assessment immediately. `feePaid` → `assessment_paid`.
- **Fee relabel is copy-only.** `applicationPaid`, `applicationFeeAmount`, `ApplicationPayment` and webhook metadata names stay.
- **`plannedClasses`** is admin-entered at the plan step, not derived.
- **Assessor:** admin-only recording. `assessorId` names who conducted it; there is no instructor login today, and adding one is a future change.
- **Open business rule (theirs):** is the assessment fee charged once per student or once per course application? Default until answered: once per application, which is today's behaviour.

## Left to the builder
Table and column naming, indexes, whether `Assessment` uses time bands or start/end, the admin page decomposition, exact copy, route shapes, and how the location chooser persists (query param vs cookie).

## Seams for later streams
Stream 4 adds `ClassSession` (→ `Enrollment`, `Instructor`), structured instructor availability and `InstructorCourse` many-to-many (today `Course.instructorId` allows one instructor per course). Stream 5 builds invoices from `plannedClasses × ratePerClass` plus `Material`. Stream 7's outbox consumes the status transitions here as triggers.
