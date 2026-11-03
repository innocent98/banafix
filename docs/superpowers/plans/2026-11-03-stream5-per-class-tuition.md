# Per-class tuition (Stream 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. This file is also the **ledger**: tick tasks as they land, note decisions and findings at the bottom.

**Goal:** Per-class tuition: a charge ledger per enrollment, partial/online/offline payments against it, per-class receipts and an admin payments dashboard.

**Architecture:** `TuitionCharge` rows + the existing `TuitionPayment`; pure helpers (`lib/tuition-*.ts`) compute balance and classes covered; one transactional settle function used by the Paystack webhook; manual route, payment link route and webhook all share it. Legacy enrollments stay on the old `Course.pricing` balance in separate code.

**Tech Stack:** Next.js 15 route handlers, Prisma/Postgres, Paystack HTTP API, jsPDF, Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-per-class-tuition-design.md` (decisions D12, builder calls T1-T16). Read it first; it is the contract. Prior art to copy patterns from: `lib/assessment-payment.ts`, `lib/enrollment-transition.ts`, `app/api/webhooks/paystack/route.ts`, `app/api/admin/enrollments/[id]/plan/route.ts`.

## Global Constraints
- Money is whole naira `Int`; Paystack is kobo (`x100`) only at the API boundary.
- Branch `feature/per-class-tuition`; push `git push -u origin HEAD:feature/per-class-tuition`. Never a `claude/` or AI-named branch. **Commits and the PR body carry no AI attribution** (no `Co-Authored-By`, no session link, no "Generated with" footer), subagents included.
- Every admin mutation writes `logAdminAction`. Every admin route uses `withAuth`.
- `.env` is production: never run migrate/seed/tests against it. Ephemeral Postgres only, port 5480 (`EPHEMERAL_PG_PORT=5480 EPHEMERAL_PG_DIR=/private/tmp/claude-501/banafix-s5-pg scripts/dev/ephemeral-pg.sh start`; URL `postgresql://postgres@127.0.0.1:5480/postgres`). `npm install --ignore-scripts` only. Never put secret-shaped strings in files (use `test_secret_not_real`).
- Fast checks before every push: `npx tsc --noEmit`, `npx next build`, `npm test`. ESLint is known broken; skip.
- Legacy rows (no plan fields, no charges) must keep the old balance behaviour exactly.
- Status moves only through `transitionEnrollment` (compare-and-set).
- Do not touch `components/site/policies/*` or `policy-dialog.tsx`.

## Review Focus
1. Two admins (or two tabs) record the same cash payment at once -> both recorded, balance right, no crash (T8 guard is per request, not a lock; acceptable and documented).
2. Webhook replay / 3 concurrent deliveries / charge.failed after success -> exactly one settle, one audit row, status moves once.
3. Paystack-reported amount differs from the row (kobo vs naira, currency) -> not settled, audited.
4. Plan edited (voided + recreated charges) while a link is pending -> link settles against its own row amount; balance reflects new charges.
5. Overpayment, voiding a charge below what was paid, zero-priced material, payment on a cancelled enrollment -> credit shown, never negative outstanding, never a 500.

---

### Task 1: Schema + migration + migration verifier
**Files:** Modify `prisma/schema.prisma`; Create `prisma/migrations/20261103180000_per_class_tuition/migration.sql`; Create `scripts/verify-tuition-migration.sh`.
**Interfaces — Produces:** model `TuitionCharge` (spec "Data model"); `TuitionPayment.paystackReference/paystackChannel/paymentUrl`; `Enrollment.tuitionCharges TuitionCharge[]`, `Material.tuitionCharges`.
- [ ] Add the model and columns; generate DDL with `prisma migrate diff --from-migrations ... --to-schema-datamodel` against the scratch DB; append the backfill `INSERT ... SELECT` for T2 to the same file.
- [ ] Verifier: ephemeral DB, apply all earlier migrations, load a fixture with legacy rows (no plan), a `plan_agreed` row and an `enrolled` row with plan fields + one TuitionPayment, apply the new migration, assert: legacy rows and payments unchanged; one CLASSES charge `plannedClasses x ratePerClass` for each plan row; none for legacy; re-running the INSERT is a no-op; `migrate diff` shows no drift.
- [ ] Run it: expect all assertions pass. Commit.

