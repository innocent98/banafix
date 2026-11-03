/**
 * Stream 5 end-to-end harness: per-class tuition through the REAL admin routes and the REAL Paystack
 * webhook, against a LOCAL ephemeral Postgres and the local Paystack mock (scripts/mock-paystack.mjs).
 * It proves OUR handling of Paystack's responses, not Paystack itself (a real test charge needs John's keys).
 *
 *   node scripts/mock-paystack.mjs &
 *   DATABASE_URL=<ephemeral> JWT_SECRET=test_jwt_not_real PAYSTACK_SECRET_KEY=test_secret_not_real \
 *     PAYSTACK_BASE_URL=http://127.0.0.1:4010 NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
 *     RESEND_API_KEY=re_test_not_real npm run dev      # or `next start` after a build
 *   DATABASE_URL=<ephemeral> JWT_SECRET=test_jwt_not_real PAYSTACK_SECRET_KEY=test_secret_not_real \
 *     node scripts/test-tuition-e2e.mjs
 *
 * Writes captured request/response pairs to $CAPTURE_DIR (default docs/captures/stream5) for the docs.
 */
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import jwt from 'jsonwebtoken'

const base = process.env.WEBHOOK_TEST_URL || 'http://localhost:3000'
const mock = process.env.MOCK_PAYSTACK_URL || 'http://127.0.0.1:4010'
const secret = process.env.PAYSTACK_SECRET_KEY
const jwtSecret = process.env.JWT_SECRET
if (!secret || !jwtSecret) throw new Error('PAYSTACK_SECRET_KEY and JWT_SECRET must match the running app')
const captureDir = process.env.CAPTURE_DIR || 'docs/captures/stream5'
mkdirSync(captureDir, { recursive: true })

function psql(sql) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl || !dbUrl.includes('127.0.0.1')) throw new Error('needs a LOCAL DATABASE_URL (127.0.0.1); refusing to touch anything else')
  return execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { encoding: 'utf8' }).trim()
}
const num = (sql) => Number(psql(sql))

const t = Date.now()
const adminId = `t5_admin_${t}`
psql(`insert into admins (id,email,name,password,"updatedAt") values ('${adminId}','t5-${t}@example.com','T5 Admin','x',now())`)
const token = jwt.sign({ id: adminId, email: `t5-${t}@example.com`, name: 'T5 Admin' }, jwtSecret)

