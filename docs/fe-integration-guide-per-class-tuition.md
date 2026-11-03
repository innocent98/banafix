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
- **A payment link cannot exceed the outstanding balance**; to take money for more classes, add a charge (top-up) first.
- **A payment above the outstanding balance needs an explicit confirmation** (`allowOverpayment: true`); show the credit it creates.
- A stale pending link that is paid after the balance was cleared **records the money as credit** and is not refused.
- A payment arriving for a **cancelled** enrolment is recorded but gets **no receipt**; the dashboard shows the enrollment status so an admin can act. Refunds are not handled (John's policy).
- Receipt PDFs print amounts as `NGN 20,000` (the PDF font has no ₦); emails and the UI use ₦.
- Pending links older than ~10 minutes are not reused; creating a link twice quickly returns the same link (`reused: true`).

## Endpoints

### Plan agreed (creates the charges)
**POST `/api/admin/enrollments/<enrollmentId>/plan`** → **200**

Request body:
```json
{
  "offeringId": "t5_off_1793722161679",
  "durationMins": 60,
  "classesPerWeek": 2,
  "plannedClasses": 8,
  "materialIds": [
    "t5_mato_1793722161679"
  ]
}
```
Response (captured `docs/captures/stream5/01-plan-agree.json`):
```json
{
  "enrollment": {
    "id": "t5_e1_1793722161679",
    "courseId": "t5_course_1793722161679",
    "studentId": "t5_stu_1793722161679",
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
    "locationId": "t5_loc_1793722161679",
    "offeringId": "t5_off_1793722161679",
    "durationMins": 60,
    "classesPerWeek": 2,
    "plannedClasses": 8,
    "ratePerClass": 4000,
    "couponCode": null,
    "waitlistNotes": null,
    "createdAt": "2026-11-03T17:09:21.929Z",
    "updatedAt": "2026-11-03T16:09:21.968Z"
  }
}
```
Editing the plan (voids the old PLAN charges, recreates them):

**POST `/api/admin/enrollments/<enrollmentId>/plan`** → **200**

Request body:
```json
{
  "offeringId": "t5_off_1793722161679",
  "durationMins": 60,
  "classesPerWeek": 2,
  "plannedClasses": 10,
  "materialIds": [
    "t5_mato_1793722161679"
  ]
}
```
Response (captured `docs/captures/stream5/02-plan-edit.json`):
```json
{
  "enrollment": {
    "id": "t5_e1_1793722161679",
    "courseId": "t5_course_1793722161679",
    "studentId": "t5_stu_1793722161679",
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
    "locationId": "t5_loc_1793722161679",
    "offeringId": "t5_off_1793722161679",
    "durationMins": 60,
    "classesPerWeek": 2,
    "plannedClasses": 10,
    "ratePerClass": 4000,
    "couponCode": null,
    "waitlistNotes": null,
    "createdAt": "2026-11-03T17:09:21.929Z",
    "updatedAt": "2026-11-03T16:09:22.098Z"
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
    "id": "t5_e1_1793722161679",
    "status": "plan_agreed",
    "applicationPaid": true,
    "selectedMode": "T5 Mode",
    "ratePerClass": 4000,
    "plannedClasses": 10,
    "durationMins": 60
  },
  "charges": [
    {
      "id": "cmw0vv229000c07kn80vyuwwn",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 8,
      "unitPrice": 4000,
      "description": "8 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:21.970Z",
      "voidedAt": "2026-11-03T16:09:22.098Z",
      "voidedBy": "t5_admin_1793722161679",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw0vv229000d07knue7s80w6",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:21.970Z",
      "voidedAt": "2026-11-03T16:09:22.098Z",
      "voidedBy": "t5_admin_1793722161679",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw0vv229000e07knp5gf683a",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:21.970Z",
      "voidedAt": "2026-11-03T16:09:22.098Z",
      "voidedBy": "t5_admin_1793722161679",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw0vv25v000h07kni8yno1cd",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 10,
      "unitPrice": 4000,
      "description": "10 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:22.099Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw0vv25v000i07knu61w3jba",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:22.099Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw0vv25v000j07knaf8ibta1",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:22.099Z",
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
    "id": "cmw0vv27t000n07knpoucgumf",
    "enrollmentId": "t5_e1_1793722161679",
    "amount": 20000,
    "currency": "NGN",
    "paymentMethod": "cash",
    "description": "First part",
    "status": "completed",
    "paidAt": "2026-11-03T16:09:22.169Z",
    "receiptNumber": "TUI-1793722162166-35EH",
    "receiptGenerated": false,
    "receiptSent": false,
    "paystackReference": null,
    "paystackChannel": null,
    "paymentUrl": null,
    "recordedBy": "t5_admin_1793722161679",
    "adminNotes": null,
    "createdAt": "2026-11-03T16:09:22.170Z",
    "updatedAt": "2026-11-03T16:09:22.170Z",
    "enrollment": {
      "student": {
        "firstName": "Ada",
        "lastName": "Placeholder",
        "email": "t5stu1793722161679@example.com"
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
    "id": "cmw0vv4qe001s07knn0lo7yq0",
    "enrollmentId": "t5_e5_1793722161679",
    "amount": 12000,
    "currency": "NGN",
    "paymentMethod": "pos",
    "description": null,
    "status": "completed",
    "paidAt": "2026-11-03T16:09:25.430Z",
    "receiptNumber": "TUI-1793722165428-DEFQ",
    "receiptGenerated": false,
    "receiptSent": false,
    "paystackReference": null,
    "paystackChannel": null,
    "paymentUrl": null,
    "recordedBy": "t5_admin_1793722161679",
    "adminNotes": null,
    "createdAt": "2026-11-03T16:09:25.431Z",
    "updatedAt": "2026-11-03T16:09:25.431Z",
    "enrollment": {
      "student": {
        "firstName": "Ada",
        "lastName": "Placeholder",
        "email": "t5stu1793722161679@example.com"
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
    "id": "cmw0vv2az000r07knb9wtdpgu",
    "amount": 24500,
    "paymentUrl": "http://127.0.0.1:4010/pay/tuition_1793722162281_z5e3gu",
    "reference": "tuition_1793722162281_z5e3gu"
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
    "id": "t5_e1_1793722161679",
    "status": "enrolled",
    "applicationPaid": true,
    "selectedMode": "T5 Mode",
    "ratePerClass": 4000,
    "plannedClasses": 10,
    "durationMins": 60
  },
  "charges": [
    {
      "id": "cmw0vv229000c07kn80vyuwwn",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 8,
      "unitPrice": 4000,
      "description": "8 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:21.970Z",
      "voidedAt": "2026-11-03T16:09:22.098Z",
      "voidedBy": "t5_admin_1793722161679",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw0vv229000d07knue7s80w6",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:21.970Z",
      "voidedAt": "2026-11-03T16:09:22.098Z",
      "voidedBy": "t5_admin_1793722161679",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw0vv229000e07knp5gf683a",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:21.970Z",
      "voidedAt": "2026-11-03T16:09:22.098Z",
      "voidedBy": "t5_admin_1793722161679",
      "voidReason": "Plan edited"
    },
    {
      "id": "cmw0vv25v000h07kni8yno1cd",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "CLASSES",
      "origin": "PLAN",
      "quantity": 10,
      "unitPrice": 4000,
      "description": "10 x 60-minute classes",
      "materialId": null,
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:22.099Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw0vv25v000i07knu61w3jba",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 3000,
      "description": "Theory workbook",
      "materialId": "t5_matr_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:22.099Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    },
    {
      "id": "cmw0vv25v000j07knaf8ibta1",
      "enrollmentId": "t5_e1_1793722161679",
      "kind": "MATERIAL",
      "origin": "PLAN",
      "quantity": 1,
      "unitPrice": 1500,
      "description": "Metronome",
      "materialId": "t5_mato_1793722161679",
      "createdBy": "t5_admin_1793722161679",
      "createdAt": "2026-11-03T16:09:22.099Z",
      "voidedAt": null,
      "voidedBy": null,
      "voidReason": null
    }
  ],
  "payments": [
    {
      "id": "cmw0vv2ce000u07knvf6fnq49",
      "enrollmentId": "t5_e1_1793722161679",
      "amount": 10000,
      "currency": "NGN",
      "paymentMethod": "paystack",
      "description": "Online tuition payment",
      "status": "pending",
      "paidAt": null,
      "receiptNumber": "TUI-1793722162334-GGXX",
      "receiptGenerated": false,
      "receiptSent": false,
      "paystackReference": "tuition_1793722162332_k5yusa",
      "paystackChannel": null,
      "paymentUrl": "http://127.0.0.1:4010/pay/tuition_1793722162332_k5yusa",
      "recordedBy": "t5_admin_1793722161679",
      "adminNotes": null,
      "createdAt": "2026-11-03T16:09:22.334Z",
      "updatedAt": "2026-11-03T16:09:22.336Z"
    },
    {
      "id": "cmw0vv2az000r07knb9wtdpgu",
      "enrollmentId": "t5_e1_1793722161679",
      "amount": 24500,
      "currency": "NGN",
      "paymentMethod": "paystack",
      "description": "Online tuition payment",
      "status": "completed",
      "paidAt": "2026-11-03T16:09:22.346Z",
      "receiptNumber": "TUI-1793722162283-O3VV",
      "receiptGenerated": true,
      "receiptSent": false,
      "paystackReference": "tuition_1793722162281_z5e3gu",
      "paystackChannel": "card",
      "paymentUrl": null,
      "recordedBy": "t5_admin_1793722161679",
      "adminNotes": null,
      "createdAt": "2026-11-03T16:09:22.283Z",
      "updatedAt": "2026-11-03T16:09:22.717Z"
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
    "id": "cmw0vv4fz001f07kndw379pbi",
    "enrollmentId": "t5_e1_1793722161679",
    "kind": "CLASSES",
    "origin": "ADJUSTMENT",
    "quantity": 2,
    "unitPrice": 4000,
    "description": "2 x 60-minute classes (top-up)",
    "materialId": null,
    "createdBy": "t5_admin_1793722161679",
    "createdAt": "2026-11-03T16:09:25.055Z",
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
    "id": "cmw0vv4hc001i07kn6m9e8urm",
    "enrollmentId": "t5_e1_1793722161679",
    "kind": "CLASSES",
    "origin": "ADJUSTMENT",
    "quantity": 1,
    "unitPrice": 5000,
    "description": "1 x 60-minute classes (top-up)",
    "materialId": null,
    "createdBy": "t5_admin_1793722161679",
    "createdAt": "2026-11-03T16:09:25.105Z",
    "voidedAt": "2026-11-03T16:09:25.192Z",
    "voidedBy": "t5_admin_1793722161679",
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
    "id": "cmw0vv4m5001m07knmt2wbozm",
    "enrollmentId": "t5_e4_1793722161679",
    "amount": 20000,
    "currency": "NGN",
    "paymentMethod": "bank-transfer",
    "description": null,
    "status": "partial",
    "paidAt": "2026-11-03T16:09:25.277Z",
    "receiptNumber": "TUI-1793722165273-KVWY",
    "receiptGenerated": false,
    "receiptSent": false,
    "paystackReference": null,
    "paystackChannel": null,
    "paymentUrl": null,
    "recordedBy": "t5_admin_1793722161679",
    "adminNotes": null,
    "createdAt": "2026-11-03T16:09:25.278Z",
    "updatedAt": "2026-11-03T16:09:25.278Z",
    "enrollment": {
      "student": {
        "firstName": "Ada",
        "lastName": "Placeholder",
        "email": "t5stu1793722161679@example.com"
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
    "id": "t5_e4_1793722161679",
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
      "id": "cmw0vv4m5001m07knmt2wbozm",
      "enrollmentId": "t5_e4_1793722161679",
      "amount": 20000,
      "currency": "NGN",
      "paymentMethod": "bank-transfer",
      "description": null,
      "status": "partial",
      "paidAt": "2026-11-03T16:09:25.277Z",
      "receiptNumber": "TUI-1793722165273-KVWY",
      "receiptGenerated": false,
      "receiptSent": false,
      "paystackReference": null,
      "paystackChannel": null,
      "paymentUrl": null,
      "recordedBy": "t5_admin_1793722161679",
      "adminNotes": null,
      "createdAt": "2026-11-03T16:09:25.278Z",
      "updatedAt": "2026-11-03T16:09:25.278Z"
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
    "receiptNumber": "TUI-1793722162166-35EH",
    "enrollment": {
      "id": "t5_e1_1793722161679",
      "firstName": "Ada",
      "lastName": "Placeholder",
      "email": "t5stu1793722161679@example.com"
    },
    "course": {
      "title": "T5 Guitar",
      "instrument": "Guitar",
      "level": "Beginner"
    },
    "payment": {
      "amount": 20000,
      "paidAt": "2026-11-03T16:09:22.169Z",
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
**GET `/api/admin/payments?locationId=t5_loc_1793722161679&method=cash`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/18-dashboard-filter-cash.json`):
```json
{
  "payments": [
    {
      "id": "cmw0vv4nk001p07knq3fnx5xl",
      "enrollmentId": "t5_e4_1793722161679",
      "amount": 90000,
      "status": "completed",
      "method": "cash",
      "channel": null,
      "reference": null,
      "receiptNumber": "TUI-1793722165323-ZLFD",
      "description": null,
      "paidAt": "2026-11-03T16:09:25.328Z",
      "createdAt": "2026-11-03T16:09:25.329Z",
      "paymentUrl": null,
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793722161679@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793722161679"
    },
    {
      "id": "cmw0vv27t000n07knpoucgumf",
      "enrollmentId": "t5_e1_1793722161679",
      "amount": 20000,
      "status": "completed",
      "method": "cash",
      "channel": null,
      "reference": null,
      "receiptNumber": "TUI-1793722162166-35EH",
      "description": "First part",
      "paidAt": "2026-11-03T16:09:22.169Z",
      "createdAt": "2026-11-03T16:09:22.170Z",
      "paymentUrl": null,
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793722161679@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793722161679"
    }
  ],
  "outstanding": [
    {
      "enrollmentId": "t5_e6_1793722161679",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793722161679@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793722161679",
      "mode": "ledger",
      "charged": 10000,
      "paid": 7000,
      "outstanding": 3000,
      "classesCovered": 1,
      "classesPurchased": 2,
      "lastPaymentAt": "2026-11-03T16:09:25.602Z"
    }
  ],
  "totals": {
    "collected": 110000,
    "pendingOnline": 0,
    "outstanding": 3000
  },
  "truncated": {
    "payments": false,
    "outstanding": false
  }
}
```
**GET `/api/admin/payments?locationId=t5_loc_1793722161679`** → **200**

