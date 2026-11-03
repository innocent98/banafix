import type { Prisma, PrismaClient } from '@prisma/client'
import { transitionEnrollment } from './enrollment-transition'

export type SettleOutcome =
  | { kind: 'already_processed' }
  | { kind: 'moved' }
  | { kind: 'unexpected_state'; status: string }

export interface PaystackSuccessData {
  paid_at?: string | null
  channel?: string | null
  authorization?: { authorization_code?: string | null } | null
}

/**
 * Settle a successful assessment-fee charge. The ONE place a Paystack success touches the
 * database (used by the webhook and the manual verify route).
 *
 * One transaction: claim the payment (count 0 => replay/concurrent delivery, nothing else runs),
 * then `pending -> assessment_paid` with `applicationPaid: true`. No seat decrement (D6, D9).
 * If the enrollment is not `pending` (legacy `enrolled`, or cancelled mid-payment) the money fact
 * is recorded but the status is never moved backwards.
 */
export async function settleAssessmentFee(
  db: PrismaClient,
  args: { paymentId: string; enrollmentId: string; paystack: PaystackSuccessData },
): Promise<SettleOutcome> {
  const { paymentId, enrollmentId, paystack } = args
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    const claimed = await tx.applicationPayment.updateMany({
      where: { id: paymentId, status: { not: 'completed' } },
      data: {
        status: 'completed',
        paystackStatus: 'success',
        paidAt: paystack.paid_at ? new Date(paystack.paid_at) : new Date(),
        ...(paystack.channel ? { paymentMethod: paystack.channel } : {}),
        authorizationCode: paystack.authorization?.authorization_code ?? undefined,
      },
    })
    if (claimed.count === 0) return { kind: 'already_processed' as const }

    const moved = await transitionEnrollment(tx, enrollmentId, 'pending', 'assessment_paid', {
      applicationPaid: true,
    })
    if (moved) return { kind: 'moved' as const }

    const current = await tx.enrollment.findUnique({ where: { id: enrollmentId }, select: { status: true } })
    await tx.enrollment.update({ where: { id: enrollmentId }, data: { applicationPaid: true } })
    return { kind: 'unexpected_state' as const, status: current?.status ?? 'unknown' }
  })
}