const captures = {}
async function api(method, path, body, { auth = true, name } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = text }
  if (name) captures[name] = { request: { method, path, body: body ?? null }, status: res.status, response: json }
  return { status: res.status, json }
}
const sign = (body) => crypto.createHmac('sha512', secret).update(body, 'utf8').digest('hex')
async function webhook(event, data) {
  const body = JSON.stringify({ event, data })
  const res = await fetch(`${base}/api/webhooks/paystack`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': sign(body) }, body })
  return res.status
}
const override = (ref, o) => fetch(`${mock}/__override/${encodeURIComponent(ref)}`, { method: 'POST', body: JSON.stringify(o) })
const audits = (id, action) => num(`select count(*) from audit_logs where "entityId"='${id}' and action='${action}'`)

const results = []
const check = (name, ok, extra) => { results.push(ok); console.log(`${ok ? '✅' : '❌'} ${name}${ok || extra === undefined ? '' : '  -> ' + JSON.stringify(extra)}`) }

// ───────────── fixtures ─────────────
const ids = {
  loc: `t5_loc_${t}`, mode: `t5_mode_${t}`, course: `t5_course_${t}`, offering: `t5_off_${t}`,
  matReq: `t5_matr_${t}`, matOpt: `t5_mato_${t}`, matOff: `t5_matx_${t}`, student: `t5_stu_${t}`,
}
psql(`insert into locations (id,name,slug,"assessmentFee","updatedAt") values ('${ids.loc}','T5 Loc ${t}','t5-${t}',5000,now())`)
psql(`insert into delivery_modes (id,name,"updatedAt") values ('${ids.mode}','T5 Mode ${t}',now())`)
psql(`insert into courses (id,title,instrument,level,"seatsLeft","totalSeats",pricing,"updatedAt") values ('${ids.course}','T5 Guitar','Guitar','Beginner',5,20,'{"On-site":50000}',now())`)
psql(`insert into course_offerings (id,"courseId","locationId","deliveryModeId","classesPerWeekOptions","isActive","updatedAt") values ('${ids.offering}','${ids.course}','${ids.loc}','${ids.mode}','{1,2}',true,now())`)
psql(`insert into offering_rates (id,"offeringId","durationMins","pricePerClass","updatedAt") values ('t5_r60_${t}','${ids.offering}',60,4000,now()),('t5_r45_${t}','${ids.offering}',45,3500,now())`)
psql(`insert into materials (id,"courseId",name,price,required,"isActive","updatedAt") values ('${ids.matReq}','${ids.course}','Theory workbook',3000,true,true,now()),('${ids.matOpt}','${ids.course}','Metronome',1500,false,true,now()),('${ids.matOff}','${ids.course}','Retired book',900,false,false,now())`)
psql(`insert into students (id,email,"firstName","lastName","updatedAt") values ('${ids.student}','t5stu${t}@example.com','Ada','Placeholder',now())`)

let seq = 0
function enrollment({ status, plan = true, mode = 'T5 Mode', paid = true }) {
  const id = `t5_e${++seq}_${t}`
  psql(
    `insert into enrollments (id,"courseId","studentId","locationId","offeringId","selectedMode",status,"applicationPaid"` +
      (plan ? `,"durationMins","classesPerWeek","plannedClasses","ratePerClass"` : '') +
      `,"updatedAt") values ('${id}','${ids.course}','${ids.student}','${ids.loc}','${ids.offering}','${mode}','${status}',${paid}` +
      (plan ? `,60,2,4,5000` : '') + `,now())`,
  )
  return id
}
const E1 = enrollment({ status: 'assessed', plan: false })

// ───────────── 1. plan agreement creates the charges ─────────────
let r = await api('POST', `/api/admin/enrollments/${E1}/plan`, { offeringId: ids.offering, durationMins: 60, classesPerWeek: 2, plannedClasses: 8, materialIds: [ids.matOpt] }, { name: '01-plan-agree' })
check('plan POST 200', r.status === 200, r)
check('3 charges: 8 x 4000 + required 3000 + optional 1500', num(`select count(*) from tuition_charges where "enrollmentId"='${E1}' and "voidedAt" is null`) === 3 && num(`select sum(quantity*"unitPrice") from tuition_charges where "enrollmentId"='${E1}' and "voidedAt" is null`) === 36500)
check('status plan_agreed + audit tuition.charges_created', psql(`select status from enrollments where id='${E1}'`) === 'plan_agreed' && audits(E1, 'tuition.charges_created') === 1)
r = await api('POST', `/api/admin/enrollments/${E1}/plan`, { offeringId: ids.offering, durationMins: 60, classesPerWeek: 2, plannedClasses: 8, materialIds: [ids.matOff] })
check('inactive material rejected (400)', r.status === 400, r)
r = await api('POST', `/api/admin/enrollments/${E1}/plan`, { offeringId: ids.offering, durationMins: 60, classesPerWeek: 2, plannedClasses: 10, materialIds: [ids.matOpt] }, { name: '02-plan-edit' })
check('plan edit 200: old PLAN charges voided, 3 new active, total 44500', r.status === 200 && num(`select count(*) from tuition_charges where "enrollmentId"='${E1}' and "voidedAt" is not null`) === 3 && num(`select sum(quantity*"unitPrice") from tuition_charges where "enrollmentId"='${E1}' and "voidedAt" is null`) === 44500, r)
r = await api('GET', `/api/admin/enrollments/${E1}/tuition`, undefined, { name: '03-ledger-before-payment' })
check('GET tuition: ledger mode, charged 44500, outstanding 44500', r.json.mode === 'ledger' && r.json.summary.charged === 44500 && r.json.summary.outstanding === 44500, r.json.summary)

// ───────────── 2. manual payments (partial) ─────────────
r = await api('POST', `/api/admin/enrollments/${E1}/tuition`, { amount: 20000, paymentMethod: 'cash', description: 'First part', sendReceipt: false }, { name: '04-record-cash-partial' })
check('cash 20000 recorded (201), status completed', r.status === 201 && r.json.payment.status === 'completed', r)
check('plan_agreed -> enrolled (one audit row)', psql(`select status from enrollments where id='${E1}'`) === 'enrolled' && audits(E1, 'enrollment.enrolled_by_tuition') === 1)
check('summary: outstanding 24500, 3 classes covered', r.json.summary.outstanding === 24500 && r.json.summary.classesCovered === 3, r.json.summary)
const firstPaymentId = r.json.payment.id
r = await api('POST', `/api/admin/enrollments/${E1}/tuition`, { amount: 30000, paymentMethod: 'cash', sendReceipt: false }, { name: '05-overpayment-rejected' })
check('amount above the balance rejected (400) without confirmation', r.status === 400 && /exceeds the outstanding balance/.test(r.json.error), r)
for (const [label, body] of [['paystack method', { amount: 100, paymentMethod: 'paystack' }], ['installment method', { amount: 100, paymentMethod: 'installment' }], ['fractional', { amount: 1.5, paymentMethod: 'cash' }], ['zero', { amount: 0, paymentMethod: 'cash' }], ['negative', { amount: -5, paymentMethod: 'cash' }]]) {
  r = await api('POST', `/api/admin/enrollments/${E1}/tuition`, body)
  check(`manual route rejects ${label} (400)`, r.status === 400, r)
}
check('no payment row was created by the rejected calls', num(`select count(*) from tuition_payments where "enrollmentId"='${E1}'`) === 1)

// ───────────── 3. online link -> webhook ─────────────
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/payment-link`, {}, { name: '06-payment-link-default-amount' })
check('payment link 201, default = outstanding 24500', r.status === 201 && r.json.payment.amount === 24500 && String(r.json.payment.paymentUrl).startsWith(mock), r)
const link1 = r.json.payment
check('pending row with reference + url stored', psql(`select status||':'||"paymentMethod"||':'||(("paystackReference" is not null)::text)||':'||(("paymentUrl" is not null)::text) from tuition_payments where id='${link1.id}'`) === 'pending:paystack:true:true')
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/payment-link`, {})
check('second click reuses the same pending link', r.status === 200 && r.json.reused === true && r.json.payment.id === link1.id, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/payment-link`, { amount: 24501 }, { name: '07-payment-link-over-balance' })
check('link above the balance rejected (400)', r.status === 400, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/payment-link`, { amount: 10000 }, { name: '07b-second-link-while-one-is-open' })
check('a second link while the first covers the whole balance is refused (409)', r.status === 409 && /already cover/.test(r.json.error), r)
r = await api('POST', `/api/admin/tuition-payments/${link1.id}/cancel`, {})
check('cancel the first link (200)', r.status === 200, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/payment-link`, { amount: 10000 })
check('link for a chosen amount 10000 (201)', r.status === 201 && r.json.payment.amount === 10000, r)
const link2 = r.json.payment
check('pending links are not counted in the balance', (await api('GET', `/api/admin/enrollments/${E1}/tuition`)).json.summary.paid === 20000)

check('webhook charge.success accepted (200)', (await webhook('charge.success', { reference: link1.reference })) === 200)
check('link1 completed, method paystack, enrollment still enrolled', psql(`select status||':'||"paymentMethod" from tuition_payments where id='${link1.id}'`) === 'completed:paystack' && psql(`select status from enrollments where id='${E1}'`) === 'enrolled')
check('exactly one tuition.online_paid audit row', audits(link1.id, 'tuition.online_paid') === 1)
r = await api('GET', `/api/admin/enrollments/${E1}/tuition`, undefined, { name: '08-ledger-after-online-payment' })
check('balance now 0, 10 classes covered', r.json.summary.outstanding === 0 && r.json.summary.paid === 44500 && r.json.summary.classesCovered === 10, r.json.summary)
check('REPLAY accepted (200)', (await webhook('charge.success', { reference: link1.reference })) === 200)
check('replay: still one audit row, one completed payment', audits(link1.id, 'tuition.online_paid') === 1 && num(`select sum(amount) from tuition_payments where "enrollmentId"='${E1}' and status='completed'`) === 44500)

const conc = await Promise.all([1, 2, 3].map(() => webhook('charge.success', { reference: link2.reference })))
check('3 CONCURRENT deliveries all answered 200', conc.every((c) => c === 200), conc)
check('concurrent: settled exactly once (one audit row, one credit audit)', audits(link2.id, 'tuition.online_paid') === 1 && audits(E1, 'tuition.overpayment') === 1)
r = await api('GET', `/api/admin/enrollments/${E1}/tuition`)
check('paying a stale link after settlement shows credit 10000, outstanding stays 0', r.json.summary.credit === 10000 && r.json.summary.outstanding === 0, r.json.summary)

// ───────────── 4. receipts are point-in-time ─────────────
r = await api('GET', `/api/admin/tuition-payments/${firstPaymentId}/receipt`, undefined, { name: '09-receipt-first-payment' })
check('receipt of the FIRST payment still shows balance 24500 and 3 classes covered', r.status === 200 && r.json.receiptData.remainingBalance === 24500 && r.json.receiptData.ledger?.classesCovered === 3 && r.json.receiptData.totalPaid === 20000, r.json.receiptData)
const pdf = await fetch(`${base}/api/admin/tuition-payments/${firstPaymentId}/receipt?download=true`, { headers: { Authorization: `Bearer ${token}` } })
check('receipt PDF downloads (application/pdf, %PDF)', pdf.status === 200 && pdf.headers.get('content-type') === 'application/pdf' && (await pdf.arrayBuffer()).byteLength > 1000)

// ───────────── 5. webhook hardening on a second enrollment ─────────────
const E2 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c2_${t}','${E2}','CLASSES','PLAN',4,5000,'4 x 60-minute classes')`)
r = await api('POST', `/api/admin/enrollments/${E2}/tuition/payment-link`, { amount: 15000 }, { name: '10-payment-link-e2' })
const l2 = r.json.payment
await override(l2.reference, { amount: 1000000 }) // Paystack says ₦10,000 was charged; we asked for ₦15,000
check('amount MISMATCH answered 200', (await webhook('charge.success', { reference: l2.reference })) === 200)
check('amount MISMATCH: not settled (pending), enrollment still plan_agreed, audit row', psql(`select status from tuition_payments where id='${l2.id}'`) === 'pending' && psql(`select status from enrollments where id='${E2}'`) === 'plan_agreed' && audits(l2.id, 'tuition.amount_mismatch') === 1, { pay: psql(`select status from tuition_payments where id='${l2.id}'`), enr: psql(`select status from enrollments where id='${E2}'`), audit: audits(l2.id, 'tuition.amount_mismatch'), l2 })
await override(l2.reference, { amount: 1500000, currency: 'USD' })
await webhook('charge.success', { reference: l2.reference })
check('foreign currency not settled either', psql(`select status from tuition_payments where id='${l2.id}'`) === 'pending')

