import type { Prisma, PrismaClient } from '@prisma/client'
import { transitionEnrollment } from './enrollment-transition'
import { classifyIncomingFeePayment } from './assessment-fee-rule'

/**
 * The money paths for the assessment fee. The fee is charged ONCE PER STUDENT and is
 * non-refundable, so every write that records, covers or classifies a fee payment takes a row
 * lock on the student first (`lockStudent`) and re-reads inside the same transaction. That
 * serialises cash + webhook and webhook + webhook for one student without a unique index (legacy
 * students may already hold several completed fee payments, so an index could not be created).
 */

type Tx = Prisma.TransactionClient

export type SettleOutcome =
  | { kind: 'already_processed' }
  | { kind: 'moved' }
  | { kind: 'unexpected_state'; status: string }
  | { kind: 'duplicate'; reason: 'already_covered' | 'superseded' }

export interface PaystackSuccessData {
  paid_at?: string | null
  channel?: string | null
  amount?: number | null // kobo
  currency?: string | null
  authorization?: { authorization_code?: string | null } | null
}

export class FeeAlreadyPaidError extends Error {
  constructor() {
    super('This student has already paid the assessment fee; a second fee cannot be recorded.')
    this.name = 'FeeAlreadyPaidError'
  }
}
export class FeeStateChangedError extends Error {
  constructor() {
    super('The enrollment changed while the fee was being recorded')
    this.name = 'FeeStateChangedError'
  }
}

/**
 * Does what Paystack says was charged match what we asked for? Paystack reports kobo; we store whole
 * naira. A mismatch means a tampered/replayed reference or a fee edited mid-payment: do not settle.
 */
export function chargeMatches(
  paystack: Pick<PaystackSuccessData, 'amount' | 'currency'>,
  expected: { amountNaira: number; currency: string },
): boolean {
  return paystack.amount === expected.amountNaira * 100 && (paystack.currency ?? 'NGN') === expected.currency
}

