# SOP — Admin walk-in student registration + cash fee + location filter

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