r = await api('POST', `/api/admin/enrollments/${E2}/tuition/payment-link`, { amount: 5000 })
const l3 = r.json.payment
await override(l3.reference, { metadata: { enrollment_id: 'some-other-enrollment', payment_type: 'tuition' } })
await webhook('charge.success', { reference: l3.reference })
check('METADATA mismatch: not settled + audit row', psql(`select status from tuition_payments where id='${l3.id}'`) === 'pending' && audits(l3.id, 'tuition.metadata_mismatch') === 1)

await override(l2.reference, { amount: 1500000 }) // now Paystack reports what we asked for
await webhook('charge.success', { reference: l2.reference })
check('correct charge settles: plan_agreed -> enrolled, one audit row', psql(`select status from tuition_payments where id='${l2.id}'`) === 'completed' && psql(`select status from enrollments where id='${E2}'`) === 'enrolled' && audits(l2.id, 'tuition.online_paid') === 1)
await webhook('charge.failed', { reference: l2.reference })
check('late charge.failed does not overwrite a completed payment', psql(`select status from tuition_payments where id='${l2.id}'`) === 'completed')

await override(l3.reference, { metadata: { enrollment_id: E2, payment_type: 'tuition', tuition_payment_id: l3.id } })
await webhook('charge.failed', { reference: l3.reference })
check('charge.failed moves a pending row to failed', psql(`select status from tuition_payments where id='${l3.id}'`) === 'failed')
await webhook('charge.success', { reference: l3.reference })
check('a later success on a failed row still settles (money fact wins)', psql(`select status from tuition_payments where id='${l3.id}'`) === 'completed' && audits(l3.id, 'tuition.online_paid') === 1)