/** Serialise every fee write for one student for the rest of this transaction. */
export async function lockStudent(tx: Tx, studentId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "students" WHERE "id" = ${studentId} FOR UPDATE`
}

/** The student's earliest completed fee payment, if any (legacy payments count). */
export async function findCoveringFeePayment(
  db: Pick<PrismaClient, 'applicationPayment'> | Tx,
  studentId: string,
  excludePaymentId?: string,
) {
  return db.applicationPayment.findFirst({
    where: {
      status: 'completed',
      enrollment: { studentId },
      ...(excludePaymentId ? { id: { not: excludePaymentId } } : {}),
    },
    orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, amount: true, receiptNumber: true, paidAt: true },
  })
}

/**
 * Settle a successful assessment-fee charge. The ONE place a Paystack success touches the database
 * (the webhook is the only caller). One transaction, student row locked:
 *   settle            claim the payment, `pending -> assessment_paid` + `applicationPaid`, no seat change
 *   already_processed replay: nothing happens
 *   duplicate         the fee was already covered (or cash superseded this payment): the payment is
 *                     recorded as `duplicate` (money received, needs a manual refund) and NO
 *                     enrollment is touched
 * If the enrollment is not `pending` (legacy `enrolled`, or cancelled mid-payment) the money fact
 * is recorded but the status is never moved backwards.
 */
export async function settleAssessmentFee(
  db: PrismaClient,
  args: { paymentId: string; enrollmentId: string; paystack: PaystackSuccessData },
): Promise<SettleOutcome> {
  const { paymentId, enrollmentId, paystack } = args
  return db.$transaction(async (tx) => {
    const owner = await tx.enrollment.findUnique({ where: { id: enrollmentId }, select: { studentId: true } })
    if (!owner) return { kind: 'already_processed' as const }
    await lockStudent(tx, owner.studentId)

    const payment = await tx.applicationPayment.findUnique({ where: { id: paymentId }, select: { status: true } })
    if (!payment) return { kind: 'already_processed' as const }
    const covering = await findCoveringFeePayment(tx, owner.studentId, paymentId)
    const verdict = classifyIncomingFeePayment({
      paymentStatus: payment.status,
      studentHasCompletedFee: Boolean(covering),
    })
    if (verdict === 'already_processed') return { kind: 'already_processed' as const }

    const received = {
      paystackStatus: 'success',
      paidAt: paystack.paid_at ? new Date(paystack.paid_at) : new Date(),
      ...(paystack.channel ? { paymentMethod: paystack.channel } : {}),
      authorizationCode: paystack.authorization?.authorization_code ?? undefined,
    }

    if (verdict === 'duplicate') {
      await tx.applicationPayment.update({ where: { id: paymentId }, data: { ...received, status: 'duplicate' } })
      return {
        kind: 'duplicate' as const,
        reason: payment.status === 'superseded' ? ('superseded' as const) : ('already_covered' as const),
      }
    }

    await tx.applicationPayment.update({ where: { id: paymentId }, data: { ...received, status: 'completed' } })
    const moved = await transitionEnrollment(tx, enrollmentId, 'pending', 'assessment_paid', {
      applicationPaid: true,
    })
    if (moved) return { kind: 'moved' as const }

    const current = await tx.enrollment.findUnique({ where: { id: enrollmentId }, select: { status: true } })
    await tx.enrollment.update({ where: { id: enrollmentId }, data: { applicationPaid: true } })
    return { kind: 'unexpected_state' as const, status: current?.status ?? 'unknown' }
  })
}

/**
 * Record a cash / transfer / POS assessment fee (admin mark-paid and walk-in `feePaid`). Must run
 * inside the caller's transaction. Refuses (409 at the route) when the student already has a
 * completed fee, supersedes this enrollment's pending Paystack payments, then does
 * `pending -> assessment_paid` and writes the completed payment. Throws FeeAlreadyPaidError /
 * FeeStateChangedError so the caller's transaction rolls back every earlier write.
 */
export async function recordCashAssessmentFee(
  tx: Tx,
  args: {
    enrollmentId: string
    studentId: string
    amount: number
    currency: string
    paymentMethod: string
    billingEmail: string
    billingName: string
  },
): Promise<{ paymentId: string; supersededCount: number }> {
  await lockStudent(tx, args.studentId)
  if (await findCoveringFeePayment(tx, args.studentId)) throw new FeeAlreadyPaidError()

  const superseded = await tx.applicationPayment.updateMany({
    where: { enrollmentId: args.enrollmentId, status: 'pending' },
    data: { status: 'superseded' },
  })
  const moved = await transitionEnrollment(tx, args.enrollmentId, 'pending', 'assessment_paid', {
    applicationPaid: true,
  })
  if (!moved) throw new FeeStateChangedError()

  const payment = await tx.applicationPayment.create({
    data: {
      enrollmentId: args.enrollmentId,
      amount: args.amount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paystackStatus: 'success',
      status: 'completed',
      paidAt: new Date(),
      receiptNumber: `APP-${Date.now()}-${args.enrollmentId.slice(-6)}`,
      billingEmail: args.billingEmail,
      billingName: args.billingName,
    },
    select: { id: true },
  })
  return { paymentId: payment.id, supersededCount: superseded.count }
}

/**
 * The student's fee is already covered by `coveringPaymentId`: move this pending application to
 * `assessment_paid` with no charge. Run inside the caller's transaction, after `lockStudent`.
 */
export async function coverApplication(tx: Tx, enrollmentId: string, coveringPaymentId: string): Promise<void> {
  const moved = await transitionEnrollment(tx, enrollmentId, 'pending', 'assessment_paid', {
    applicationPaid: true,
    applicationFeeAmount: 0,
    feeCoveredByPaymentId: coveringPaymentId,
  })
  if (!moved) throw new FeeStateChangedError()
}
