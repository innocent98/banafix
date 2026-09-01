# SOP — Tuition receipts: admin copy, full/part marking, balance (req #1)

## What shipped
Recording a tuition payment now supports a **Full / Part** marker, computes and shows the
**remaining balance**, and sends an **admin copy** of every tuition receipt. Branch
`tuition-receipts` (off `banafix` after the Student-entity Foundation merged).

## Why
Admins needed to record partial tuition payments, see how much a student still owes, and keep
a copy of each receipt for records. Previously the tuition route hardcoded `status='completed'`,
never computed a balance, and emailed the receipt to the student only.

## How (key decisions)
- **Expected total = `course.pricing[enrollment.selectedMode]`** (decision D3). `remainingBalance
  = max(0, expectedTotal − totalPaid)`, clamped so overpayment shows 0.
- **Full/Part is a manual admin marker** (`paymentType`), mapped to `TuitionPayment.status`
  (`completed` for full, `partial` for part). The balance is always computed from real amounts,
  so it stays honest even if the marker and amount disagree.
- **`totalPaid` now counts `completed` AND `partial`** payments (was `completed` only) — otherwise
  partials wouldn't reduce the balance.
- **Missing price** for the student's mode → record the payment and send the receipt, but omit the
  balance line (never block a real payment).
- **Admin copy** is a separate best-effort send to `ADMIN_EMAIL` (→ `SUPPORT_EMAIL`), not a cc —
  the student never sees the admin address. A failure can't affect the student send.
- No schema change — `TuitionPayment.status` already allowed `partial`; `TuitionReceiptData`
  already had `remainingBalance`.

## What's involved (files)
- `app/api/admin/enrollments/[id]/tuition/route.ts` — accept `paymentType`; include `partial` in
  `totalPaid`; compute `expectedTotal`/`remainingBalance` from `course.pricing`; set status; pass
  balance + type into the receipt; audit metadata gains `paymentType`/`totalPaid`/`remainingBalance`.
- `lib/receipt.ts` — `TuitionReceiptData.paymentType`; PDF now renders Payment Type + Balance
  Remaining (the PDF previously showed neither).
- `lib/email.ts` — tuition email shows Payment Type; `sendTuitionReceipt` sends the admin copy.
- `components/admin/tuition-payment-modal.tsx` — Full/Part selector; live expected/paid/balance
  preview (hidden when no price); sends `paymentType`.
- `app/api/enrollments/route.ts` (list GET) — expose `course.pricing` so the admin page/modal can
  compute the balance.
- `app/admin/enrollments/page.tsx` — count `partial` in tuition totals; show a per-row balance.
- `app/api/admin/tuition-payments/[id]/receipt/route.ts` — **bug fix:** receipts were rejected for
  any non-`completed` payment, so a `partial` payment's receipt couldn't be re-sent/downloaded;
  now allows `completed`+`partial`, counts partials in `totalPaid`, and shows the balance
  (shared `buildTuitionReceiptData` helper).

## Verification
- `npx tsc --noEmit` → 0 errors · `npm run build` → succeeds.
- Balance arithmetic + edge cases (first partial, full settles, overpayment clamp, partials
  accumulate, missing price, no pricing) verified via a logic harness — all correct.
- **Not yet verified live:** email *delivery* remains blocked on the placeholder `RESEND_API_KEY`,
  so the admin-copy send and receipt emails are wired + type-checked but not delivered. A full
  DB-integration run (record partial→full against a seeded course) was not executed here; the
  logic is covered by types + build + the balance harness.

## Follow-ups
- Once `RESEND_API_KEY` is real, confirm the student receipt + admin copy both arrive and the
  balance/type render correctly.
- Consider a "fully paid" badge derived from balance == 0 (today "Tuition Paid" shows when a
  `completed` full payment exists; a student who pays off via multiple partials stays "Enrolled").
