/**
 * Local test — enrollment emails via Resend.
 *
 * Exercises the exact three send functions the app uses, with the same data
 * shapes the enrollment route and Paystack webhook build — but without needing
 * Paystack or the database. This is what proves the email layer actually fires:
 * template rendering, PDF attachment, and Resend delivery/domain config.
 *
 *   1. sendEnrollmentConfirmation   → "application received" ack   (on form submit)
 *   2. sendApplicationFeeReceipt    → paid receipt + PDF           (on webhook)
 *   3. sendAdminEnrollmentNotification → admin notice              (on webhook)
 *
 * SENDS REAL EMAIL. #1 and #2 go to the recipient you pass; #3 goes to
 * ADMIN_EMAIL (falls back to SUPPORT_EMAIL). If FROM_EMAIL's domain isn't
 * verified in Resend, sends fail — the error is printed so you know to fix it.
 * Tip: to test before verifying a domain, set FROM_EMAIL=onboarding@resend.dev
 * in .env and send to your own Resend account email.
 *
 * Usage:
 *   npm run test:emails -- you@example.com
 *   npx tsx scripts/test-enrollment-emails.ts you@example.com
 */
import { config } from 'dotenv'
config() // load .env

import {
  sendEnrollmentConfirmation,
  sendApplicationFeeReceipt,
  sendAdminEnrollmentNotification,
} from '../lib/email'
import { generateApplicationFeeReceiptPDF, ApplicationFeeReceiptData } from '../lib/receipt'

const to = process.argv[2] || process.env.TEST_EMAIL_TO

if (!to) {
  console.error('❌ Provide a recipient:  npm run test:emails -- you@example.com')
  process.exit(1)
}
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not set in .env')
  process.exit(1)
}

const FROM = process.env.FROM_EMAIL || 'noreply@banafix.com (default)'
const ADMIN = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'support@banafix.com (default)'

console.log('──────── config ────────')
console.log('FROM_EMAIL :', FROM)
console.log('ADMIN_EMAIL:', ADMIN, '(admin notice goes here)')
console.log('Recipient  :', to, '(ack + receipt go here)')
console.log('─────────────────────────\n')

const now = new Date().toISOString()

const receiptData: ApplicationFeeReceiptData = {
  receiptNumber: 'APP-TEST-000001',
  enrollment: {
    id: 'test-enrollment-id',
    firstName: 'Test',
    lastName: 'Student',
    email: to,
    phone: '+2348000000000',
    createdAt: now,
  },
  course: {
    title: 'Piano Fundamentals',
    instrument: 'Piano',
    level: 'Beginner',
    duration: '8 weeks',
    instructor: 'Jane Doe',
    sessionStartDate: now,
  },
  payment: {
    amount: 5000,
    paidAt: now,
    reference: 'app_fee_test_123',
    paymentMethod: 'card',
  },
}

async function main() {
  let allOk = true

  // 1. Pre-payment acknowledgement
  const ackOk = await sendEnrollmentConfirmation({
    firstName: 'Test',
    lastName: 'Student',
    email: to!,
    courseName: 'Piano Fundamentals',
    enrollmentId: 'test-enrollment-id',
    applicationFee: 5000,
  })
  console.log(`${ackOk ? '✅' : '❌'} 1/3  application-received ack  → ${to}`)
  allOk &&= ackOk

  // 2. Paid receipt + PDF
  const pdf = generateApplicationFeeReceiptPDF(receiptData)
  const receiptOk = await sendApplicationFeeReceipt(receiptData, pdf)
  console.log(`${receiptOk ? '✅' : '❌'} 2/3  paid receipt + PDF       → ${to}`)
  allOk &&= receiptOk

  // 3. Admin notification (to ADMIN_EMAIL, not the recipient)
  const adminOk = await sendAdminEnrollmentNotification({
    enrollment: {
      id: 'test-enrollment-id',
      firstName: 'Test',
      lastName: 'Student',
      email: to!,
      phone: '+2348000000000',
      selectedMode: 'online',
    },
    course: { title: 'Piano Fundamentals', instrument: 'Piano', level: 'Beginner' },
    payment: { amount: 5000, reference: 'app_fee_test_123', paidAt: now, paymentMethod: 'card' },
  })
  console.log(`${adminOk ? '✅' : '❌'} 3/3  admin notification        → ${ADMIN}`)
  allOk &&= adminOk

  console.log(`\n${allOk ? '✅ all sends succeeded' : '❌ one or more sends failed — see errors above (often an unverified FROM domain in Resend)'}`)
  process.exit(allOk ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
