/**
 * Local test — Paystack webhook signature validation + event routing.
 *
 * Posts a correctly-signed `charge.success` event to the running dev server and
 * asserts it is accepted (200); then posts one with a bad signature and asserts
 * it is rejected (400).
 *
 * IMPORTANT — what this DOES and does NOT prove:
 *   The webhook re-verifies every reference against Paystack's live
 *   /transaction/verify API before acting. With the fabricated reference below,
 *   that verify step fails, so the handler correctly stops BEFORE sending any
 *   email (the guard working as designed). This test therefore proves signature
 *   validation + routing + the guard — NOT the email sends.
 *
 *   To prove the email sends, run:  npm run test:emails -- you@example.com
 *   To prove the FULL webhook->email path, use a real Paystack test-mode
 *   reference that also has a matching ApplicationPayment row in the DB.
 *
 * Usage:
 *   1. Start the app:            npm run dev
 *   2. In another terminal:      npm run test:webhook            (or)
 *                                node scripts/test-webhook.mjs [reference]
 *
 * Env: reads PAYSTACK_SECRET_KEY from .env. Override target with WEBHOOK_TEST_URL.
 */
import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'

// --- minimal .env loader (no dependency; only fills vars that aren't already set) ---
function loadEnv(path = '.env') {
  try {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const key = m[1]
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  } catch {
    /* no .env file — rely on real env */
  }
}
loadEnv()

const secret = process.env.PAYSTACK_SECRET_KEY
if (!secret) {
  console.error('❌ PAYSTACK_SECRET_KEY is not set (checked .env and process env).')
  process.exit(1)
}

const base = process.env.WEBHOOK_TEST_URL || 'http://localhost:3000'
const url = `${base}/api/webhooks/paystack`
const reference = process.argv[2] || `app_fee_test_${Date.now()}`

const payload = JSON.stringify({
  event: 'charge.success',
  data: {
    reference,
    status: 'success',
    amount: 500000, // kobo
    channel: 'card',
    paid_at: new Date().toISOString(),
  },
})

const sign = (body) => crypto.createHmac('sha512', secret).update(body, 'utf8').digest('hex')

async function post(signature, label) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature },
    body: payload,
  })
  const text = await res.text()
  console.log(`\n${label}\n  → status ${res.status}: ${text}`)
  return res.status
}


// ───────────────────────── E2E mode (WEBHOOK_E2E=1) ─────────────────────────
// Proves the REAL assessment-first webhook path against a LOCAL ephemeral Postgres + the local
// Paystack mock (scripts/mock-paystack.mjs). Start the app with:
//   DATABASE_URL=<ephemeral> PAYSTACK_SECRET_KEY=<same as here> PAYSTACK_BASE_URL=http://127.0.0.1:4010 npm run dev
// Then:  DATABASE_URL=<ephemeral> WEBHOOK_E2E=1 node scripts/test-webhook.mjs
import { execFileSync } from 'node:child_process'

function psql(sql) {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl || !dbUrl.includes('127.0.0.1')) throw new Error('E2E needs a LOCAL DATABASE_URL (127.0.0.1); refusing to touch anything else')
  return execFileSync('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], { encoding: 'utf8' }).trim()
}

async function postEvent(event, data) {
  const body = JSON.stringify({ event, data })
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': sign(body) }, body })
  return res.status
}

