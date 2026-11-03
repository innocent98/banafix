import { logAdminAction } from './audit'
import { sendAdminDuplicatePaymentNotice } from './email'

/**
 * A fee payment was received that must not be settled (already covered, or superseded by a cash
 * fee). The payment row is already flagged `duplicate` by `settleAssessmentFee`; this writes the
 * audit row and tells the admin inbox. Both are best-effort and never throw into the webhook.
 */
export async function reportDuplicateFeePayment(args: {
  paymentId: string
  enrollmentId: string
  amount: number
  reference: string | null
  reason: 'already_covered' | 'superseded'
  student: { firstName: string; lastName: string; email: string }
}): Promise<void> {
  await logAdminAction({
    adminId: null,
    action: 'application.duplicate_payment',
    entityType: 'application_payment',
    entityId: args.paymentId,
    metadata: {
      enrollmentId: args.enrollmentId,
      amount: args.amount,
      reference: args.reference,
      reason: args.reason,
      needsRefund: true,
    },
  })
  try {
    await sendAdminDuplicatePaymentNotice({
      studentName: `${args.student.firstName} ${args.student.lastName}`,
      studentEmail: args.student.email,
      amount: args.amount,
      reference: args.reference,
      enrollmentId: args.enrollmentId,
      reason: args.reason,
    })
  } catch (error) {
    console.error('Duplicate-payment admin notice failed:', error)
  }
}
