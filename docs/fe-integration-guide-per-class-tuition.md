# Per-class tuition: integration guide (admin UI and any future consumer)

> **Provenance rule:** every body below is copied verbatim from a real response captured by `scripts/test-tuition-e2e.mjs` against the running app (real routes, ephemeral Postgres, **local Paystack mock**). Captures are in `docs/captures/stream5/`; re-run the harness to refresh them. Ids, names and emails in the captures are test placeholders (`t5_...`, `Ada Placeholder`, `@example.com`). Long arrays are trimmed and say so. **Nothing here was exercised against real Paystack** (needs John's keys): the `paymentUrl` host in the captures is the mock's, a real link points at `checkout.paystack.com`.
>
> There is no student-facing consumer: no student login exists. The only consumer is the admin UI (`/admin/enrollments`, `/admin/payments`); the payment link is shared with students by hand.

## What it is, in the FE's terms
Tuition is **per class**: classes x price per class, plus any materials, as **charge lines** on the student's ledger. When an admin agrees the plan, the lines are created. The student may pay in part, several times, in person or through a Paystack link the admin generates. The screen shows what is charged, paid, outstanding and **how many classes the money covers**. Students whose enrolment predates this feature (**legacy**) keep the old single-price balance.

Auth on every endpoint: `Authorization: Bearer <admin JWT>`; without it the answer is `401 {"error":"No token provided"}` (verified live, status only). Errors are always `{ "error": "<message>" }`.

## Field-nesting and shape traps
- `GET …/tuition` returns **`mode`** (`ledger` | `legacy`) at the top **and** `summary.mode`; the two `summary` shapes differ (below). Branch on `mode`, never on which fields exist.
- `outstanding` is **never negative**. Money paid beyond what is owed is `credit` (ledger only). Legacy `outstanding` is **absent/undefined when the course has no price for the mode**.
- `charges[]` includes **voided** rows (`voidedAt` not null). They do not count; show them struck through.
- `payments[]` includes **pending** (unpaid link), **failed** and **cancelled** rows. Only `completed` and `partial` count. A payment's `paymentUrl` and `paystackReference` are `null` for in-person payments.
- Dashboard rows use `method`/`channel`/`reference` (flattened), the enrollment endpoint uses `paymentMethod`/`paystackChannel`/`paystackReference` (raw columns).
- `classesCovered` is derived; do not store or recompute it client-side, use `summary`.
- `createdAt` on a seeded row can look an hour off the `paidAt` in the captures: that is the test fixture inserting local-time `now()` by SQL, not app behaviour.

## State machine and polling
`TuitionPayment.status`: `pending` (link created, not paid) → `completed` (webhook settled) | `failed` | `cancelled` (admin withdrew the link; money arriving later still settles it). In-person payments are created `completed`. **The UI never settles anything**: after sending a link, refetch `GET …/tuition` (suggest every 15 s while a pending row is open, stop after 10 min or when the row leaves `pending`). The Paystack redirect page `/pay/tuition-thanks` is static and settles nothing.
Enrollment: recording or receiving a first counted payment on a `plan_agreed` enrollment moves it to `enrolled` (existing rule).

## UX consequences the FE must surface
- **Editing a plan voids and recreates its charges.** Warn before saving a plan edit; it is only possible while `plan_agreed`.
- **A top-up uses today's rate**, not the rate the student was originally quoted. Show the rate before the admin confirms.
- **Open payment links count against the balance.** A new link can ask for at most the outstanding balance **minus links that are already open (pending)**; otherwise the answer is `409` with the amount that is left. To take money for more classes add a charge (top-up) first; to free up room cancel an open link. A link that was cancelled can still be paid (the money was taken): it is recorded, never dropped.
- **Credit on account is listed on `/admin/payments` (Credits tab)**: paid beyond what is owed, or tuition paid on a cancelled enrollment. There is no refund flow: apply the credit to a top-up or refund it by hand. Tell the admin this wherever credit is shown.
- **A payment above the outstanding balance needs an explicit confirmation** (`allowOverpayment: true`); show the credit it creates.
- A pending link that is paid after the balance was cleared (cash, or a cancelled link paid anyway) **records the money as credit** and is not refused; the admin gets an email and a `tuition.overpayment` audit row.
- A payment arriving for a **cancelled** enrolment is recorded but gets **no receipt**; the admin gets an email, and the payment shows under **Credits** as refund-needed. Refunds are not handled (John's policy). A Paystack refund event is flagged (audit + email) but does **not** change the balance.
- Receipt PDFs print amounts as `NGN 20,000` (the PDF font has no ₦); emails and the UI use ₦.
- Creating the same link twice within 10 minutes returns the same link (`reused: true`; a request with no amount counts as "the whole balance"). A link row that never received its URL answers `409 A payment link for this amount is being created`, and is swept to `failed` after 2 minutes. If the URL could not be saved after Paystack created the link, the `201` response carries `urlNotSaved: true`: copy the URL from that response, it will not be shown again.

## Endpoints

### Plan agreed (creates the charges)
**POST `/api/admin/enrollments/<enrollmentId>/plan`** → **200**

Request body:
```json
{
  "offeringId": "t5_off_1793739529508",
  "durationMins": 60,
  "classesPerWeek": 2,
  "plannedClasses": 8,
  "materialIds": [
    "t5_mato_1793739529508"
  ]
}
```
Response (captured `docs/captures/stream5/01-plan-agree.json`):
```json
{
  "enrollment": {
    "id": "t5_e1_1793739529508",
    "courseId": "t5_course_1793739529508",
    "studentId": "t5_stu_1793739529508",
    "email": null,
    "firstName": null,
    "lastName": null,
    "phone": null,
    "dateOfBirth": null,
    "guardianName": null,
    "guardianPhone": null,
    "guardianEmail": null,
    "address": null,
    "landmark": null,
    "selectedMode": "T5 Mode",
    "priorLevel": null,
    "schedulePreference": null,
    "preferredDays": [],
    "musicExperience": null,
    "goals": null,
    "specialRequests": null,
    "agreeToTerms": false,
    "agreeToRefundPolicy": false,
    "consentToEmails": false,
    "applicationPaid": true,
    "applicationFeeAmount": null,
    "status": "plan_agreed",
    "locationId": "t5_loc_1793739529508",
    "offeringId": "t5_off_1793739529508",
    "feeCoveredByPaymentId": null,
    "durationMins": 60,
    "classesPerWeek": 2,
    "plannedClasses": 8,
    "ratePerClass": 4000,
    "couponCode": null,
    "waitlistNotes": null,
    "createdAt": "2026-11-03T21:58:49.723Z",
    "updatedAt": "2026-11-03T20:58:49.775Z"
  }
}
```
Editing the plan (voids the old PLAN charges, recreates them):

**POST `/api/admin/enrollments/<enrollmentId>/plan`** → **200**

Request body:
```json
{
  "offeringId": "t5_off_1793739529508",
  "durationMins": 60,
  "classesPerWeek": 2,
  "plannedClasses": 10,
  "materialIds": [
    "t5_mato_1793739529508"
  ]
}
```
Response (captured `docs/captures/stream5/02-plan-edit.json`):
```json
{
  "enrollment": {
    "id": "t5_e1_1793739529508",
    "courseId": "t5_course_1793739529508",
    "studentId": "t5_stu_1793739529508",
    "email": null,
    "firstName": null,
    "lastName": null,
    "phone": null,
    "dateOfBirth": null,
    "guardianName": null,
    "guardianPhone": null,
    "guardianEmail": null,
    "address": null,
    "landmark": null,
    "selectedMode": "T5 Mode",
    "priorLevel": null,
    "schedulePreference": null,
    "preferredDays": [],
    "musicExperience": null,
    "goals": null,
    "specialRequests": null,
    "agreeToTerms": false,
    "agreeToRefundPolicy": false,
    "consentToEmails": false,
    "applicationPaid": true,
    "applicationFeeAmount": null,
    "status": "plan_agreed",
    "locationId": "t5_loc_1793739529508",
    "offeringId": "t5_off_1793739529508",
    "feeCoveredByPaymentId": null,
    "durationMins": 60,
    "classesPerWeek": 2,
    "plannedClasses": 10,
    "ratePerClass": 4000,
    "couponCode": null,
    "waitlistNotes": null,
    "createdAt": "2026-11-03T21:58:49.723Z",
    "updatedAt": "2026-11-03T20:58:49.894Z"
  }
}
```
### The ledger screen
**GET `/api/admin/enrollments/<enrollmentId>/tuition`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/03-ledger-before-payment.json`):
```json
{
  "mode": "ledger",
  "enrollment": {
    "id": "t5_e1_1793739529508",
    "status": "plan_agreed",
    "applicationPaid": true,
    "selectedMode": "T5 Mode",
    "ratePerClass": 4000,
    "plannedClasses": 10,
    "durationMins": 60
  },
  "charges": [
    {
      "id": "cmw167b5e0000073mfwn0fizo",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 8,
      "unitPrice": 4000,
      "description": "8 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.778Z",
      "voidedAt": "2026-11-03T20:58:49.895Z",
      "voidedBy": "t5_admin_1793739529508",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw167b5e0001073m32q1isvk",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.778Z",
      "voidedAt": "2026-11-03T20:58:49.895Z",
      "voidedBy": "t5_admin_1793739529508",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw167b5e0002073m7shk1sgo",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.778Z",
      "voidedAt": "2026-11-03T20:58:49.895Z",
      "voidedBy": "t5_admin_1793739529508",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw167b8o0005073mble5umbc",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 10,
      "unitPrice": 4000,
      "description": "10 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.896Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw167b8o0006073mmn2az6r6",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.896Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw167b8o0007073mye1rjs8m",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.896Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    }
  ],
  "payments": [],
  "summary": {
    "mode": "ledger",
    "charged": 44500,
    "paid": 0,
    "outstanding": 44500,
    "credit": 0,
    "materials": 4500,
    "classesPurchased": 10,
    "classesCovered": 0
  }
}
```
(`charges` above is the full list for that enrollment after the plan edit: three voided rows, then three active ones.)

### Record a payment taken in person
**POST `/api/admin/enrollments/<enrollmentId>/tuition`** → **201**

Request body:
```json
{
  "amount": 20000,
  "paymentMethod": "cash",
  "description": "First part",
  "sendReceipt": false
}
```
Response (captured `docs/captures/stream5/04-record-cash-partial.json`):
```json
{
  "payment": {
    "id": "cmw167bag000b073more8aoma",
    "enrollmentId": "t5_e1_1793739529508",
    "amount": 20000,
    "currency": "NGN",
    "paymentMethod": "cash",
    "description": "First part",
    "status": "completed",
    "paidAt": "2026-11-03T20:58:49.960Z",
    "receiptNumber": "TUI-1793739529957-00S9",
    "receiptGenerated": false,
    "receiptSent": false,
    "paystackReference": null,
    "paystackChannel": null,
    "paymentUrl": null,
    "recordedBy": "t5_admin_1793739529508",
    "adminNotes": null,
    "createdAt": "2026-11-03T20:58:49.960Z",
    "updatedAt": "2026-11-03T20:58:49.960Z",
    "enrollment": {
      "student": {
        "firstName": "Ada",
        "lastName": "Placeholder",
        "email": "t5stu1793739529508@example.com"
      }
    }
  },
  "summary": {
    "mode": "ledger",
    "charged": 44500,
    "paid": 20000,
    "outstanding": 24500,
    "credit": 0,
    "materials": 4500,
    "classesPurchased": 10,
    "classesCovered": 3
  },
  "message": "Tuition payment recorded successfully"
}
```
Amount above the balance, without confirmation:

**POST `/api/admin/enrollments/<enrollmentId>/tuition`** → **400**

Request body:
```json
{
  "amount": 30000,
  "paymentMethod": "cash",
  "sendReceipt": false
}
```
Response (captured `docs/captures/stream5/05-overpayment-rejected.json`):
```json
{
  "error": "Amount exceeds the outstanding balance of \u20a624,500. Add a charge first, or confirm the overpayment."
}
```
With `allowOverpayment: true` (separate enrollment, charge ₦10,000, paid ₦12,000):

**POST `/api/admin/enrollments/<enrollmentId>/tuition`** → **201**

Request body:
```json
{
  "amount": 12000,
  "paymentMethod": "pos",
  "allowOverpayment": true,
  "sendReceipt": false
}
```
Response (captured `docs/captures/stream5/16-overpayment-confirmed.json`):
```json
{
  "payment": {
    "id": "cmw167t2j001h073mvtdy9nqz",
    "enrollmentId": "t5_e5_1793739529508",
    "amount": 12000,
    "currency": "NGN",
    "paymentMethod": "pos",
    "description": null,
    "status": "completed",
    "paidAt": "2026-11-03T20:59:13.003Z",
    "receiptNumber": "TUI-1793739553001-GXVU",
    "receiptGenerated": false,
    "receiptSent": false,
    "paystackReference": null,
    "paystackChannel": null,
    "paymentUrl": null,
    "recordedBy": "t5_admin_1793739529508",
    "adminNotes": null,
    "createdAt": "2026-11-03T20:59:13.004Z",
    "updatedAt": "2026-11-03T20:59:13.004Z",
    "enrollment": {
      "student": {
        "firstName": "Ada",
        "lastName": "Placeholder",
        "email": "t5stu1793739529508@example.com"
      }
    }
  },
  "summary": {
    "mode": "ledger",
    "charged": 10000,
    "paid": 12000,
    "outstanding": 0,
    "credit": 2000,
    "materials": 0,
    "classesPurchased": 2,
    "classesCovered": 2
  },
  "message": "Tuition payment recorded successfully"
}
```
Other 400s verified live (status only, strings in the route source): method `paystack` or `installment` → `Payment method must be one of: cash, bank-transfer, pos, card, cheque, mobile-money, other`; amount `1.5`, `0`, `-5` → `Amount must be a whole number of naira greater than 0`.

### Online payment link
**POST `/api/admin/enrollments/<enrollmentId>/tuition/payment-link`** → **201**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/06-payment-link-default-amount.json`):
```json
{
  "payment": {
    "id": "cmw167bem000f073m2s25fmgc",
    "amount": 24500,
    "paymentUrl": "http://127.0.0.1:4015/pay/tuition_1793739530107_5kg85b",
    "reference": "tuition_1793739530107_5kg85b"
  },
  "reused": false
}
```
Above the outstanding balance:

**POST `/api/admin/enrollments/<enrollmentId>/tuition/payment-link`** → **400**

Request body:
```json
{
  "amount": 24501
}
```
Response (captured `docs/captures/stream5/07-payment-link-over-balance.json`):
```json
{
  "error": "Amount exceeds the outstanding balance of \u20a624,500. Add a charge first, or confirm the overpayment."
}
```
A second link while the first already covers the whole balance:

**POST `/api/admin/enrollments/<enrollmentId>/tuition/payment-link`** → **409**

Request body:
```json
{
  "amount": 40000
}
```
Response (captured `docs/captures/stream5/20-second-link-refused.json`):
```json
{
  "error": "Open payment links already cover the whole outstanding balance (1 link, \u20a640,000). Cancel one, or wait for it to be paid, before creating another."
}
```
Second click for the same amount returns the same link with `reused: true` (verified live; status 200, body shape as above). Legacy enrollment → 400 (status verified live).

Withdraw a pending link:

**POST `/api/admin/tuition-payments/<id>/cancel`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/17-cancel-link.json`):
```json
{
  "message": "Payment link cancelled"
}
```
### After the online payment settled (ledger)
**GET `/api/admin/enrollments/<enrollmentId>/tuition`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/08-ledger-after-online-payment.json`):
```json
{
  "mode": "ledger",
  "enrollment": {
    "id": "t5_e1_1793739529508",
    "status": "enrolled",
    "applicationPaid": true,
    "selectedMode": "T5 Mode",
    "ratePerClass": 4000,
    "plannedClasses": 10,
    "durationMins": 60
  },
  "charges": [
    {
      "id": "cmw167b5e0000073mfwn0fizo",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 8,
      "unitPrice": 4000,
      "description": "8 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.778Z",
      "voidedAt": "2026-11-03T20:58:49.895Z",
      "voidedBy": "t5_admin_1793739529508",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw167b5e0001073m32q1isvk",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.778Z",
      "voidedAt": "2026-11-03T20:58:49.895Z",
      "voidedBy": "t5_admin_1793739529508",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw167b5e0002073m7shk1sgo",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.778Z",
      "voidedAt": "2026-11-03T20:58:49.895Z",
      "voidedBy": "t5_admin_1793739529508",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw167b8o0005073mble5umbc",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 10,
      "unitPrice": 4000,
      "description": "10 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.896Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw167b8o0006073mmn2az6r6",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.896Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw167b8o0007073mye1rjs8m",
      "enrollmentId": "t5_e1_1793739529508",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793739529508",
      "createdBy": "t5_admin_1793739529508",
      "createdAt": "2026-11-03T20:58:49.896Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    }
  ],
  "payments": [
    {
      "id": "cmw167bgy000j073mvu4rvo3c",
      "enrollmentId": "t5_e1_1793739529508",
      "amount": 10000,
      "currency": "NGN",
      "paymentMethod": "paystack",
      "description": "Online tuition payment",
      "status": "pending",
      "paidAt": null,
      "receiptNumber": "TUI-1793739530194-D5E6",
      "receiptGenerated": false,
      "receiptSent": false,
      "paystackReference": "tuition_1793739530191_o7vtnv",
      "paystackChannel": null,
      "paymentUrl": "http://127.0.0.1:4015/pay/tuition_1793739530191_o7vtnv",
      "recordedBy": "t5_admin_1793739529508",
      "adminNotes": null,
      "createdAt": "2026-11-03T20:58:50.195Z",
      "updatedAt": "2026-11-03T20:58:50.198Z"
    },
    {
      "id": "cmw167bem000f073m2s25fmgc",
      "enrollmentId": "t5_e1_1793739529508",
      "amount": 24500,
      "currency": "NGN",
      "paymentMethod": "paystack",
      "description": "Online tuition payment",
      "status": "completed",
      "paidAt": "2026-11-03T20:58:50.211Z",
      "receiptNumber": "TUI-1793739530110-YINT",
      "receiptGenerated": true,
      "receiptSent": false,
      "paystackReference": "tuition_1793739530107_5kg85b",
      "paystackChannel": "card",
      "paymentUrl": null,
      "recordedBy": "t5_admin_1793739529508",
      "adminNotes": null,
      "createdAt": "2026-11-03T20:58:50.111Z",
      "updatedAt": "2026-11-03T20:59:00.625Z"
    }
  ],
  "summary": {
    "mode": "ledger",
    "charged": 44500,
    "paid": 44500,
    "outstanding": 0,
    "credit": 0,
    "materials": 4500,
    "classesPurchased": 10,
    "classesCovered": 10
  }
}
```
(`charges` trimmed to the first 6 and `payments` to the first 2 for length.)

### Top-up and void
**POST `/api/admin/enrollments/<enrollmentId>/tuition/charges`** → **201**

Request body:
```json
{
  "kind": "CLASSES",
  "quantity": 2
}
```
Response (captured `docs/captures/stream5/11-topup-at-current-rate.json`):
```json
{
  "charge": {
    "id": "cmw167svt0014073mmh0artrq",
    "enrollmentId": "t5_e1_1793739529508",
    "kind": "CLASSES",
    "origin": "ADJUSTMENT",
    "quantity": 2,
    "unitPrice": 4000,
    "description": "2 x 60-minute classes (top-up)",
    "materialId": null,
    "createdBy": "t5_admin_1793739529508",
    "createdAt": "2026-11-03T20:59:12.761Z",
    "voidedAt": null,
    "voidedBy": null,
    "voidReason": null
  }
}
```
**POST `/api/admin/enrollments/<enrollmentId>/tuition/charges/<id>/void`** → **200**

Request body:
```json
{
  "reason": "Student changed their mind"
}
```
Response (captured `docs/captures/stream5/12-void-charge.json`):
```json
{
  "charge": {
    "id": "cmw167swl0017073m11e23424",
    "enrollmentId": "t5_e1_1793739529508",
    "kind": "CLASSES",
    "origin": "ADJUSTMENT",
    "quantity": 1,
    "unitPrice": 5000,
    "description": "1 x 60-minute classes (top-up)",
    "materialId": null,
    "createdBy": "t5_admin_1793739529508",
    "createdAt": "2026-11-03T20:59:12.790Z",
    "voidedAt": "2026-11-03T20:59:12.850Z",
    "voidedBy": "t5_admin_1793739529508",
    "voidReason": "Student changed their mind"
  }
}
```
Voiding twice → 409, no reason → 400, material already charged → 409, inactive material → 400 (statuses verified live).

### Legacy enrollment (old behaviour, unchanged)
**POST `/api/admin/enrollments/<enrollmentId>/tuition`** → **201**

Request body:
```json
{
  "amount": 20000,
  "paymentMethod": "bank-transfer",
  "paymentType": "partial",
  "sendReceipt": false
}
```
Response (captured `docs/captures/stream5/14-legacy-record-partial.json`):
```json
{
  "payment": {
    "id": "cmw167szx001b073m10vhetzj",
    "enrollmentId": "t5_e4_1793739529508",
    "amount": 20000,
    "currency": "NGN",
    "paymentMethod": "bank-transfer",
    "description": null,
    "status": "partial",
    "paidAt": "2026-11-03T20:59:12.909Z",
    "receiptNumber": "TUI-1793739552907-Y91B",
    "receiptGenerated": false,
    "receiptSent": false,
    "paystackReference": null,
    "paystackChannel": null,
    "paymentUrl": null,
    "recordedBy": "t5_admin_1793739529508",
    "adminNotes": null,
    "createdAt": "2026-11-03T20:59:12.910Z",
    "updatedAt": "2026-11-03T20:59:12.910Z",
    "enrollment": {
      "student": {
        "firstName": "Ada",
        "lastName": "Placeholder",
        "email": "t5stu1793739529508@example.com"
      }
    }
  },
  "summary": {
    "mode": "legacy",
    "expectedTotal": 50000,
    "paid": 20000,
    "outstanding": 30000
  },
  "message": "Tuition payment recorded successfully"
}
```
**GET `/api/admin/enrollments/<enrollmentId>/tuition`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/15-legacy-ledger.json`):
```json
{
  "mode": "legacy",
  "enrollment": {
    "id": "t5_e4_1793739529508",
    "status": "enrolled",
    "applicationPaid": true,
    "selectedMode": "On-site",
    "ratePerClass": null,
    "plannedClasses": null,
    "durationMins": null
  },
  "charges": [],
  "payments": [
    {
      "id": "cmw167szx001b073m10vhetzj",
      "enrollmentId": "t5_e4_1793739529508",
      "amount": 20000,
      "currency": "NGN",
      "paymentMethod": "bank-transfer",
      "description": null,
      "status": "partial",
      "paidAt": "2026-11-03T20:59:12.909Z",
      "receiptNumber": "TUI-1793739552907-Y91B",
      "receiptGenerated": false,
      "receiptSent": false,
      "paystackReference": null,
      "paystackChannel": null,
      "paymentUrl": null,
      "recordedBy": "t5_admin_1793739529508",
      "adminNotes": null,
      "createdAt": "2026-11-03T20:59:12.910Z",
      "updatedAt": "2026-11-03T20:59:12.910Z"
    }
  ],
  "summary": {
    "mode": "legacy",
    "expectedTotal": 50000,
    "paid": 20000,
    "outstanding": 30000
  }
}
```
### Receipt (point-in-time)
This is the receipt of the **first** payment (₦20,000) fetched **after** a top-up, a second payment and a void: it still shows what stood at the time.

**GET `/api/admin/tuition-payments/<id>/receipt`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/09-receipt-first-payment.json`):
```json
{
  "receiptData": {
    "receiptNumber": "TUI-1793739529957-00S9",
    "enrollment": {
      "id": "t5_e1_1793739529508",
      "firstName": "Ada",
      "lastName": "Placeholder",
      "email": "t5stu1793739529508@example.com"
    },
    "course": {
      "title": "T5 Guitar",
      "instrument": "Guitar",
      "level": "Beginner"
    },
    "payment": {
      "amount": 20000,
      "paidAt": "2026-11-03T20:58:49.960Z",
      "description": "First part",
      "paymentMethod": "cash"
    },
    "totalPaid": 20000,
    "remainingBalance": 24500,
    "paymentType": "partial",
    "ledger": {
      "lines": [
        {
          "kind": "CLASSES",
          "description": "10 x 60-minute classes",
          "quantity": 10,
          "unitPrice": 4000,
          "amount": 40000
        },
        {
          "kind": "MATERIAL",
          "description": "Theory workbook",
          "quantity": 1,
          "unitPrice": 3000,
          "amount": 3000
        },
        {
          "kind": "MATERIAL",
          "description": "Metronome",
          "quantity": 1,
          "unitPrice": 1500,
          "amount": 1500
        }
      ],
      "materialsTotal": 4500,
      "totalCharged": 44500,
      "classesPurchased": 10,
      "classesCovered": 3,
      "credit": 0
    }
  },
  "message": "Receipt data retrieved successfully"
}
```
`GET …/receipt?download=true` returns the PDF (`application/pdf`, starts `%PDF`, verified live). `POST …/receipt` re-sends the email (student copy + admin copy); **email delivery is not verified** (Resend key is a placeholder).