async function e2e() {
  const t = Date.now()
  const ids = { course: `e2e_c_${t}`, loc: `e2e_l_${t}`, student: `e2e_s_${t}` }
  psql(`insert into locations (id,name,slug,"assessmentFee","updatedAt") values ('${ids.loc}','E2E ${t}','e2e-${t}',5000,now())`)
  psql(`insert into courses (id,title,instrument,level,"seatsLeft","totalSeats","updatedAt") values ('${ids.course}','E2E','Guitar','Beginner',5,20,now())`)
  // One student PER case: the fee is charged once per student, so cases must not share a student.
  const mkStudent = (suffix) => {
    const id = `e2e_s_${suffix}_${t}`
    psql(`insert into students (id,email,"firstName","lastName","updatedAt") values ('${id}','e2e${suffix}${t}@example.com','E','E',now())`)
    return id
  }
  const mk = (suffix, status, paid, studentId = mkStudent(suffix)) => {
    const id = `e2e_e_${suffix}_${t}`, ref = `e2e_ref_${suffix}_${t}`
    psql(`insert into enrollments (id,"courseId","studentId","locationId","selectedMode",status,"applicationPaid","updatedAt") values ('${id}','${ids.course}','${studentId}','${ids.loc}','On-site','${status}',${paid},now())`)
    psql(`insert into application_payments (id,"enrollmentId",amount,"paymentMethod","paystackReference","paystackStatus",status,"receiptNumber","billingEmail","billingName","updatedAt") values ('ap_${id}','${id}',5000,'pending','${ref}','pending','pending','APP-${suffix}-${t}','e2e${suffix}${t}@example.com','E E',now())`)
    return { id, ref, studentId }
  }
  const fresh = mk('fresh', 'pending', false)
  const cancelled = mk('cancelled', 'cancelled', false)
  const legacy = mk('legacy', 'enrolled', true)
  const failedCase = mk('FAILcase', 'assessment_scheduled', true)

  const q = (id, col) => psql(`select "${col}" from enrollments where id='${id}'`)
  const audits = (id, action) => Number(psql(`select count(*) from audit_logs where "entityId"='${id}' and action='${action}'`))
  const results = []
  const check = (name, ok) => { results.push(ok); console.log(`${ok ? '✅' : '❌'} ${name}`) }

  check('charge.success accepted (200)', (await postEvent('charge.success', { reference: fresh.ref })) === 200)
  check('pending -> assessment_paid', q(fresh.id, 'status') === 'assessment_paid')
  check('applicationPaid = true', q(fresh.id, 'applicationPaid') === 't')
  check('NO seat decrement (seatsLeft still 5)', psql(`select "seatsLeft" from courses where id='${ids.course}'`) === '5')
  check('payment row completed', psql(`select status from application_payments where "enrollmentId"='${fresh.id}'`) === 'completed')
  check('exactly one enrollment.assessment_paid audit row', audits(fresh.id, 'enrollment.assessment_paid') === 1)

  check('REPLAY accepted (200)', (await postEvent('charge.success', { reference: fresh.ref })) === 200)
  check('replay: status unchanged', q(fresh.id, 'status') === 'assessment_paid')
  check('replay: still exactly one audit row', audits(fresh.id, 'enrollment.assessment_paid') === 1)

  await postEvent('charge.success', { reference: cancelled.ref })
  check('late payment on CANCELLED: stays cancelled', q(cancelled.id, 'status') === 'cancelled')
  check('late payment on CANCELLED: money fact recorded', q(cancelled.id, 'applicationPaid') === 't')
  check('late payment on CANCELLED: unexpected-state audit row', audits(cancelled.id, 'enrollment.fee_paid_unexpected_state') === 1)

  await postEvent('charge.success', { reference: legacy.ref })
  check('late payment on legacy ENROLLED: stays enrolled', q(legacy.id, 'status') === 'enrolled')

  await postEvent('charge.failed', { reference: failedCase.ref })
  check('charge.failed never moves a progressed enrollment', q(failedCase.id, 'status') === 'assessment_scheduled')

  // Amount verification: the mock reports 500000 kobo for unknown references; this payment expects 7000 naira.
  const mismatch = mk('mismatch', 'pending', false)
  psql(`update application_payments set amount=7000 where "enrollmentId"='${mismatch.id}'`)
  await postEvent('charge.success', { reference: mismatch.ref })
  check('amount MISMATCH: enrollment NOT settled (still pending)', q(mismatch.id, 'status') === 'pending' && q(mismatch.id, 'applicationPaid') === 'f')
  check('amount MISMATCH: payment not completed + audit row', psql(`select status from application_payments where "enrollmentId"='${mismatch.id}'`) === 'pending' && audits(mismatch.id, 'enrollment.fee_amount_mismatch') === 1)

  // Unknown reference: 200 and a trace for an admin.
  const unknownRef = `e2e_unknown_${t}`
  await postEvent('charge.success', { reference: unknownRef })
  check('unknown reference leaves an audit trace', Number(psql(`select count(*) from audit_logs where "entityId"='${unknownRef}' and action='payment.unmatched_reference'`)) === 1)

  // charge.failed after success must not overwrite a completed payment.
  await postEvent('charge.failed', { reference: fresh.ref })
  check('late charge.failed does not overwrite a completed payment', psql(`select status from application_payments where "enrollmentId"='${fresh.id}'`) === 'completed')

  // "Pass charges to customer": the mock reports amount = fee + Paystack fees but requested_amount = fee.
  const pass = mk('PASSTHRU', 'pending', false)
  await postEvent('charge.success', { reference: pass.ref })
  check('pass-through fees: amount includes fees but requested_amount matches => settles', q(pass.id, 'status') === 'assessment_paid')

  // ── once per student: a second fee payment is recorded as a DUPLICATE (needs refund), nothing else moves ──
  const first = mk('dupA', 'pending', false)
  const second = mk('dupB', 'pending', false, first.studentId) // same student, second application in flight
  await postEvent('charge.success', { reference: first.ref })
  check('dup: first payment settles normally', q(first.id, 'status') === 'assessment_paid')
  await postEvent('charge.success', { reference: second.ref })
  check('dup: second payment of the SAME student flagged duplicate', psql(`select status from application_payments where "enrollmentId"='${second.id}'`) === 'duplicate')
  check('dup: second enrollment NOT moved (still pending, not paid)', q(second.id, 'status') === 'pending' && q(second.id, 'applicationPaid') === 'f')
  check('dup: application.duplicate_payment audit row written', Number(psql(`select count(*) from audit_logs where "entityId"='ap_${second.id}' and action='application.duplicate_payment'`)) === 1)
  check('dup: no assessment_paid audit for the duplicate', audits(second.id, 'enrollment.assessment_paid') === 0)
  await postEvent('charge.success', { reference: second.ref })
  check('dup: replay of a duplicate is a no-op (one audit row)', Number(psql(`select count(*) from audit_logs where "entityId"='ap_${second.id}' and action='application.duplicate_payment'`)) === 1)

  // A payment superseded by a cash fee that still succeeds later is a duplicate too.
  const sup = mk('sup', 'assessment_paid', true)
  psql(`update application_payments set status='superseded' where "enrollmentId"='${sup.id}'`)
  await postEvent('charge.success', { reference: sup.ref })
  check('superseded payment that later succeeds => duplicate, enrollment untouched', psql(`select status from application_payments where "enrollmentId"='${sup.id}'`) === 'duplicate' && q(sup.id, 'status') === 'assessment_paid')

  // ── public covered path: a student who already paid applies for ANOTHER course, twice at once ──
  const cov = mk('cov', 'assessment_paid', true)
  psql(`update application_payments set status='completed', "paidAt"=now() where "enrollmentId"='${cov.id}'`)
  const course2 = `e2e_c2_${t}`
  psql(`insert into courses (id,title,instrument,level,"isActive","isPublished","updatedAt") values ('${course2}','E2E two','Piano','Beginner',true,true,now())`)
  const dmId = psql(`select id from delivery_modes where name='On-site' limit 1`)
  const off2 = `e2e_o2_${t}`
  psql(`insert into course_offerings (id,"courseId","locationId","deliveryModeId","isActive","updatedAt") values ('${off2}','${course2}','${ids.loc}','${dmId}',true,now())`)
  psql(`insert into offering_rates (id,"offeringId","durationMins","pricePerClass","updatedAt") values ('e2e_r2_${t}','${off2}',60,5000,now())`)
  const applyBody = JSON.stringify({ firstName: 'Ignored', lastName: 'Ignored', email: `e2ecov${t}@example.com`, courseId: course2, offeringId: off2, arrangement: 'HOME', address: '1 Attacker Street', agreeToTerms: true, agreeToRefundPolicy: true })
  // A distinct fake client IP per run keeps the route's per-IP throttle (10 / 10 min) from tripping on repeated runs.
  const fakeIp = `10.${t % 250}.${Math.floor(t / 250) % 250}.7`
  const apply = () => fetch(`${base}/api/enrollments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp }, body: applyBody }).then(async (r) => ({ status: r.status, body: await r.json() }))
  const applied = await Promise.all([apply(), apply()])
  const bodies = applied.map((r) => r.body)
  check('covered double-submit: both answered 201 and reuse ONE waiting application (no spam rows)',
    applied.every((r) => r.status === 201) && bodies[0].enrollment.id === bodies[1].enrollment.id
      && psql(`select count(*) from enrollments where "courseId"='${course2}' and "studentId"='${cov.studentId}'`) === '1', JSON.stringify(applied.map((r) => r.status)))
  check('covered: created PENDING (never assessment_paid on an email alone), coverage link set, no payment row',
    psql(`select status||':'||("feeCoveredByPaymentId" is not null)||':'||"applicationPaid" from enrollments where "courseId"='${course2}' and "studentId"='${cov.studentId}'`) === 'pending:true:false'
    && psql(`select count(*) from application_payments p join enrollments e on e.id=p."enrollmentId" where e."courseId"='${course2}' and e."studentId"='${cov.studentId}'`) === '0')
  // Same response SHAPE as a normal (fee due) application: no feeCovered flag, same keys, a redirect URL.
  const fresh2 = await fetch(`${base}/api/enrollments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': fakeIp }, body: JSON.stringify({ firstName: 'New', lastName: 'Person', email: `e2enew${t}@example.com`, courseId: course2, offeringId: off2, arrangement: 'CENTRE', agreeToTerms: true, agreeToRefundPolicy: true }) }).then(async (r) => ({ status: r.status, body: await r.json() }))
  const keys = (o) => Object.keys(o ?? {}).sort().join(',')
  check('covered vs normal: identical response shape (top level, enrollment, applicationFee, payment) and no feeCovered flag',
    fresh2.status === 201 && keys(bodies[0]) === keys(fresh2.body) && keys(bodies[0].enrollment) === keys(fresh2.body.enrollment)
      && keys(bodies[0].enrollment.applicationFee) === keys(fresh2.body.enrollment.applicationFee) && keys(bodies[0].payment) === keys(fresh2.body.payment)
      && !('feeCovered' in bodies[0]) && bodies[0].enrollment.applicationFee.amount === fresh2.body.enrollment.applicationFee.amount,
    `${keys(bodies[0])} vs ${keys(fresh2.body)}`)
  check('covered: the redirect is the site\'s own received page, not Paystack', String(bodies[0].payment.authorization_url).startsWith('/enroll/success?application='))
  check('covered: request address NOT stored (admin confirms the address when scheduling)',
    psql(`select coalesce(a.address,'(none)') from assessments a join enrollments e on e.id=a."enrollmentId" where e."courseId"='${course2}' and e."studentId"='${cov.studentId}'`) === '(none)')

  const conc = mk('conc', 'pending', false)
  const statuses = await Promise.all([1, 2, 3].map(() => postEvent('charge.success', { reference: conc.ref })))
  check('3 CONCURRENT deliveries all answered 200', statuses.every((c) => c === 200))
  check('concurrent: exactly one transition + one audit row', q(conc.id, 'status') === 'assessment_paid' && audits(conc.id, 'enrollment.assessment_paid') === 1)

  process.exit(results.every(Boolean) ? 0 : 1)
}

async function main() {
  if (process.env.WEBHOOK_E2E === '1') return e2e()
  console.log(`Target: ${url}`)
  console.log(`Reference: ${reference}`)

  const validStatus = await post(sign(payload), '① Valid signature (expect 200 — accepted & routed)')
  const badStatus = await post('not-a-real-signature', '② Invalid signature (expect 400 — rejected)')

  console.log('\n──────── result ────────')
  const okValid = validStatus === 200
  const okBad = badStatus === 400
  console.log(`${okValid ? '✅' : '❌'} valid signature accepted (200)`)
  console.log(`${okBad ? '✅' : '❌'} invalid signature rejected (400)`)
  console.log(
    '\nNote: no email is sent here — the fabricated reference fails Paystack verify,\n' +
    'so the handler stops before the email step (correct). Use `npm run test:emails` for that.'
  )
  process.exit(okValid && okBad ? 0 : 1)
}

main().catch((e) => {
  console.error('\n❌ Request failed — is the dev server running on', base, '?\n', e.message)
  process.exit(1)
})
