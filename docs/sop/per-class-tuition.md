# SOP — Per-class tuition (Stream 5)

## What shipped
Tuition is charged **per class** (classes x price per class, plus materials) as a **charge ledger** per enrollment. Students pay in part, several times, in person (cash, bank transfer, POS, card, cheque, mobile money, other) or online through a **Paystack link the admin generates and shares by hand**. Payments are confirmed automatically by the webhook, receipted (PDF + email, student copy + admin copy), tracked in a new admin **Payments** dashboard, and every mutation is audited. Branch `feature/per-class-tuition`, PR against `feature/assessment-first-admission` (stacked on #12; see the PR for the final head SHA).
Spec: `docs/superpowers/specs/2026-11-03-per-class-tuition-design.md` (D12 + builder calls T1-T16) · ledger/plan: `docs/superpowers/plans/2026-11-03-stream5-per-class-tuition.md` · API guide with captured responses: `docs/fe-integration-guide-per-class-tuition.md`.

| Commit | What |
|---|---|
| `fd4ace7` | `TuitionCharge` schema + backfill migration + verifier |
| `541dc40` | Pure ledger / balance / CSV helpers + tests |
| `7f320ec` | `settleTuitionPayment`, metadata check, payment methods, receipt data loader, Paystack link helper |
| `88bc05c` | Routes: plan charges, record, charges, void, payment link, cancel, dashboard API |
| `1272810` | Webhook tuition branch, per-class receipts/emails, mock overrides, e2e harness |
| `5860dfa` | PDF receipts print `NGN` (helvetica has no ₦), ledger receipt fits one page |
| `3123d53` | Admin ledger modal, payments dashboard, plan-step materials, thank-you page |
| `f576b56` | Opus review fixes (below) |
| merge | `feature/assessment-first-admission` (`9d10d08`: fee once per student, duplicate fees, policy copy) merged in; conflicts in the webhook route, enrollment detail route, plan panel, table and blueprint resolved keeping both sides; duplicate `escapeHtml` removed |

## Why
John charges per class, not monthly; the assessment fee and tuition are separate; some courses need books/materials before classes start; partial payments must work; online and offline payments both need to be tracked and auditable. Before this, tuition was a lump price per delivery mode (`Course.pricing[mode]`, decision D3) with a manual-only recording route.

## How (key decisions)
- **Derived, not stored (D12).** Nothing is stored per class. `TuitionCharge` rows (`CLASSES` / `MATERIAL`, quantity, unit price snapshot) are created when the plan is agreed; **owed = Σ active charges**, **paid = Σ completed + partial payments**, `outstanding = max(0, owed − paid)`, overpayment shows as `credit`. `classesCovered(charges, paid)` (`lib/tuition-ledger.ts`) pays materials first, then classes in charge order each at its own rate; a part-paid class does not count. Pure, unit-tested; S4's `ClassSession.sequence` can call it.
- **Charges are voided, never deleted (T4)**; a top-up adds a new charge at **today's rate** resolved server-side (T5), never rewriting old snapshots. Editing a `plan_agreed` plan voids and recreates the `PLAN` charges in the same transaction (the plan update row-locks the enrollment first, so concurrent edits serialise).
- **Ledger vs legacy (T1).** Ledger mode = any charge row, or plan fields with no rows yet (synthetic, never persisted). Otherwise **legacy**: the old `Course.pricing[selectedMode] − paid`, isolated in `lib/tuition-balance.ts` (the only reader of `Course.pricing`), with the Full/Part marker. Legacy rows are not touched by the migration.
- **One settle path for online money** (`lib/tuition-payment.ts: settleTuitionPayment`): one transaction, claim `status in (pending, failed, cancelled) -> completed` (count 0 = replay), then `plan_agreed -> enrolled` by compare-and-set. Webhook routing is by **reference lookup** in `tuition_payments`; metadata is only cross-checked (T11); charged amount/currency must equal the row; DB errors rethrow so Paystack retries; emails are individually guarded.
- **The pending row is created before Paystack is called (T10)**, so any payable reference has a record; a failed initialise deletes the row; a same-amount pending link within 10 minutes is reused; link creation is serialised by the enrollment row lock.
- **Manual recording** (T8, T9): whole naira, method from the manual list, amount ≤ outstanding unless `allowOverpayment`; the balance is re-read **under the enrollment row lock** inside the transaction (a double submit cannot pass the guard twice). Ledger payments are always `completed`; wording on the receipt follows the balance (T7).
- **Receipts are point-in-time (T13)**: charges as of the payment, payments up to and including it. PDFs print `NGN 20,000` because the built-in PDF font has no ₦ glyph (this also fixes the legacy receipts, which printed a stray `:`).
- **Status rule unchanged** (S3): a counted payment on `plan_agreed` moves it to `enrolled`. Not tightened (see follow-ups).
- Alternatives rejected: storing a paid flag per class (drifts from payments); persisting a lazily created ledger on read (writes on GET, race); trusting webhook metadata to route (spoofable); a student-facing page to pay (no student login exists).

## What's involved
- **Schema/migration:** `prisma/schema.prisma` (`TuitionCharge`; `TuitionPayment.paystackReference/paystackChannel/paymentUrl`), `prisma/migrations/20261103180000_per_class_tuition/migration.sql` (DDL + one idempotent backfill: a CLASSES charge `plannedClasses x ratePerClass` for each `plan_agreed`/`enrolled` row with plan fields and no charges; `createdAt` = the enrollment's creation so it predates its payments). Verifier: `scripts/verify-tuition-migration.sh`.
- **Logic:** `lib/tuition-ledger.ts`, `tuition-balance.ts`, `tuition-plan-charges.ts`, `tuition-payment.ts`, `tuition-webhook.ts`, `tuition-receipt-data.ts`, `tuition-methods.ts`, `tuition-csv.ts`; `lib/paystack.ts` (`createTuitionPayment`); `lib/offering-rates.ts` (`toWholeNumber`, `MAX_PLANNED_CLASSES`, `expectedTuitionTotal` removed); `lib/receipt.ts`, `lib/email.ts` (ledger receipt + escaped email template).
- **Routes (all `withAuth`, all audited):** `POST …/enrollments/[id]/plan` (creates charges), `POST|GET …/tuition`, `POST …/tuition/payment-link`, `POST …/tuition/charges`, `POST …/tuition/charges/[chargeId]/void`, `POST …/tuition-payments/[id]/cancel`, `GET|POST …/tuition-payments/[id]/receipt`, `GET /api/admin/payments`; `app/api/webhooks/paystack/route.ts` (tuition branch for success, failed, dispute); `GET /api/enrollments` includes `tuitionCharges`; `GET …/enrollments/[id]` returns `materials`.
- **Audit actions:** `tuition.charges_created`, `tuition.record`, `tuition.overpayment`, `tuition.charge_add`, `tuition.charge_void`, `tuition.link_create`, `tuition.payment_cancel`, `tuition.online_paid`, `enrollment.enrolled_by_tuition`, `tuition.amount_mismatch`, `tuition.metadata_mismatch`, `tuition.paid_unexpected_state`, `tuition.dispute`, `payment.unmatched_reference`.
- **UI:** `components/admin/tuition-payment-modal.tsx` + `components/admin/tuition/*` (ledger, add charge, void, record payment, payment link with copy / WhatsApp share, history with receipts, cancel link); `/admin/payments` + `components/admin/payments/*` (payments + outstanding, filters, CSV); plan panel lists required and optional materials; enrollment table shows balance and "N of M classes covered"; `/pay/tuition-thanks` (static).

## Verification (what actually ran)
| Check | Result |
|---|---|
| `scripts/verify-tuition-migration.sh` (ephemeral Postgres, legacy fixture + plan rows) | 🟢 all assertions: enrollments and payments untouched, **legacy rows get no charge**, plan rows backfilled (8 x 4000; enrolled row 4 x 3000 with balance 9,000 preserved), cancelled and zero-class rows skipped, re-run is a no-op, **no schema drift** |
| `npm test` (Vitest) | 🟢 131 tests (ledger maths incl. multi-rate, ordering, part-paid class, free class, voids, credit, as-of; legacy parity; amount checks; CSV injection; plan charges; settle with a stubbed db; metadata match; receipts PDF/email) |
| `scripts/test-tuition-e2e.mjs` (real routes + real webhook, ephemeral DB, local Paystack mock) | 🟢 **87 checks**: plan creates/voids charges, partial cash, overpayment guard (and confirmed overpayment), method/amount validation, link create/default/over-balance/reuse/cancel, webhook settle, replay, **3 concurrent deliveries**, amount mismatch, foreign currency, wrong metadata, unknown reference, late payment on a **cancelled** enrollment, `charge.failed` after success, failed-then-paid, top-up at today's rate (old snapshot untouched), void rules, legacy enrollment untouched, point-in-time receipt + PDF, dashboard filters + outstanding, 401 without a token on every mutating route, and one test per review fix (double-submit race, concurrent links, duplicate material, input bounds, cancelled enrollment, current-ledger overpayment audit). Captures: `docs/captures/stream5/` |
| `scripts/test-webhook.mjs` E2E (assessment-fee path incl. the base branch's duplicate-fee cases), run on the head merged with the updated base `9d10d08` | 🟢 31/31 (its last case needs a seeded `delivery_modes` row on a fresh scratch DB) |
| `npx tsc --noEmit`, `npx next build` | 🟢 clean (build needs `RESEND_API_KEY`/`PAYSTACK_SECRET_KEY` set, as before; dummy values used locally) |
| Browser, 1280px emulation, production build on the ephemeral DB: plan form shows required (included) and optional materials; ledger modal (charged / paid / outstanding / "2 of 8 classes covered", charges table, record form pre-filled with the outstanding balance, link created from the UI with copy + WhatsApp, pending link with Copy/Cancel, history with receipt buttons); `/admin/payments` totals, **method filter (POS: 5 rows)**, cancelled-enrollment flag, **CSV export content**; receipt PDF for a settled online payment rendered and read ("Paid in full", 8 of 8) | 🟢 |
| **Real Paystack test-mode charge for tuition** | ⚠️ **NOT DONE** — needs John's keys. The mock proves our handling of Paystack's responses, not Paystack itself |
| Email delivery of receipts (student + admin copy) | ⚠️ not verified: `RESEND_API_KEY` is a placeholder (pre-existing) |
| Not exercised in the UI: submitting the plan form (proven by the API run), Add charge / Void dialogs, Cancel-link button, 375px layouts, the `/pay/tuition-thanks` page rendering in a browser (build lists it as static) | ⚠️ not done |

## Review (Opus, one pass at the end)
Webhook settle path, idempotency, amount verification, authorization: **no blockers**. Fixed in `f576b56`:

| Finding | Severity | Resolution |
|---|---|---|
| Manual record had no row lock; balance read before the transaction (double submit / two admins pass the overpayment guard; cancellation between read and write still records) | should-fix | enrollment row lock + status re-check as the first statement, balance re-read and amount re-checked under the lock; 409 when the status changed; E2E race test |
| Overpayment audit for an online payment used the point-in-time receipt ledger and was skipped when a cash payment landed while the link was open | should-fix | judged on the current ledger, independent of the receipt; E2E case |
| A plan edit could double-charge a material already added as an adjustment | should-fix | PLAN lines whose material already has an active ADJUSTMENT charge are skipped; E2E case |
| `plannedClasses` unbounded / `Number(true)` accepted (500 on int overflow) | note | `toWholeNumber` + cap of 1,000; E2E cases |
| Charge could be added to a just-cancelled enrollment | note | status in the lock's `where` (409) |
| `GET …/tuition` exposed `paymentUrl` of cancelled/failed links (still payable at Paystack) | note | only `pending` rows return the URL |
| Two near-simultaneous link clicks made two links | note | lookup + create under the row lock; an in-flight link answers 409 |

## Operate / roll back — READ BEFORE DEPLOYING
1. **Snapshot production first.** The deploy runs `prisma migrate deploy` from `postinstall`. Stream 5's migration (`20261103180000_per_class_tuition`; it shares a timestamp prefix with the base's `20261103180000_fee_once_per_student` but the names differ and sort fee_once first, which is fine for `migrate deploy`. **Do not rename it**: a Vercel preview already applied it under this name, and a rename makes Prisma re-run the DDL and fail) **depends on `20261103150000_assessment_first_admission`** (Streams 2+3): deploy #12 first or together.
2. **Use a direct DB URL** (not the Accelerate proxy) for that migration step; `migrate deploy` cannot run through Accelerate.
3. The migration is additive (new table, three nullable columns on `tuition_payments`, a unique index on an all-null column, one idempotent backfill). Production has no plan rows until #12 is live, so the backfill is a no-op there. Legacy enrollments are untouched and keep the old balance.
4. **Roll back:** code-only revert is safe (old code ignores the new table and columns); full rollback = restore the snapshot. `tuition_charges` can be left in place. Pending online links created before a revert would still settle only if the webhook code is live, so cancel open links first.
5. Config: the Paystack webhook URL must already point at `/api/webhooks/paystack` (same endpoint as the assessment fee); set `NEXT_PUBLIC_BASE_URL` so the link's callback is `/pay/tuition-thanks`. `JWT_SECRET` must be set (the auth helper falls back to a fixed string when it is not: pre-existing, see follow-ups).
6. Local verification recipe: `EPHEMERAL_PG_PORT=5480 EPHEMERAL_PG_DIR=<tmp> scripts/dev/ephemeral-pg.sh start`, `npx prisma migrate deploy`, `node scripts/mock-paystack.mjs`, run the app with `PAYSTACK_BASE_URL=http://127.0.0.1:4010` and matching `JWT_SECRET`/`PAYSTACK_SECRET_KEY`, then `node scripts/test-tuition-e2e.mjs`. **Never `npm install` without `--ignore-scripts`** and never point a script at `.env` (production).

## Follow-ups
- **Real Paystack test-mode charge** for tuition (John's keys); then confirm the real `authorization_url`, webhook signature and the receipt email arrive.
- **John's decisions:** tuition **refund policy** (not built; a payment on a cancelled enrollment is recorded and flagged, not refunded); should `plan_agreed -> enrolled` wait until the first class is covered (built: any counted payment, S3's rule); policy-dialog text about instalments/PayPal still contradicts the flow (not edited).
- A pending link stays payable after cash fills the balance or a plan edit; the result is recorded credit and a `tuition.overpayment` audit row. The UI does not yet warn "a pending link exists" when recording cash or editing a plan, and the dashboard does not list credits (audit rows hold them).
- Move a **legacy** enrolled student onto the ledger: needs a plan; not offered (plan route requires `assessed`/`plan_agreed`).
- Route the three receipt sends through the S7 outbox (`TODO(S7)` markers in `app/api/admin/enrollments/[id]/tuition/route.ts`, `app/api/admin/tuition-payments/[id]/receipt/route.ts`, `lib/tuition-webhook.ts`, `lib/email.ts`). Until then, if the process dies after the settle commits, the audit rows and receipt of that delivery are lost (a replay hits `already_processed`).
- Pre-existing, noted by the review: `lib/auth.ts` falls back to a fixed JWT secret when `JWT_SECRET` is unset; older email templates in `lib/email.ts` interpolate public-form names unescaped (the new ledger template escapes).
- Instalment plans, coupons/discount overrides, student portal, class scheduling (S4) are out of scope.