const unknown = `t5_unknown_${t}`
await webhook('charge.success', { reference: unknown })
check('unknown reference leaves an audit trace', audits(unknown, 'payment.unmatched_reference') === 1)

// late payment on a cancelled enrollment (link row inserted directly: it was issued while plan_agreed)
const E3 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c3_${t}','${E3}','CLASSES','PLAN',4,5000,'4 classes')`)
const refCancelled = `t5_ref_cancelled_${t}`
psql(`insert into tuition_payments (id,"enrollmentId",amount,"paymentMethod",status,"receiptNumber","paystackReference","updatedAt") values ('t5_p3_${t}','${E3}',5000,'paystack','pending','TUI-t5-${t}','${refCancelled}',now())`)
psql(`update enrollments set status='cancelled' where id='${E3}'`)
await webhook('charge.success', { reference: refCancelled }) // mock default: 500000 kobo = ₦5,000
check('late payment on CANCELLED: money recorded, status stays cancelled', psql(`select status from tuition_payments where id='t5_p3_${t}'`) === 'completed' && psql(`select status from enrollments where id='${E3}'`) === 'cancelled')
check('late payment on CANCELLED: audit tuition.paid_unexpected_state, no enrolled audit', audits(`t5_p3_${t}`, 'tuition.paid_unexpected_state') === 1 && audits(E3, 'enrollment.enrolled_by_tuition') === 0)

