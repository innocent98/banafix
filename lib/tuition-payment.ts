import type { Prisma, PrismaClient } from '@prisma/client'
import { transitionEnrollment } from './enrollment-transition'
import { ONLINE_PAYMENT_METHOD } from './tuition-methods'
import type { PaystackSuccessData } from './assessment-payment'

export type TuitionSettleOutcome =
  | { kind: 'already_processed' }
  | { kind: 'moved' } // plan_agreed -> enrolled happened in this transaction
  | { kind: 'settled' } // enrollment was already enrolled; payment recorded
  | { kind: 'unexpected_state'; status: string } // e.g. cancelled while the student was paying

/** A pending/failed/cancelled online payment may still be paid; a completed/partial one must never be claimed twice. */
export const CLAIMABLE_STATUSES = ['pending', 'failed', 'cancelled']

/**
 * Settle a successful ONLINE tuition charge. The ONE place a Paystack success touches a tuition
 * payment (mirror of settleAssessmentFee).
 *
 * One transaction: claim the payment (count 0 => replay / concurrent delivery, nothing else runs),
 * then `plan_agreed -> enrolled` by compare-and-set. If the enrollment is not plan_agreed the money
 * fact is recorded and the status is never moved (a cancelled row is reported as unexpected_state).
 */
export async function settleTuitionPayment(
  db: PrismaClient,
  args: { paymentId: string; enrollmentId: string; paystack: PaystackSuccessData },
): Promise<TuitionSettleOutcome> {
  const { paymentId, enrollmentId, paystack } = args
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const claimed = await tx.tuitionPayment.updateMany({
      where: { id: paymentId, status: { in: CLAIMABLE_STATUSES } },
      data: {
        status: 'completed',
        paidAt: paystack.paid_at ? new Date(paystack.paid_at) : new Date(),
        paymentMethod: ONLINE_PAYMENT_METHOD,
        ...(paystack.channel ? { paystackChannel: paystack.channel } : {}),
      },
    })
    if (claimed.count === 0) return { kind: 'already_processed' as const }

    const moved = await transitionEnrollment(tx, enrollmentId, 'plan_agreed', 'enrolled')
    if (moved) return { kind: 'moved' as const }

    const current = await tx.enrollment.findUnique({ where: { id: enrollmentId }, select: { status: true } })
    if (current?.status === 'enrolled') return { kind: 'settled' as const }
    return { kind: 'unexpected_state' as const, status: current?.status ?? 'unknown' }
  })
}

/**
 * Cross-check the metadata Paystack echoes back against the row we found by reference. Metadata is
 * never what routes or authorises a payment (the reference lookup does); this only catches a
 * reference that was initialised for something else. Absent fields are fine.
 */
export function tuitionMetadataMatches(
  metadata: unknown,
  row: { id: string; enrollmentId: string },
): boolean {
  if (!metadata || typeof metadata !== 'object') return true
  const m = metadata as Record<string, unknown>
  if (m.payment_type != null && m.payment_type !== 'tuition') return false
  if (m.enrollment_id != null && m.enrollment_id !== row.enrollmentId) return false
  if (m.tuition_payment_id != null && m.tuition_payment_id !== row.id) return false
  return true
}