### Payments dashboard
**GET `/api/admin/payments?locationId=t5_loc_1793739529508&method=cash`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/18-dashboard-filter-cash.json`):
```json
{
  "payments": [
    {
      "id": "cmw167t0v001e073m70wro64a",
      "enrollmentId": "t5_e4_1793739529508",
      "amount": 90000,
      "status": "completed",
      "method": "cash",
      "channel": null,
      "reference": null,
      "receiptNumber": "TUI-1793739552941-8OAI",
      "description": null,
      "paidAt": "2026-11-03T20:59:12.943Z",
      "createdAt": "2026-11-03T20:59:12.943Z",
      "paymentUrl": null,
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508"
    },
    {
      "id": "cmw167bag000b073more8aoma",
      "enrollmentId": "t5_e1_1793739529508",
      "amount": 20000,
      "status": "completed",
      "method": "cash",
      "channel": null,
      "reference": null,
      "receiptNumber": "TUI-1793739529957-00S9",
      "description": "First part",
      "paidAt": "2026-11-03T20:58:49.960Z",
      "createdAt": "2026-11-03T20:58:49.960Z",
      "paymentUrl": null,
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508"
    }
  ],
  "outstanding": [
    {
      "enrollmentId": "t5_e6_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "mode": "ledger",
      "charged": 10000,
      "paid": 7000,
      "outstanding": 3000,
      "classesCovered": 1,
      "classesPurchased": 2,
      "lastPaymentAt": "2026-11-03T20:59:13.244Z"
    }
  ],
  "credits": [
    {
      "enrollmentId": "t5_e3_1793739529508",
      "enrollmentStatus": "cancelled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "cancelled",
      "charged": null,
      "paid": 5000,
      "credit": 5000
    },
    {
      "enrollmentId": "t5_e5_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "overpaid",
      "charged": 10000,
      "paid": 12000,
      "credit": 2000
    },
    {
      "enrollmentId": "t5_e1_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "overpaid",
      "charged": 52500,
      "paid": 54500,
      "credit": 2000
    }
  ],
  "totals": {
    "collected": 110000,
    "pendingOnline": 0,
    "outstanding": 3000,
    "credit": 9000
  },
  "truncated": {
    "payments": false,
    "outstanding": false,
    "outstandingScan": false,
    "credits": false
  }
}
```
**GET `/api/admin/payments?locationId=t5_loc_1793739529508`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/19-dashboard-all.json`):
```json
{
  "payments": [
    {
      "id": "t5_p3_1793739529508",
      "enrollmentId": "t5_e3_1793739529508",
      "amount": 5000,
      "status": "completed",
      "method": "paystack",
      "channel": "card",
      "reference": "t5_ref_cancelled_1793739529508",
      "receiptNumber": "TUI-t5-1793739529508",
      "description": null,
      "paidAt": "2026-11-03T20:59:12.226Z",
      "createdAt": "2026-11-03T21:59:12.197Z",
      "paymentUrl": null,
      "enrollmentStatus": "cancelled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508"
    },
    {
      "id": "cmw167t6p001m073mzktu8g6i",
      "enrollmentId": "t5_e6_1793739529508",
      "amount": 7000,
      "status": "completed",
      "method": "paystack",
      "channel": "card",
      "reference": "tuition_1793739553150_poduxu",
      "receiptNumber": "TUI-1793739553152-B3IF",
      "description": "Online tuition payment",
      "paidAt": "2026-11-03T20:59:13.244Z",
      "createdAt": "2026-11-03T20:59:13.153Z",
      "paymentUrl": null,
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508"
    }
  ],
  "outstanding": [
    {
      "enrollmentId": "t5_e6_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "mode": "ledger",
      "charged": 10000,
      "paid": 7000,
      "outstanding": 3000,
      "classesCovered": 1,
      "classesPurchased": 2,
      "lastPaymentAt": "2026-11-03T20:59:13.244Z"
    }
  ],
  "credits": [
    {
      "enrollmentId": "t5_e3_1793739529508",
      "enrollmentStatus": "cancelled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "cancelled",
      "charged": null,
      "paid": 5000,
      "credit": 5000
    },
    {
      "enrollmentId": "t5_e5_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "overpaid",
      "charged": 10000,
      "paid": 12000,
      "credit": 2000
    },
    {
      "enrollmentId": "t5_e1_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "overpaid",
      "charged": 52500,
      "paid": 54500,
      "credit": 2000
    }
  ],
  "totals": {
    "collected": 208500,
    "pendingOnline": 0,
    "outstanding": 3000,
    "credit": 9000
  },
  "truncated": {
    "payments": false,
    "outstanding": false,
    "outstandingScan": false,
    "credits": false
  }
}
```
(Lists trimmed for length. `truncated.<list>` flips to `true` when a list hits its 500-row cap; `truncated.outstandingScan` is `true` when more than 5,000 enrollments exist and the outstanding/credit totals are a lower bound.)