Request body:
```json
(no body)
```
Response (captured `docs/captures/stream5/19-dashboard-all.json`):
```json
{
  "payments": [
    {
      "id": "t5_p3_1793722161679",
      "enrollmentId": "t5_e3_1793722161679",
      "amount": 5000,
      "status": "completed",
      "method": "paystack",
      "channel": "card",
      "reference": "t5_ref_cancelled_1793722161679",
      "receiptNumber": "TUI-t5-1793722161679",
      "description": null,
      "paidAt": "2026-11-03T16:09:24.904Z",
      "createdAt": "2026-11-03T17:09:24.867Z",
      "paymentUrl": null,
      "enrollmentStatus": "cancelled",
      "student": "Ada Placeholder",
      "email": "t5stu1793722161679@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793722161679"
    },
    {
      "id": "cmw0vv4t7001x07knzfssku6s",
      "enrollmentId": "t5_e6_1793722161679",
      "amount": 7000,
      "status": "completed",
      "method": "paystack",
      "channel": "card",
      "reference": "tuition_1793722165529_lxy752",
      "receiptNumber": "TUI-1793722165530-WDR5",
      "description": "Online tuition payment",
      "paidAt": "2026-11-03T16:09:25.602Z",
      "createdAt": "2026-11-03T16:09:25.531Z",
      "paymentUrl": null,
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793722161679@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793722161679"
    }
  ],
  "outstanding": [
    {
      "enrollmentId": "t5_e6_1793722161679",
      "enrollmentStatus": "enrolled",
      "student": "Ada Placeholder",
      "email": "t5stu1793722161679@example.com",
      "course": "T5 Guitar",
      "location": "T5 Loc 1793722161679",
      "mode": "ledger",
      "charged": 10000,
      "paid": 7000,
      "outstanding": 3000,
      "classesCovered": 1,
      "classesPurchased": 2,
      "lastPaymentAt": "2026-11-03T16:09:25.602Z"
    }
  ],
  "totals": {
    "collected": 213500,
    "pendingOnline": 0,
    "outstanding": 3000
  },
  "truncated": {
    "payments": false,
    "outstanding": false
  }
}
```
(Lists trimmed for length. `truncated` flips to `true` when a list hits its 500-row cap.)

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
| Dashboard filters, outstanding list, 401s | verified-live |
| **Real Paystack checkout, real `authorization_url`, real webhook signature from Paystack** | **NOT verified** (John's keys) |
| **Email delivery of receipts (student + admin copy)** | **NOT verified** (placeholder `RESEND_API_KEY`) |
| Admin UI screens | see `docs/sop/per-class-tuition.md` verification table |