### Task 2: Pure ledger logic (TDD)
**Files:** Create `lib/tuition-ledger.ts`, `lib/tuition-balance.ts`, `lib/tuition-csv.ts`; Tests `tests/tuition-ledger.test.ts`, `tests/tuition-balance.test.ts`, `tests/tuition-csv.test.ts`; Remove `expectedTuitionTotal` from `lib/offering-rates.ts` (and its tests) once Task 4 stops using it.
**Interfaces — Produces:**
```ts
type LedgerCharge = { id?: string; kind: 'CLASSES'|'MATERIAL'; quantity: number; unitPrice: number; description?: string; createdAt?: Date|string; voidedAt?: Date|string|null }
type LedgerPayment = { amount: number; status: string }
summarizeLedger(charges, payments): { charged:number; paid:number; outstanding:number; credit:number; materials:number; classesPurchased:number; classesCovered:number }
classesCovered(charges: LedgerCharge[], paid: number): number
chargesAsOf(charges, t: Date): LedgerCharge[]
checkPaymentAmount(outstanding:number, amount:unknown, allowOverpayment:boolean): { ok:true; amount:number } | { ok:false; error:string }
isLedgerEnrollment(e:{ratePerClass:number|null; plannedClasses:number|null}, chargeCount:number): boolean
computeTuitionBalance(e:{ratePerClass; plannedClasses; selectedMode}, charges, payments, legacyPricing): {mode:'ledger'} & Summary | {mode:'legacy'; expectedTotal?:number; paid:number; outstanding?:number}
toCsv(rows: (string|number|null|undefined)[][]): string
```
- [ ] Write failing tests with these assertions, then implement: single-rate coverage `floor((paid-materials)/rate)` (8 x 4,000, materials 3,000, paid 19,000 -> 4); paid < materials -> 0; part-paid class not counted (paid 5,999 at 3,000 -> 1... with no materials); two rates in order (4 @ 3,000 then 4 @ 4,000, paid 20,000 -> 4 + 2); a later charge not covered while earlier incomplete; free class (price 0) covered; voided charges ignored; overpayment -> `outstanding 0`, `credit` = excess; void below paid -> credit; empty charges -> zeros; `pending/failed/cancelled` payments not counted, `completed` and `partial` counted; `chargesAsOf` includes a charge created before t and voided after t, excludes created after t and voided before t; `checkPaymentAmount` rejects 0, negative, 1.5, "abc", > outstanding without the flag, accepts == outstanding, accepts > outstanding with the flag; `isLedgerEnrollment` (plan fields only -> true, charges only -> true, neither -> false); `computeTuitionBalance` legacy branch equals the old `Course.pricing[mode] - paid` (price missing -> `expectedTotal` undefined, `outstanding` undefined) and never reads charges; `toCsv` quotes commas/quotes/newlines and prefixes `'` on cells starting `=`, `+`, `-`, `@`.
- [ ] `npm test`: all pass. Commit.