Credits (paid beyond what is owed, or paid on a cancelled enrollment):

**GET `/api/admin/payments?locationId=t5_loc_1793739529508`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/21-dashboard-credits.json`):
```json
{
  "payments": [
    {
      "id": "t5_p3_1793739529508",
      "enrollmentId": "t5_e3_1793739529508",
      "amount": 5000,
      "status": "completed",
      "method": "paystack",
      "channel": "card",
      "reference": "t5_ref_cancelled_1793739529508",
      "receiptNumber": "TUI-t5-1793739529508",
      "description": null,
      "paidAt": "2026-11-03T20:59:12.226Z",
      "createdAt": "2026-11-03T21:59:12.197Z",
      "paymentUrl": null,
      "enrollmentStatus": "cancelled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508"
    }
  ],
  "outstanding": [
    {
      "enrollmentId": "t5_e16_1793739529508",
      "enrollmentStatus": "plan_agreed",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "mode": "ledger",
      "charged": 40000,
      "paid": 0,
      "outstanding": 40000,
      "classesCovered": 0,
      "classesPurchased": 8,
      "lastPaymentAt": null
    }
  ],
  "credits": [
    {
      "enrollmentId": "t5_e15_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "overpaid",
      "charged": 40000,
      "paid": 80000,
      "credit": 40000
    },
    {
      "enrollmentId": "t5_e14_1793739529508",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "overpaid",
      "charged": 10000,
      "paid": 20000,
      "credit": 10000
    },
    {
      "enrollmentId": "t5_e3_1793739529508",
      "enrollmentStatus": "cancelled",
      "student": "Ada Placeholder",
      "email": "t5stu1793739529508@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793739529508",
      "reason": "cancelled",
      "charged": null,
      "paid": 5000,
      "credit": 5000
    }
  ],
  "totals": {
    "collected": 318500,
    "pendingOnline": 44000,
    "outstanding": 77500,
    "credit": 59000
  },
  "truncated": {
    "payments": false,
    "outstanding": false,
    "outstandingScan": false,
    "credits": false
  }
}
```
## Webhook (for operators, not the FE)
`POST /api/webhooks/paystack` with `x-paystack-signature`. Tuition is recognised by looking the **reference** up in `tuition_payments`; metadata is only cross-checked. Verified on the mock: success, replay, 3 concurrent, amount mismatch, foreign currency, wrong metadata, unknown reference, late payment on a cancelled enrollment, `charge.failed` after success, failed-then-paid. Audit actions: `tuition.online_paid`, `enrollment.enrolled_by_tuition`, `tuition.amount_mismatch`, `tuition.metadata_mismatch`, `tuition.paid_unexpected_state`, `tuition.overpayment`, `tuition.dispute`, `payment.unmatched_reference`.

## Verification table
| Section | Status |
|---|---|
| Plan agree / edit creates and voids charges | verified-live (mock harness) |
| Ledger GET, summary shapes (ledger + legacy) | verified-live |
| Manual record: partial, overpayment guard, method/amount validation | verified-live |
| Payment link: create, default amount, over-balance, reuse, legacy refusal, cancel | verified-live (Paystack = local mock) |
| Webhook settle, replay, concurrent, mismatches, cancelled, failed→paid, unknown ref | verified-live (Paystack = local mock) |
| Top-up at today's rate, void, duplicate material, inactive material | verified-live |
| Point-in-time receipt data + PDF download | verified-live |
| Dashboard filters, outstanding list, credits list, 401s | verified-live |
| Open-link cap (40,000 + 40,000 refused; partial headroom; cancel frees room; cancelled link paid anyway; stale/fresh URL-less rows) | verified-live (Paystack = local mock) |
| `refund.processed` flagged (audit; balance unchanged), dispute audited | verified-live with the payload shape from Paystack's docs; **not seen from a real account** |
| Admin alert emails (mismatch, cancelled, overpayment, refund, dispute) | **send path exercised, delivery NOT verified** (placeholder `RESEND_API_KEY`) |
| **Real Paystack checkout, real `authorization_url`, real webhook signature from Paystack** | **NOT verified** (John's keys) |
| **Email delivery of receipts (student + admin copy)** | **NOT verified** (placeholder `RESEND_API_KEY`) |
| Admin UI screens | see `docs/sop/per-class-tuition.md` verification table |
