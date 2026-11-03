/**
 * Pure rules for the assessment fee (no database). The fee is charged ONCE PER STUDENT: any
 * `completed` fee payment, including a legacy student's payment under the old flow, covers every
 * later application. The non-refundable fee is never charged twice, so a second payment that
 * arrives anyway is classified here rather than silently settled.
 */

/** Is a fee due for a student with these fee payments? Only `completed` payments count. */
export function assessmentFeeDue(payments: ReadonlyArray<{ status: string }>): boolean {
  return !payments.some((payment) => payment.status === 'completed')
}

export type FeeSettlement = 'settle' | 'already_processed' | 'duplicate'

/**
 * What to do with a successful Paystack charge, given the payment row's status and whether the
 * student already has a completed fee payment (on this or another application).
 *
 *   settle             first real fee: move the enrollment, send the receipt
 *   already_processed  replay of a payment we have already handled: do nothing
 *   duplicate          the money is real but the fee was already covered (or a cash fee
 *                      superseded this payment): record it, flag it for refund, touch nothing else
 */
export function classifyIncomingFeePayment(input: {
  paymentStatus: string
  studentHasCompletedFee: boolean
}): FeeSettlement {
  switch (input.paymentStatus) {
    case 'pending':
    case 'failed':
      return input.studentHasCompletedFee ? 'duplicate' : 'settle'
    case 'superseded':
      return 'duplicate'
    default:
      // completed, duplicate, refunded, or anything unknown: never re-process.
      return 'already_processed'
  }
}