### Task 3: Server building blocks
**Files:** Create `lib/tuition-payment.ts`, `lib/tuition-receipt-data.ts`, `lib/tuition-methods.ts`; Modify `lib/paystack.ts`; Tests `tests/tuition-methods.test.ts`.
**Interfaces — Produces:**
```ts
// lib/tuition-methods.ts
MANUAL_PAYMENT_METHODS: readonly string[]  // cash, bank-transfer, pos, card, cheque, mobile-money, other
isManualMethod(v: unknown): v is string
// lib/paystack.ts
createTuitionPayment(a:{ email:string; firstName:string; lastName:string; enrollmentId:string; courseId:string; tuitionPaymentId:string; amount:number; reference:string }): PaystackTransaction  // metadata.payment_type 'tuition', callback `${base}/pay/tuition-thanks`
// verify response type gains metadata?: { enrollment_id?:string; payment_type?:string; tuition_payment_id?:string; ... }
// lib/tuition-payment.ts
settleTuitionPayment(db: PrismaClient, a:{ paymentId:string; enrollmentId:string; paystack: PaystackSuccessData }): Promise<{kind:'already_processed'}|{kind:'moved'}|{kind:'settled'}|{kind:'unexpected_state'; status:string}>
tuitionMetadataMatches(meta: unknown, row:{ enrollmentId:string; id:string }): boolean
// lib/tuition-receipt-data.ts
loadTuitionReceiptData(db, paymentId: string): Promise<TuitionReceiptData | null>  // point-in-time (T13)
```
- [ ] `settleTuitionPayment`: one transaction; claim `updateMany where {id, status in [pending, failed, cancelled]}` -> `completed` with `paidAt`, `paystackChannel`, `paymentMethod: 'paystack'`; count 0 -> `already_processed`; then `transitionEnrollment(tx, enrollmentId, 'plan_agreed', 'enrolled')` -> `moved`; if not moved, read status: `enrolled` -> `settled`, anything else -> `unexpected_state`. Unit-test with a stubbed `db` the way `tests/assessment-payment.test.ts` does (claim count 0; moved; already enrolled; cancelled).
- [ ] `tuitionMetadataMatches`: true when absent, or when present fields equal the row; unit-tested.
- [ ] `loadTuitionReceiptData`: loads payment + enrollment + student + course + charges + counted payments; builds the receipt payload with a `ledger` block (lines, materials, charged, classes purchased, classes covered, balance after) for ledger mode or the legacy payload otherwise. Receipt type itself changes in Task 6; this task adds the optional `ledger` field to `TuitionReceiptData`.
- [ ] Commit.

### Task 4: Admin routes
**Files:** Modify `app/api/admin/enrollments/[id]/plan/route.ts`, `.../tuition/route.ts`, `app/api/admin/tuition-payments/[id]/receipt/route.ts`, `app/api/admin/enrollments/[id]/route.ts` (return `materials`), `app/api/enrollments/route.ts` (list GET includes non-voided `tuitionCharges`); Create `.../tuition/charges/route.ts`, `.../tuition/charges/[chargeId]/void/route.ts`, `.../tuition/payment-link/route.ts`, `app/api/admin/tuition-payments/[id]/cancel/route.ts`, `app/api/admin/payments/route.ts`.
**Interfaces — Produces (API contract the UI builds on; all JSON, all admin JWT):**
- `GET /api/admin/enrollments/[id]/tuition` -> `{ mode:'ledger'|'legacy', charges:[{id,kind,origin,quantity,unitPrice,description,createdAt,voidedAt,voidReason}], payments:[{id,amount,status,paymentMethod,paystackReference,paymentUrl,receiptNumber,paidAt,createdAt,description}], summary:{charged,paid,outstanding,credit,materials,classesPurchased,classesCovered} | {expectedTotal?,paid,outstanding?}, enrollment:{id,status,applicationPaid,ratePerClass,plannedClasses,durationMins} }`
- `POST .../tuition` body `{ amount:int, paymentMethod, description?, paymentType?('full'|'partial' legacy only), allowOverpayment?:bool, sendReceipt?:bool }` -> 201 `{ payment, message }`; errors 400 with `error` string (T8, T9, status, fee unpaid).
- `POST .../tuition/payment-link` body `{ amount?:int }` (default outstanding) -> 201 `{ payment:{id,amount,paymentUrl,reference}, reused:boolean }`.
- `POST .../tuition/charges` body `{ kind:'CLASSES', quantity:int } | { kind:'MATERIAL', materialId }` -> 201 `{ charge }` (rate server-side, T5; `409` when the enrollment has no persisted ledger).
- `POST .../tuition/charges/[chargeId]/void` body `{ reason:string }` -> 200 `{ charge }`.
- `POST /api/admin/tuition-payments/[id]/cancel` -> 200 (pending only).
- `GET /api/admin/payments?locationId=&method=&status=&q=&from=&to=` -> `{ payments:[row], outstanding:[row], totals:{collected,pendingOnline,outstanding}, truncated:boolean }` (cap 500 each).
- [ ] Plan route: in the same transaction as the move/edit, take the enrollment row lock first (the update), void active `PLAN` charges (reason "plan edited"), insert CLASSES (`plannedClasses x ratePerClass`, description `${plannedClasses} x ${durationMins}-minute classes`) + required active materials + chosen optional `materialIds` (must belong to the course and be active, else 400). Audit `tuition.charges_created` with the lines.
- [ ] Tuition POST: ledger vs legacy via `computeTuitionBalance`; ledger path validates (`checkPaymentAmount`, `isManualMethod`), derives status `completed`, balance in audit metadata; legacy path keeps current behaviour. Receipt via `loadTuitionReceiptData`; `TODO(S7)` marker at the send site. Audit `tuition.overpayment` when `credit > 0`.
- [ ] Payment-link route per T10 (create row, initialize, store url, delete row on init failure; reuse window 10 min); audit `tuition.link_create`.
- [ ] Charges + void routes lock the enrollment row first (`updateMany` no-op on `updatedAt`), audit `tuition.charge_add` / `tuition.charge_void`.
- [ ] Receipt route: use `loadTuitionReceiptData` (replaces the inline builder and the `lte new Date()` filter).
- [ ] Remove `expectedTuitionTotal` and its tests. Run `npx tsc --noEmit`. Commit.

