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
  psql(`insert into students (id,email,"firstName","lastName","updatedAt") values ('${ids.student}','e2e${t}@example.com','E','E',now())`)
  const mk = (suffix, status, paid) => {
    const id = `e2e_e_${suffix}_${t}`, ref = `e2e_ref_${suffix}_${t}`
    psql(`insert into enrollments (id,"courseId","studentId","locationId","selectedMode",status,"applicationPaid","updatedAt") values ('${id}','${ids.course}','${ids.student}','${ids.loc}','On-site','${status}',${paid},now())`)
    psql(`insert into application_payments (id,"enrollmentId",amount,"paymentMethod","paystackReference","paystackStatus",status,"receiptNumber","billingEmail","billingName","updatedAt") values ('ap_${id}','${id}',5000,'pending','${ref}','pending','pending','APP-${suffix}-${t}','e2e${t}@example.com','E E',now())`)
    return { id, ref }
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
