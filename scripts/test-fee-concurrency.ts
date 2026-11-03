/**
 * Real-database concurrency test for the once-per-student assessment fee.
 * Fires the money paths at the same student at the same moment and asserts the invariant:
 * at most ONE `completed` fee payment per student, and the loser is flagged (duplicate) or refused
 * (409-equivalent), never silently double-settled.
 *
 *   DATABASE_URL=postgresql://postgres@127.0.0.1:5466/postgres npx tsx scripts/test-fee-concurrency.ts
 * Refuses to run unless DATABASE_URL points at 127.0.0.1.
 */
import { PrismaClient } from '@prisma/client'
import {
  FeeAlreadyPaidError,
  recordCashAssessmentFee,
  settleAssessmentFee,
} from '../lib/assessment-payment'

if (!process.env.DATABASE_URL?.includes('127.0.0.1')) {
  console.error('refusing: DATABASE_URL must point at 127.0.0.1')
  process.exit(1)
}
const db = new PrismaClient()
const TRIALS = Number(process.env.TRIALS || 25)
let failures = 0
const check = (name: string, ok: boolean, extra = '') => {
  if (!ok) failures++
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` ${extra}` : ''}`)
}

let seq = 0
async function fixture(enrollments: number) {
  const n = `${Date.now()}_${seq++}`
  const course = await db.course.create({ data: { id: `fc_${n}`, title: 'C', instrument: 'Guitar', level: 'Beginner' } })
  const student = await db.student.create({ data: { id: `fs_${n}`, email: `fee${n}@example.com`, firstName: 'F', lastName: 'S' } })
  const rows = []
  for (let i = 0; i < enrollments; i++) {
    const enrollment = await db.enrollment.create({
      data: { id: `fe_${n}_${i}`, courseId: course.id, studentId: student.id, selectedMode: 'On-site', status: 'pending' },
    })
    const payment = await db.applicationPayment.create({
      data: {
        id: `fp_${n}_${i}`, enrollmentId: enrollment.id, amount: 5000, paymentMethod: 'pending',
        paystackReference: `ref_${n}_${i}`, receiptNumber: `R_${n}_${i}`, billingEmail: student.email, billingName: 'F S',
      },
    })
    rows.push({ enrollment, payment })
  }
  return { student, rows }
}

const cash = (studentId: string, enrollmentId: string) =>
  db
    .$transaction((tx) =>
      recordCashAssessmentFee(tx, {
        enrollmentId, studentId, amount: 5000, currency: 'NGN', paymentMethod: 'cash', billingEmail: 'x@example.com', billingName: 'X',
      }),
    )
    .then(() => 'cash_ok' as const)
    .catch((e) => (e instanceof FeeAlreadyPaidError ? ('cash_409' as const) : (Promise.reject(e) as never)))
const hook = (paymentId: string, enrollmentId: string) =>
  settleAssessmentFee(db, { paymentId, enrollmentId, paystack: { channel: 'card' } }).then((o) => `hook_${o.kind}` as const)

const completedCount = (studentId: string) =>
  db.applicationPayment.count({ where: { status: 'completed', enrollment: { studentId } } })

async function scenario(name: string, enrollments: number, run: (f: Awaited<ReturnType<typeof fixture>>) => Promise<string[]>, ok: (r: string[]) => boolean) {
  let bad = 0
  const seen = new Set<string>()
  for (let t = 0; t < TRIALS; t++) {
    const f = await fixture(enrollments)
    const results = await run(f)
    const completed = await completedCount(f.student.id)
    seen.add([...results].sort().join('+'))
    if (completed !== 1 || !ok(results)) { bad++; console.log('   bad trial:', results, 'completed=', completed) }
  }
  check(`${name} (${TRIALS} trials; outcomes seen: ${[...seen].join(' | ')})`, bad === 0)
}

async function main() {
  await scenario('cash vs webhook, SAME application', 1,
    (f) => Promise.all([cash(f.student.id, f.rows[0].enrollment.id), hook(f.rows[0].payment.id, f.rows[0].enrollment.id)]),
    (r) => (r.includes('cash_ok') && r.includes('hook_duplicate')) || (r.includes('hook_moved') && r.includes('cash_409')))

  await scenario('cash vs webhook, DIFFERENT applications of one student', 2,
    (f) => Promise.all([cash(f.student.id, f.rows[0].enrollment.id), hook(f.rows[1].payment.id, f.rows[1].enrollment.id)]),
    (r) => (r.includes('cash_ok') && r.includes('hook_duplicate')) || (r.includes('hook_moved') && r.includes('cash_409')))

  await scenario('two webhooks, two applications of one student (two tabs)', 2,
    (f) => Promise.all([hook(f.rows[0].payment.id, f.rows[0].enrollment.id), hook(f.rows[1].payment.id, f.rows[1].enrollment.id)]),
    (r) => r.includes('hook_moved') && r.includes('hook_duplicate'))

  await scenario('three webhooks for the SAME payment (replay storm)', 1,
    (f) => Promise.all([1, 2, 3].map(() => hook(f.rows[0].payment.id, f.rows[0].enrollment.id))),
    (r) => r.filter((x) => x === 'hook_moved').length === 1 && r.filter((x) => x === 'hook_already_processed').length === 2)

  // Superseded payment arriving later is a duplicate; the enrollment is untouched.
  const f = await fixture(1)
  await cash(f.student.id, f.rows[0].enrollment.id)
  const late = await hook(f.rows[0].payment.id, f.rows[0].enrollment.id)
  const pay = await db.applicationPayment.findUnique({ where: { id: f.rows[0].payment.id } })
  const enr = await db.enrollment.findUnique({ where: { id: f.rows[0].enrollment.id } })
  check('late charge.success on a superseded payment => duplicate, enrollment stays assessment_paid',
    late === 'hook_duplicate' && pay?.status === 'duplicate' && enr?.status === 'assessment_paid')

  // Reverse order: Paystack first, then cash => refused.
  const g = await fixture(1)
  await hook(g.rows[0].payment.id, g.rows[0].enrollment.id)
  const refused = await cash(g.student.id, g.rows[0].enrollment.id)
  check('Paystack succeeded first, then cash attempt => refused (409)', refused === 'cash_409')

  await db.$disconnect()
  console.log(failures === 0 ? '\nALL FEE CONCURRENCY CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
  process.exit(failures === 0 ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
