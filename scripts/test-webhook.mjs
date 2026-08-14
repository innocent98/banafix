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

async function main() {
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
