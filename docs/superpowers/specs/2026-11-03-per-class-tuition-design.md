# Per-class tuition — design

**Date:** 2026-11-03 · **Status:** approved decisions (lead, Adebayo) + builder calls · **Covers:** Stream 5 of the 2026-11-03 client meeting. Builds on Streams 2+3 (`docs/superpowers/specs/2026-11-03-assessment-first-admission-design.md`, ledger `docs/superpowers/plans/2026-11-03-streams-2-3-assessment-first.md`, decisions B1-B15).

## Intent
John charges tuition **per class** (classes x price per class), never monthly. The assessment fee and tuition are separate payments. A student may pay online (a Paystack link the admin sends) or at the office (cash, transfer, POS, other); partial payments are normal; some courses need books or materials bought before classes start. Every payment is confirmed automatically where possible, receipted, tracked in the admin dashboard and auditable.

## Goals
- A **charge ledger** per enrollment: what the student owes, line by line, with prices snapshotted.
- Balance = charges - counted payments, correct under partial payments, top-ups, voids and overpayment.
- "Classes covered" as a pure, unit-tested function S4's `ClassSession.sequence` can reuse.
- Online tuition through an admin-generated Paystack link; the webhook settles it with the same hardening as the assessment fee.
- Per-class receipts (PDF + email, student copy + admin copy).
- Admin payments dashboard (filters, outstanding view, CSV export); every mutation audited.