// ───────────── 6. top-ups, voids ─────────────
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges`, { kind: 'CLASSES', quantity: 2 }, { name: '11-topup-at-current-rate' })
check('top-up 2 classes at the current 60-min rate 4000 (201)', r.status === 201 && r.json.charge.unitPrice === 4000 && r.json.charge.origin === 'ADJUSTMENT', r)
psql(`update offering_rates set "pricePerClass"=5000 where "offeringId"='${ids.offering}' and "durationMins"=60`)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges`, { kind: 'CLASSES', quantity: 1 })
const topUp2 = r.json.charge
check('later top-up uses TODAY\'s rate 5000; the earlier 4000 charge is untouched', r.status === 201 && topUp2.unitPrice === 5000 && num(`select count(*) from tuition_charges where "enrollmentId"='${E1}' and "unitPrice"=4000 and description like '%top-up%'`) === 1)
check('the plan snapshot on the enrollment is untouched by the rate edit (still 4000)', num(`select "ratePerClass" from enrollments where id='${E1}'`) === 4000)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges`, { kind: 'MATERIAL', materialId: ids.matOpt })
check('material already charged -> 409', r.status === 409, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges`, { kind: 'MATERIAL', materialId: ids.matOff })
check('inactive material -> 400', r.status === 400, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges`, { kind: 'CLASSES', quantity: 0 })
check('quantity 0 -> 400', r.status === 400, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges/${topUp2.id}/void`, {})
check('void without a reason -> 400', r.status === 400, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges/${topUp2.id}/void`, { reason: 'Student changed their mind' }, { name: '12-void-charge' })
check('void with reason 200, audited', r.status === 200 && audits(topUp2.id, 'tuition.charge_void') === 1, r)
r = await api('POST', `/api/admin/enrollments/${E1}/tuition/charges/${topUp2.id}/void`, { reason: 'again' })
check('voiding twice -> 409', r.status === 409, r)
r = await api('GET', `/api/admin/enrollments/${E1}/tuition`, undefined, { name: '13-ledger-after-topup-and-void' })
check('charged = 44500 + 8000 (voided 5000 excluded); outstanding 8000-... credit applied', r.json.summary.charged === 52500 && r.json.summary.paid === 54500 && r.json.summary.outstanding === 0 && r.json.summary.credit === 2000, r.json.summary)

// ───────────── 7. legacy enrollment: old behaviour untouched ─────────────
const E4 = enrollment({ status: 'enrolled', plan: false, mode: 'On-site' })
r = await api('POST', `/api/admin/enrollments/${E4}/tuition`, { amount: 20000, paymentMethod: 'bank-transfer', paymentType: 'partial', sendReceipt: false }, { name: '14-legacy-record-partial' })
check('legacy: payment recorded as partial (marker honoured)', r.status === 201 && r.json.payment.status === 'partial', r)
r = await api('GET', `/api/admin/enrollments/${E4}/tuition`, undefined, { name: '15-legacy-ledger' })
check('legacy: mode legacy, expected 50000 (Course.pricing), paid 20000, outstanding 30000', r.json.mode === 'legacy' && r.json.summary.expectedTotal === 50000 && r.json.summary.outstanding === 30000, r.json.summary)
check('legacy: no charge rows were created', num(`select count(*) from tuition_charges where "enrollmentId"='${E4}'`) === 0)
r = await api('POST', `/api/admin/enrollments/${E4}/tuition`, { amount: 90000, paymentMethod: 'cash', sendReceipt: false })
check('legacy: overpayment still accepted (old behaviour), outstanding clamps to 0', r.status === 201 && r.json.summary.outstanding === 0, r)
r = await api('POST', `/api/admin/enrollments/${E4}/tuition/payment-link`, {})
check('legacy: payment link refused (400)', r.status === 400, r)

// ───────────── 8. overpayment with confirmation, cancel link, auth, dashboard ─────────────
const E5 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c5_${t}','${E5}','CLASSES','PLAN',2,5000,'2 classes')`)
r = await api('POST', `/api/admin/enrollments/${E5}/tuition`, { amount: 12000, paymentMethod: 'pos', allowOverpayment: true, sendReceipt: false }, { name: '16-overpayment-confirmed' })
check('overpayment with allowOverpayment: recorded, credit 2000, audited', r.status === 201 && r.json.summary.credit === 2000 && audits(E5, 'tuition.overpayment') === 1, r)
const E6 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c6_${t}','${E6}','CLASSES','PLAN',2,5000,'2 classes')`)
r = await api('POST', `/api/admin/enrollments/${E6}/tuition/payment-link`, { amount: 7000 })
const l6 = r.json.payment
r = await api('POST', `/api/admin/tuition-payments/${l6.id}/cancel`, {}, { name: '17-cancel-link' })
check('pending link cancelled (200), audited', r.status === 200 && psql(`select status from tuition_payments where id='${l6.id}'`) === 'cancelled' && audits(l6.id, 'tuition.payment_cancel') === 1, r)
r = await api('POST', `/api/admin/tuition-payments/${l6.id}/cancel`, {})
check('cancelling a non-pending payment -> 400', r.status === 400, r)
await webhook('charge.success', { reference: l6.reference }) // mock verifies 700000 kobo as asked
check('money arriving on a cancelled LINK is still recorded', psql(`select status from tuition_payments where id='${l6.id}'`) === 'completed')

check('payment link without a token -> 401', (await api('POST', `/api/admin/enrollments/${E6}/tuition/payment-link`, {}, { auth: false })).status === 401)
check('dashboard without a token -> 401', (await api('GET', '/api/admin/payments', undefined, { auth: false })).status === 401)
check('record tuition without a token -> 401', (await api('POST', `/api/admin/enrollments/${E6}/tuition`, { amount: 100, paymentMethod: 'cash' }, { auth: false })).status === 401)
check('charges without a token -> 401', (await api('POST', `/api/admin/enrollments/${E1}/tuition/charges`, { kind: 'CLASSES', quantity: 1 }, { auth: false })).status === 401)