### Task 5: Webhook tuition branch + mock + harness
**Files:** Modify `app/api/webhooks/paystack/route.ts`; Create `lib/tuition-webhook.ts`; Modify `scripts/mock-paystack.mjs`, `scripts/test-webhook.mjs`; Create `scripts/test-tuition-e2e.mjs`.
**Interfaces — Produces:** `handleTuitionChargeSuccess(tuitionPayment, verified)`, `handleTuitionChargeFailed(tuitionPayment)`; mock `POST /__override/:reference {amount?, status?, metadata?}` and `initialize` remembers `metadata` and returns it from `verify`.
- [ ] Route: after the application-payment lookup misses, look up `tuitionPayment` by `paystackReference`; found -> `handleTuitionChargeSuccess`; neither -> existing `payment.unmatched_reference` audit. `charge.failed` and dispute get the same lookup (failed moves only `pending -> failed`; dispute warns + audits `tuition.dispute`).
- [ ] `handleTuitionChargeSuccess`: `tuitionMetadataMatches` (else audit `tuition.metadata_mismatch`, return), `chargeMatches` (else audit `tuition.amount_mismatch`, return), early-out if completed, `settleTuitionPayment`; audit `tuition.online_paid` (+ `enrollment.enrolled_by_tuition` when moved, `tuition.paid_unexpected_state` for unexpected, `tuition.overpayment` if credit); no student receipt on unexpected state; otherwise send receipt via `loadTuitionReceiptData` + `sendTuitionReceipt`, mark flags, never rethrow from email; DB errors rethrow.
- [ ] Harness `test-tuition-e2e.mjs` (needs the app on the ephemeral DB + mock; mints an admin JWT with the app's `JWT_SECRET`): fixtures by SQL; checks for: plan route creates charges (+ required material, + optional); manual partial then final payment (balance, classes covered via GET); overpayment rejected then allowed with flag; payment link -> mock -> webhook success -> enrolled, one audit row; replay; 3 concurrent; amount mismatch; metadata mismatch (via `__override`); unknown reference; late payment on cancelled; `charge.failed` after success; link above balance rejected; link reuse; top-up at current rate; void; legacy enrollment balance unchanged by a manual payment. Exit non-zero on any failure.
- [ ] Run against the app; all green. Commit.

### Task 6: Receipts + emails (per-class language)
**Files:** Modify `lib/receipt.ts` (`TuitionReceiptData.ledger`, `generateTuitionReceiptPDF`), `lib/email.ts` (`generateTuitionEmailHTML`, subjects), `tests/` (receipt text smoke test).
- [ ] PDF/email for ledger mode: charge lines (description, qty x rate, amount), materials, total charged, amount paid, total paid to date, balance, classes covered of purchased; "Paid in full" / "Part payment" from the balance; student copy and admin copy both use it; HTML-escape interpolated names/descriptions in the new template; legacy payload renders the old layout. PDF grows with line count and adds a page rather than overflowing. Marked `TODO(S7)` at each send site.
- [ ] A vitest test builds the PDF for both payloads and asserts it is non-empty; commit.

### Task 7: Admin UI
**Files:** Rewrite `components/admin/tuition-payment-modal.tsx`; Modify `components/admin/enrollments/enrollment-table.tsx`, `types.ts`, `status-badge.tsx`, `assessment-plan-panel.tsx`, `components/admin/admin-layout.tsx`; Create `app/admin/payments/page.tsx`, `app/(site)/pay/tuition-thanks/page.tsx`, `components/admin/payments/*`.
- [ ] Modal per spec "UI": fetch `GET .../tuition` on open; ledger sections; record payment (amount defaults to outstanding, overpayment confirm checkbox, methods from `lib/tuition-methods`); payment link create + copy + WhatsApp share; pending links in history with copy and cancel; legacy rows keep the old form and balance; receipts send/download kept.
- [ ] Table: balance and "N of M classes covered" from the ledger helpers; "Paid in full" badge derived from balance; the "Manage payments" button disabled unless status is `plan_agreed`/`enrolled` (fixes the S2+3 follow-up).
- [ ] `/admin/payments`: tabs, filters (location, method, status, search, dates), totals, CSV via `toCsv`, nav item "Payments".
- [ ] Plan panel: required materials listed as included, optional ones selectable (`materialIds`).
- [ ] `/pay/tuition-thanks`: static thank-you; no DB, no state.
- [ ] `npx tsc --noEmit`, `npx next build`. Commit.

### Task 8: Verify, review, docs, PR
- [ ] Run migration verifier, `npm test`, tsc, build, `test-webhook.mjs` (E2E mode, S2+3 checks still green), `test-tuition-e2e.mjs`.
- [ ] Browser check at 1280px: plan with materials -> record partial cash -> payment link -> simulated webhook -> receipt PDF; payments dashboard filters + CSV.
- [ ] One Opus review (webhook branch, ledger math, idempotency, amount verification, link authorization); fix findings. Run the security-review skill on the diff.
- [ ] Docs: `docs/sop/per-class-tuition.md`, edit `docs/sop/tuition-receipts.md` (superseded parts), tick Stream 5 in the master checklist, update the blueprint (data model + payment flow, D3 superseded), FE-style API notes with captured responses from the harness (admin UI only; no FE consumer, state that).
- [ ] Push `feature/per-class-tuition`; PR base `feature/assessment-first-admission`; bind with ccd_pr; do not merge.

---
## Ledger (decisions, findings, status)
- Branch renamed from `feature/per-class-tuition-57dadb` to `feature/per-class-tuition` before any commit.
- Scratch Postgres: port 5480, dir `/private/tmp/claude-501/banafix-s5-pg`.

### Outcome (2026-11-03)
- Tasks 1-8 done; PR https://github.com/innocent98/banafix/pull/14 (base `feature/assessment-first-admission`). Verification and review results: `docs/sop/per-class-tuition.md`.
- Builder calls beyond the spec: whole-naira + cap on every amount and class count; link creation rejects (409) while an identical link is still being created; `GET …/tuition` returns `paymentUrl` only for pending rows; receipts print `NGN` in PDFs (fixes a pre-existing `:` for ₦ on legacy receipts too).
- Merge note: the base moved (`9d10d08`, fee once per student, duplicate fees, policy copy) after the first push; merged in, 5 conflicts resolved keeping both sides, migration name left as `20261103180000_per_class_tuition` (a Vercel preview had applied it; renaming makes Prisma re-run the DDL).
- **For the lead:** Vercel preview deployments run `prisma migrate deploy` (via `postinstall`). The preview applied this migration to whatever DB the Vercel Preview env points at. If that is the production DB, the additive Stream 2+3 and Stream 5 migrations are already applied there; worth confirming before the "snapshot first" deploy gate.
- Open for John/Adebayo: tuition refund policy; first-class-paid gate for `enrolled`; real Paystack test charge.