## Non-goals
Refunds (assessment fee is non-refundable; **tuition refund policy is John's decision, not built**), instalment plans, coupons/discount overrides, student portal/login, messaging (S7 owns the outbox: a marked TODO in the send sites), scheduling (S4). No schema dependency on S4.

## Decisions taken by the lead (do not re-litigate)
| ID | Decision |
|---|---|
| D12 | Per-class paid status is **derived**, never stored per class. `TuitionCharge` rows `{enrollment, kind CLASSES\|MATERIAL, quantity, unitPrice (snapshot), description}`; total = sum. Initial CLASSES charge = `plannedClasses x ratePerClass` when the plan is agreed; required `Material`s add MATERIAL charges (price snapshotted); later top-ups add a new charge at the then-current rate (audited), never rewriting old snapshots. `classesCovered = floor((paid - materials) / rate)`, generalised to several rates, in order, by the pure helper `classesCovered(...)`. |
| — | Keep `TuitionPayment` and the manual recording route (cash/transfer/POS/card/other, partial/full). Balance becomes `sum(charges) - sum(completed + partial payments)`. **Legacy enrollments (no plan, no charges) keep the old `Course.pricing[mode] - paid` calculation untouched**, in separate code, tested. |
| — | Online: admin generates a Paystack link for a chosen amount (default = outstanding), shares it by hand. Webhook gets a `tuition` branch, idempotent like the assessment-fee branch; amounts verified server-side; metadata never trusted alone. |
| — | Status: S3's rule stays (a counted tuition payment on `plan_agreed` moves it to `enrolled` through the single guard). |

## Builder calls (mine, marked)
| # | Call | Why |
|---|---|---|
| T1 | **Ledger mode** = the enrollment has any `TuitionCharge` row, or has plan fields (`ratePerClass` + `plannedClasses`) but no rows yet (a synthetic, never-persisted CLASSES charge covers the deploy window). Otherwise **legacy mode**. | One decision function, tested; no lazy writes on read paths. |
| T2 | The migration is **DDL plus one backfill**: a CLASSES charge `plannedClasses x ratePerClass` for each `plan_agreed`/`enrolled` row that has plan fields and no charges. Rows without plan fields (every legacy row) are untouched. | Existing plan rows keep exactly their S2+3 balance; no materials are added retroactively. |
| T3 | Charge `origin`: `PLAN` (created with / replaced by the plan) or `ADJUSTMENT` (admin added later). Editing a `plan_agreed` plan **voids and recreates the `PLAN` charges** (serialised by the enrollment row lock the plan update takes first); `ADJUSTMENT` charges survive. A plan cannot be edited once enrolled, so a plan edit never meets a counted payment. | Plan edits stay possible without rewriting snapshots in place; history is retained as voided rows. |
| T4 | Charges are **voided, never deleted** (`voidedAt`, `voidedBy`, `voidReason` required). Voiding may drive the balance negative, shown as **credit**. | Audit trail; a student who already owns the book is a real case. |
| T5 | Top-up rate is resolved **server-side** from the enrollment's offering + `durationMins` (`resolveRate`); the admin supplies only the quantity (or an optional material). No price override (coupons are out of scope). | Prices stay data (D11), no ad-hoc typing of money. |
| T6 | Plan step accepts `materialIds` for **optional** materials; required active materials are always added. `MATERIAL` charges snapshot `Material.price` and name. | "Include in enrolment where applicable." |
| T7 | For ledger enrollments the payment `status` is always `completed` (a recorded payment is a recorded payment); the Full/Part selector applies to **legacy rows only**. Receipt wording is derived from the balance ("Paid in full" vs "Part payment"). `partial` stays a valid counted status for legacy rows. | Removes an admin error source; the ledger already says what is owed. |
| T8 | Manual recording **rejects an amount above the outstanding balance** (400) unless `allowOverpayment: true`; the UI asks the admin to confirm. Amount must be a positive whole naira number. Online-link amount is capped at the outstanding balance. Overpayment can still arise from concurrent links or cash; it is recorded, shown as credit and audited (`tuition.overpayment`). | A typo (extra zero) must not silently become a debt of the academy. |
| T9 | Manual methods: `cash, bank-transfer, pos, card, cheque, mobile-money, other`; `paystack` is reserved for the online path. The old `installment` option is dropped (instalment plans are out of scope; partial payments cover it). Existing rows keep any stored value. | Matches John's list. |
| T10 | Link creation **creates the pending `TuitionPayment` row first** (with its generated reference), then calls Paystack initialize, then stores `paymentUrl`; if initialize fails the row is deleted (nothing was payable). So any reference that can ever be paid has a row. A pending link for the same enrollment + amount created in the last 10 minutes is returned instead of duplicated. | Mirrors B14's "never lose a payable reference"; double-click safe. |
| T11 | Webhook routing is by **database lookup of the reference** (application payment, then tuition payment), never by metadata. For a tuition row, `metadata.enrollment_id` and `metadata.payment_type`, when present, must agree with the row; a disagreement is audited and not settled. Charged amount/currency must equal the row. | "Never trust metadata alone." |
| T12 | A tuition payment that settles on a **cancelled** (or otherwise not `plan_agreed`/`enrolled`) enrollment is recorded as a money fact, status is never moved, an audit row `tuition.paid_unexpected_state` is written and no student receipt is sent; the dashboard shows the enrollment status so an admin sees it. Refund handling is John's policy. | Same pattern as the assessment-fee path. |
| T13 | A re-sent or downloaded receipt reproduces the **point-in-time** numbers: charges as of the payment (created before it, not voided before it), payments up to and including it, ordered by `(paidAt, createdAt, id)`. | A later top-up must not rewrite an old receipt; no extra columns needed. |
| T14 | The Paystack callback target is a static `/pay/tuition-thanks` page that reads nothing and changes nothing (money is only settled by the webhook). | No student session exists. |
| T15 | Admin can cancel a **pending** link (`pending -> cancelled`); the webhook still settles a cancelled row if money arrives (the money fact wins). | Hygiene without losing money. |
| T16 | Dashboard CSV is produced client-side from the filtered rows by a pure, unit-tested `toCsv` that neutralises formula injection (cells starting `= + - @` get a leading `'`). | Export-friendly without a server file. |

## Data model
- **`TuitionCharge`** `{ id, enrollmentId (cascade), kind 'CLASSES'|'MATERIAL', origin 'PLAN'|'ADJUSTMENT', quantity Int, unitPrice Int (naira), description, materialId? (SetNull), createdBy? (admin id; null = system), createdAt, voidedAt?, voidedBy?, voidReason? }`, `@@index([enrollmentId])`. Line total = `quantity x unitPrice`.
- **`TuitionPayment`** adds `paystackReference String? @unique`, `paystackChannel String?`, `paymentUrl String?`. Counted statuses stay `completed` and `partial`; `pending` (online link not yet paid), `failed`, `cancelled` are not counted. Existing columns unchanged. Index on `(status)` is not needed at this scale.
- `Enrollment` is unchanged. `Course.pricing` stays, deprecated, read only by the legacy path.

## Pure logic (`lib/tuition-ledger.ts`, `lib/tuition-balance.ts`, `lib/tuition-csv.ts`)
- `activeCharges`, `chargeTotal`, `totalCharged`, `materialsTotal`, `COUNTED_STATUSES`, `totalPaid(payments)`.
- `summarizeLedger(charges, payments) -> { charged, paid, outstanding (>= 0), credit (>= 0), materials, classesPurchased, classesCovered }`.
- `classesCovered(charges, paid)`: materials are settled first; then CLASSES charges in `createdAt` order, each class at its own charge's rate; a part-paid class does not count; a later charge is never covered while an earlier one is not complete; free classes (price 0) are covered.
- `chargesAsOf(charges, t)` for T13; `checkPaymentAmount(outstanding, amount, allowOverpayment)`.
- `computeTuitionBalance(enrollment, charges, payments, legacyPricing)` returns `{ mode: 'ledger', ...summary } | { mode: 'legacy', expectedTotal?, paid, outstanding? }`; the legacy branch is the only reader of `Course.pricing`. `isLedgerEnrollment` implements T1.

## Money flows
- **Plan agreed** (`POST .../plan`): same transaction as the status move creates the `PLAN` charges (T3, T6).
- **Manual** (`POST .../tuition`): validates (T8, T9), ledger mode derives status (T7), payment + `plan_agreed -> enrolled` in one transaction (unchanged B15), audit `tuition.record`, receipt best-effort.
- **Online** (`POST .../tuition/payment-link`): T10 + T8 cap, admin-only, enrollment must be `plan_agreed`/`enrolled` with the assessment fee paid.
- **Webhook**: `charge.success` -> verify with Paystack -> lookup (T11) -> `chargeMatches` -> `settleTuitionPayment` (`lib/tuition-payment.ts`): one transaction, claim (`status in pending|failed|cancelled` -> `completed`, count 0 = replay) then `plan_agreed -> enrolled` compare-and-set. Errors rethrow (500 => Paystack retries); emails are individually guarded. `charge.failed` only moves a `pending` row to `failed`.
- **Charges admin**: `POST .../tuition/charges` (top-up classes or a material), `POST .../tuition/charges/[chargeId]/void`; both audited; the enrollment row lock serialises them.

## UI
Admin enrollment payments modal becomes the ledger screen (charges, summary incl. classes covered, record payment, payment link with copy/WhatsApp share, history incl. pending links, receipts); legacy rows keep the old form and balance. New `/admin/payments`: tabs Payments and Outstanding, filters (location, method, status, search, dates), totals, CSV export. Plan panel lists required materials and lets the admin pick optional ones.

## UX consequences to surface
Editing a plan voids and recreates its charges; a top-up uses today's rate; a payment link cannot exceed the balance; a payment above the balance needs an explicit confirmation; a late online payment on a cancelled enrolment is recorded but not receipted (admin must act); tuition refunds are not handled; `Course.pricing` is read only for legacy rows.

## Verification (required)
Migration on an ephemeral Postgres with a legacy fixture (legacy untouched, plan rows backfilled); webhook + route harness against the local Paystack mock (success, replay, 3 concurrent, amount mismatch, unknown reference, late payment on cancelled, metadata mismatch, failed-after-success, link -> webhook journey); unit tests for the ledger math; `tsc`, `next build`, `npm test`; browser check of the admin payment flow and receipt at 1280px. **A real Paystack test charge needs John's keys: NOT done.** Prod deploy needs a snapshot and a direct DB URL.

## Seams
S4: `classesCovered(charges, paid)` gives how many classes (by `sequence`) are paid. S7: the three marked `TODO(S7)` send sites move to the outbox.