r = await api('GET', `/api/admin/payments?locationId=${ids.loc}&method=cash`, undefined, { name: '18-dashboard-filter-cash' })
check('dashboard: method filter returns only cash rows', r.status === 200 && r.json.payments.length >= 2 && r.json.payments.every((p) => p.method === 'cash'), r.json.payments?.map((p) => p.method))
r = await api('GET', `/api/admin/payments?locationId=${ids.loc}&method=paystack&status=pending`, undefined)
check('dashboard: status+method filter (pending online)', r.status === 200 && r.json.payments.every((p) => p.status === 'pending' && p.method === 'paystack'))
r = await api('GET', `/api/admin/payments?locationId=${ids.loc}`, undefined, { name: '19-dashboard-all' })
check('dashboard: outstanding list holds only enrollments that still owe', r.json.outstanding.every((o) => o.outstanding > 0), r.json.outstanding)
check('dashboard: E2 (settled) is not outstanding, E3 (cancelled) not listed', !r.json.outstanding.some((o) => o.enrollmentId === E2 || o.enrollmentId === E3))
check('dashboard: payment on the cancelled enrollment is visible with its status', r.json.payments.some((p) => p.enrollmentId === E3 && p.enrollmentStatus === 'cancelled'))
r = await api('GET', `/api/admin/payments?locationId=${ids.loc}&q=nobody-matches-this-zzz`)
check('dashboard: search with no match is empty, not an error', r.status === 200 && r.json.payments.length === 0)

