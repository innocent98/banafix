# SOP — Enrollment payment emails (student receipt + admin notification)

## What shipped
On a successful registration-fee payment, the Paystack webhook now automatically
(1) emails the student their paid application-fee receipt with the PDF attached, and
(2) emails the admin/support inbox a "new paid enrollment" notification.
Previously the webhook did neither (a `// TODO: send receipt email` placeholder), and
the student receipt could only be sent by an admin manually clicking "Send receipt".

Commit: _(pending)_ — branch `banafix`.

## Why
- **Student ack:** enrolling + paying produced no email until a human intervened.
- **Admin notification:** did not exist at all — no way to know a paid enrollment
  arrived without opening the admin dashboard.
Root of the gap: the send logic lived in `lib/email.ts` but was never wired into the
one server-side event that reliably confirms payment (the Paystack `charge.success`
webhook).

## How
- Reused the existing `sendApplicationFeeReceipt()` (Resend + jsPDF receipt) for the
  student — chosen over the simpler `sendEnrollmentConfirmation()` because payment has
  just succeeded, so the paid receipt is the natural artifact. Marks
  `receiptGenerated`/`receiptSent` on the `ApplicationPayment` when the send succeeds.
- Added `sendAdminEnrollmentNotification()` to `lib/email.ts`, sent to `ADMIN_EMAIL`
  (new optional env var) which **falls back to `SUPPORT_EMAIL`** so it works with no
  extra config. `replyTo` is set to the student's email for one-click follow-up.
- Both sends run from a new `sendEnrollmentEmails()` helper in the webhook, called
  after the DB transaction that flips the enrollment to `application_paid`.

### Key decision: never let email break the webhook
Each send is wrapped in its own `try/catch` and failures are logged, not rethrown.
A thrown error would make the webhook return 500, and Paystack would retry the
already-processed event. Idempotency is preserved by the existing
`if (applicationPayment.status === 'completed') return` guard earlier in the handler.

## What's involved
| File | Change |
|------|--------|
| `app/api/webhooks/paystack/route.ts` | Added imports; `course` include now pulls `instructor.name`; replaced the TODO with `sendEnrollmentEmails()` helper that builds `ApplicationFeeReceiptData`, generates the PDF, sends the student receipt (+ updates receipt flags), and sends the admin notification |
| `lib/email.ts` | New `ADMIN_EMAIL` constant (`process.env.ADMIN_EMAIL || SUPPORT_EMAIL`); new `sendAdminEnrollmentNotification()` |

No DB schema or migration changes (reused existing `receiptGenerated`/`receiptSent`).

### Env / config
- `RESEND_API_KEY` — required (already present).
- `FROM_EMAIL` (default `noreply@banafix.com`) — **its domain must be verified in
  Resend (SPF/DKIM)** or sends are rejected.
- `ADMIN_EMAIL` — optional; defaults to `SUPPORT_EMAIL` (`support@banafix.com`).

## Verification
- `npx tsc --noEmit` → exit 0 (includes Resend `replyTo` type check).
- Not yet exercised against a live Paystack `charge.success` event — see follow-ups.

## Operate / roll back
- Roll back by reverting the two files; no data migration to undo.
- To route admin mail elsewhere, set `ADMIN_EMAIL` in `.env` and redeploy.

## Update — pre-payment acknowledgement wired in
`sendEnrollmentConfirmation()` is now sent from `POST /api/enrollments`, immediately
after Paystack payment initialization succeeds (so it only goes to applicants with a
real, resumable payment). It is guarded by try/catch and best-effort — a mail failure
never fails the enrollment or delays the redirect to Paystack.

Before wiring, the function was corrected: it previously hardcoded a `₦2,000` fee and
linked a **"Complete Payment" button to `/enroll/payment/[id]`, a route that does not
exist** (404). The button was removed and the fee is now passed in dynamically via a new
`applicationFee` param (`calculateApplicationFee(course.location).amount`), matching the
webhook receipt amount.

Net email flow per enrollment:
1. **On form submit** (`POST /api/enrollments`) → student gets "application received" ack.
2. **On payment success** (Paystack webhook) → student gets paid receipt + PDF; admin gets notification.

Touched: `app/api/enrollments/route.ts` (import + guarded send), `lib/email.ts`
(`sendEnrollmentConfirmation` signature + body fix).

## Follow-ups
- End-to-end test a real sandbox payment and confirm all three emails arrive.
- Confirm the `FROM_EMAIL` domain is verified in Resend for production.
- Consider the same auto-send wiring for tuition payments (currently admin-manual only).