// ───────────── 9. review fixes (Opus pass) ─────────────
// 9a. double submit: two concurrent full-balance payments, no overpayment confirmation -> exactly one wins
const E7 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c7_${t}','${E7}','CLASSES','PLAN',2,5000,'2 classes')`)
const race = await Promise.all([1, 2].map(() => api('POST', `/api/admin/enrollments/${E7}/tuition`, { amount: 10000, paymentMethod: 'cash', sendReceipt: false })))
check('double submit: exactly one of two concurrent full payments is recorded, the other refused (400)', race.filter((x) => x.status === 201).length === 1 && race.filter((x) => x.status === 400).length === 1, race.map((x) => x.status))
check('double submit: one payment row, no phantom credit', num(`select count(*) from tuition_payments where "enrollmentId"='${E7}'`) === 1 && audits(E7, 'tuition.overpayment') === 0)
// 9b. concurrent link creation for the same amount -> one link
const E8 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c8_${t}','${E8}','CLASSES','PLAN',2,5000,'2 classes')`)
const links = await Promise.all([1, 2, 3].map(() => api('POST', `/api/admin/enrollments/${E8}/tuition/payment-link`, { amount: 4000 })))
check('3 concurrent link clicks create ONE pending link (the others reuse it or are told it is in flight)', num(`select count(*) from tuition_payments where "enrollmentId"='${E8}' and status='pending'`) === 1 && links.filter((l) => l.status === 201).length === 1 && links.every((l) => [200, 201, 409].includes(l.status)), links.map((l) => l.status))
// 9c. cancelled link does not expose its URL
r = await api('GET', `/api/admin/enrollments/${E6}/tuition`)
check('GET tuition: a cancelled/completed link exposes no paymentUrl', r.json.payments.every((p) => p.status === 'pending' || p.paymentUrl === null))
r = await api('GET', `/api/admin/enrollments/${E8}/tuition`)
check('GET tuition: a pending link still exposes its paymentUrl', r.json.payments.some((p) => p.status === 'pending' && String(p.paymentUrl).startsWith(mock)))
// 9d. plan edit never double-charges a material already added as an adjustment
const E9 = enrollment({ status: 'assessed', plan: false })
await api('POST', `/api/admin/enrollments/${E9}/plan`, { offeringId: ids.offering, durationMins: 60, classesPerWeek: 1, plannedClasses: 4 })
r = await api('POST', `/api/admin/enrollments/${E9}/tuition/charges`, { kind: 'MATERIAL', materialId: ids.matOpt })
check('optional material added later as an adjustment (201)', r.status === 201, r)
await api('POST', `/api/admin/enrollments/${E9}/plan`, { offeringId: ids.offering, durationMins: 60, classesPerWeek: 1, plannedClasses: 4, materialIds: [ids.matOpt] })
check('plan edit with that material does not charge it twice', num(`select count(*) from tuition_charges where "enrollmentId"='${E9}' and "materialId"='${ids.matOpt}' and "voidedAt" is null`) === 1)
// 9e. input bounds: 400, never a 500
for (const [label, v] of [['3e9 classes', 3000000000], ['boolean', true], ['1001 classes', 1001], ['string 1e3', '1e3']]) {
  const E = enrollment({ status: 'assessed', plan: false })
  r = await api('POST', `/api/admin/enrollments/${E}/plan`, { offeringId: ids.offering, durationMins: 60, classesPerWeek: 1, plannedClasses: v })
  check(`plannedClasses ${label} -> 400 (not 500)`, r.status === 400, r)
}
// 9f. a charge cannot be added to a cancelled enrollment, and a payment cannot be recorded on one
r = await api('POST', `/api/admin/enrollments/${E3}/tuition/charges`, { kind: 'CLASSES', quantity: 1 })
check('charge on a cancelled enrollment refused (400)', r.status === 400, r)
r = await api('POST', `/api/admin/enrollments/${E3}/tuition`, { amount: 100, paymentMethod: 'cash', sendReceipt: false })
check('manual payment on a cancelled enrollment refused (400)', r.status === 400, r)
// 9g. overpayment by link settling after cash was recorded in the meantime is still flagged (current ledger)
const E10 = enrollment({ status: 'plan_agreed' })
psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('t5_c10_${t}','${E10}','CLASSES','PLAN',2,5000,'2 classes')`)
r = await api('POST', `/api/admin/enrollments/${E10}/tuition/payment-link`, {})
const l10 = r.json.payment
await api('POST', `/api/admin/enrollments/${E10}/tuition`, { amount: 10000, paymentMethod: 'cash', sendReceipt: false })
await webhook('charge.success', { reference: l10.reference })
check('link paid after cash filled the balance: credit audited from the CURRENT ledger', audits(E10, 'tuition.overpayment') === 1)

// ───────────── 10. independent-review fixes (open links, credit, refund event) ─────────────
const addCharge = (eid, qty, price, cid) => psql(`insert into tuition_charges (id,"enrollmentId",kind,origin,quantity,"unitPrice",description) values ('${cid}_${t}','${eid}','CLASSES','PLAN',${qty},${price},'${qty} classes')`)
// 10a. the 40,000 + 40,000 case: a second full link while one is open is refused, even after the 10-minute reuse window
const E11 = enrollment({ status: 'plan_agreed' })
addCharge(E11, 8, 5000, 't5_c11')
r = await api('POST', `/api/admin/enrollments/${E11}/tuition/payment-link`, {})
const lA = r.json.payment
check('two links: first full-balance link created (201)', r.status === 201 && lA.amount === 40000, r)
psql(`update tuition_payments set "createdAt"=(now() at time zone 'utc') - interval '11 minutes' where id='${lA.id}'`)
r = await api('POST', `/api/admin/enrollments/${E11}/tuition/payment-link`, { amount: 40000 }, { name: '20-second-link-refused' })
check('two links: a second 40,000 link 11 minutes later is REFUSED (409), not created', r.status === 409 && /already cover/.test(r.json.error) && num(`select count(*) from tuition_payments where "enrollmentId"='${E11}'`) === 1, r)
r = await api('POST', `/api/admin/enrollments/${E11}/tuition/payment-link`, {})
check('two links: a default-amount request with nothing left is 409 too (not a confusing 400)', r.status === 409, r)
// 10b. partial headroom
const E12 = enrollment({ status: 'plan_agreed' })
addCharge(E12, 8, 5000, 't5_c12')
r = await api('POST', `/api/admin/enrollments/${E12}/tuition/payment-link`, { amount: 25000 })
check('headroom: first link 25,000 of 40,000 (201)', r.status === 201, r)
r = await api('POST', `/api/admin/enrollments/${E12}/tuition/payment-link`, { amount: 16000 })
check('headroom: 16,000 refused (only 15,000 left)', r.status === 409 && /at most ₦15,000/.test(r.json.error), r)
r = await api('POST', `/api/admin/enrollments/${E12}/tuition/payment-link`, {})
check('headroom: the default amount is what the open links leave (15,000)', r.status === 201 && r.json.payment.amount === 15000, r)
// 10c. cancelling frees the headroom; a cancelled link paid anyway is still recorded, flagged, and the overpayment surfaces
r = await api('POST', `/api/admin/tuition-payments/${lA.id}/cancel`, {})
check('cancel the first full link (200)', r.status === 200, r)
r = await api('POST', `/api/admin/enrollments/${E11}/tuition/payment-link`, {})
const lB = r.json.payment
check('after cancelling, a new full link is allowed (201)', r.status === 201 && lB.amount === 40000, r)
await webhook('charge.success', { reference: lA.reference })
check('the CANCELLED link is paid anyway: money recorded + audit tuition.paid_on_cancelled_link', psql(`select status from tuition_payments where id='${lA.id}'`) === 'completed' && audits(lA.id, 'tuition.paid_on_cancelled_link') === 1)
await webhook('charge.success', { reference: lB.reference })
check('the second link is paid too: credit 40,000, overpayment audited', audits(E11, 'tuition.overpayment') === 1)
r = await api('GET', `/api/admin/payments?locationId=${ids.loc}`, undefined, { name: '21-dashboard-credits' })
const credit11 = r.json.credits.find((c) => c.enrollmentId === E11)
check('dashboard lists the credit (refund or apply)', credit11 && credit11.credit === 40000 && credit11.reason === 'overpaid' && r.json.totals.credit >= 40000, r.json.credits)
check('dashboard lists tuition paid on a CANCELLED enrollment as refund-needed', r.json.credits.some((c) => c.enrollmentId === E3 && c.reason === 'cancelled' && c.credit === 5000))
check('truncation flags are booleans and the scan is not truncated here', typeof r.json.truncated.outstanding === 'boolean' && r.json.truncated.outstandingScan === false)
// 10d. a link row that never got its URL
const E13 = enrollment({ status: 'plan_agreed' })
addCharge(E13, 2, 5000, 't5_c13')
psql(`insert into tuition_payments (id,"enrollmentId",amount,"paymentMethod",status,"receiptNumber","paystackReference","updatedAt") values ('t5_p13a_${t}','${E13}',10000,'paystack','pending','TUI-t5-13a-${t}','t5_ref13a_${t}',now())`)
r = await api('POST', `/api/admin/enrollments/${E13}/tuition/payment-link`, { amount: 10000 })
check('a FRESH url-less pending row means the link is being created: 409, nothing duplicated', r.status === 409 && /being created|already cover/.test(r.json.error) && num(`select count(*) from tuition_payments where "enrollmentId"='${E13}'`) === 1, r)
psql(`update tuition_payments set "createdAt"=(now() at time zone 'utc') - interval '5 minutes' where id='t5_p13a_${t}'`)
r = await api('POST', `/api/admin/enrollments/${E13}/tuition/payment-link`, { amount: 10000 })
check('a STALE url-less pending row is swept to failed and no longer blocks (201)', r.status === 201 && psql(`select status from tuition_payments where id='t5_p13a_${t}'`) === 'failed', r)
// 10e. refund.processed is flagged, never silently ignored, and does not move the ledger
const before = (await api('GET', `/api/admin/enrollments/${E1}/tuition`)).json.summary
check('refund.processed answered 200', (await webhook('refund.processed', { transaction_reference: link1.reference, refund_reference: 'rf_test', amount: 2450000, currency: 'NGN' })) === 200)
check('refund.processed: audit row tuition.refund_processed, balance NOT changed', audits(link1.id, 'tuition.refund_processed') === 1 && (await api('GET', `/api/admin/enrollments/${E1}/tuition`)).json.summary.paid === before.paid)
check('refund.processed for an unknown reference is a quiet 200', (await webhook('refund.processed', { transaction_reference: `t5_nope_${t}` })) === 200 && audits(`t5_nope_${t}`, 'tuition.refund_processed') === 0)
check('charge.dispute.create on a tuition payment is audited', (await webhook('charge.dispute.create', { id: 'dsp_1', reason: 'fraud', amount: 100, transaction: { reference: link1.reference } })) === 200 && audits(link1.id, 'tuition.dispute') === 1)

// ───────────── 11. Paystack "pass charges to customer": amount includes the fee, requested_amount is the base ─────────────
const E14 = enrollment({ status: 'plan_agreed' })
addCharge(E14, 1, 5000, 't5_c14')
const refPass = `t5_ref_PASSTHRU_${t}`
psql(`insert into tuition_payments (id,"enrollmentId",amount,"paymentMethod",status,"receiptNumber","paystackReference","paymentUrl","updatedAt") values ('t5_p14_${t}','${E14}',5000,'paystack','pending','TUI-t5-14-${t}','${refPass}','http://example.invalid/pay',now())`)
await webhook('charge.success', { reference: refPass }) // mock: amount 507500 (base + 7500 fee), requested_amount 500000
check('PASSTHRU: a charge with Paystack fees on top settles on requested_amount (recorded 5000, enrolled)', psql(`select status||':'||amount from tuition_payments where id='t5_p14_${t}'`) === 'completed:5000' && psql(`select status from enrollments where id='${E14}'`) === 'enrolled' && audits(`t5_p14_${t}`, 'tuition.amount_mismatch') === 0)
const E15b = enrollment({ status: 'plan_agreed' })
addCharge(E15b, 1, 5000, 't5_c15b')
const refPass2 = `t5_ref_PASSTHRU2_${t}`
psql(`insert into tuition_payments (id,"enrollmentId",amount,"paymentMethod",status,"receiptNumber","paystackReference","paymentUrl","updatedAt") values ('t5_p15b_${t}','${E15b}',4000,'paystack','pending','TUI-t5-15b-${t}','${refPass2}','http://example.invalid/pay',now())`)
await webhook('charge.success', { reference: refPass2 }) // base asked 4000 but Paystack says the base was 5000: still a mismatch
check('PASSTHRU: a wrong BASE amount is still refused even with fees present', psql(`select status from tuition_payments where id='t5_p15b_${t}'`) === 'pending' && audits(`t5_p15b_${t}`, 'tuition.amount_mismatch') === 1)

for (const [name, c] of Object.entries(captures)) writeFileSync(`${captureDir}/${name}.json`, JSON.stringify(c, null, 2) + '\n')
const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed}/${results.length} checks passed; captures in ${captureDir}`)
process.exit(failed ? 1 : 0)
