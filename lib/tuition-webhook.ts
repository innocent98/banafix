import type { TuitionPayment } from '@prisma/client'
import { prisma } from './prisma'
import { logAdminAction } from './audit'
import { chargeMatches } from './assessment-payment'
import { settleTuitionPayment, tuitionMetadataMatches } from './tuition-payment'
import { loadTuitionReceiptData } from './tuition-receipt-data'
import { computeTuitionBalance } from './tuition-balance'
import { COUNTED_STATUSES, toLedgerCharges } from './tuition-ledger'
import { generateTuitionReceiptPDF } from './receipt'
import { sendTuitionReceipt, sendAdminTuitionAlert, type TuitionAlertKind } from './email'
import type { PaystackVerifyResponse } from './paystack'

/**
 * Email the admin inbox about a tuition payment that needs a human, in addition to the audit row the
 * caller writes. Best-effort: a failed lookup or send is logged and never rethrown (it must not make
 * the webhook answer 500, which would make Paystack retry an event we already handled).
 */
async function alertAdmin(
  kind: TuitionAlertKind,
  payment: TuitionPayment,
  extra: { amount?: number; detail?: string } = {},
): Promise<void> {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: payment.enrollmentId },
      select: { student: { select: { firstName: true, lastName: true, email: true } } },
    })
    await sendAdminTuitionAlert({
      kind,
      studentName: enrollment ? `${enrollment.student.firstName} ${enrollment.student.lastName}` : 'Unknown student',
      studentEmail: enrollment?.student.email ?? 'unknown',
      enrollmentId: payment.enrollmentId,
      paymentId: payment.id,
      reference: payment.paystackReference,
      amount: extra.amount ?? payment.amount,
      detail: extra.detail,
    })
  } catch (error) {
    console.error('Failed to alert admin about tuition payment:', kind, payment.id, error)
  }
}

/**
 * Paystack `charge.success` for an ONLINE TUITION payment (the row was found by reference; metadata
 * is only cross-checked, never trusted). Mirrors the assessment-fee path: verify amount, settle in one
 * transaction, audit, then best-effort emails. DB errors rethrow so the route answers 500 and Paystack
 * retries; a mismatch is audited and answered 200 (a retry would fail identically).
 */
export async function handleTuitionChargeSuccess(
  payment: TuitionPayment,
  verified: PaystackVerifyResponse['data'],
): Promise<void> {
  const reference = payment.paystackReference as string

  if (!tuitionMetadataMatches(verified.metadata, payment)) {
    console.error('Tuition metadata mismatch for reference:', reference)
    await logAdminAction({
      adminId: null,
      action: 'tuition.metadata_mismatch',
      entityType: 'tuition_payment',
      entityId: payment.id,
      metadata: { reference, enrollmentId: payment.enrollmentId, metadata: verified.metadata ?? null },
    })
    await alertAdmin('metadata_mismatch', payment)
    return
  }

  if (!chargeMatches(verified, { amountNaira: payment.amount, currency: payment.currency })) {
    console.error('Tuition charge amount mismatch for reference:', reference)
    await logAdminAction({
      adminId: null,
      action: 'tuition.amount_mismatch',
      entityType: 'tuition_payment',
      entityId: payment.id,
      metadata: {
        reference,
        enrollmentId: payment.enrollmentId,
        expectedNaira: payment.amount,
        expectedCurrency: payment.currency,
        paidKobo: verified.amount,
        paidCurrency: verified.currency,
      },
    })
    await alertAdmin('amount_mismatch', payment, {
      detail: `Expected ₦${payment.amount.toLocaleString()} ${payment.currency}; Paystack reports ${verified.amount} kobo ${verified.currency}.`,
    })
    return
  }

  // Cheap early-out for replays; the atomic claim in settleTuitionPayment is what guarantees idempotency.
  if (payment.status === 'completed' || payment.status === 'partial') {
    console.log('Tuition payment already processed for reference:', reference)
    return
  }

  const outcome = await settleTuitionPayment(prisma, {
    paymentId: payment.id,
    enrollmentId: payment.enrollmentId,
    paystack: verified,
  })
  if (outcome.kind === 'already_processed') {
    console.log('Tuition payment already processed for reference:', reference)
    return
  }

  if (outcome.kind === 'unexpected_state') {
    // Money arrived for an enrollment that is not plan_agreed/enrolled (e.g. cancelled while paying).
    // Recorded, never moved, no student receipt; an admin must act (refund policy is John's call).
    console.warn('Tuition paid on a', outcome.status, 'enrollment; needs admin attention:', payment.enrollmentId)
    await logAdminAction({
      adminId: null,
      action: 'tuition.paid_unexpected_state',
      entityType: 'tuition_payment',
      entityId: payment.id,
      metadata: { reference, enrollmentId: payment.enrollmentId, amount: payment.amount, statusAtPayment: outcome.status },
    })
    await alertAdmin('paid_unexpected_state', payment, { detail: `Enrollment status: ${outcome.status}.` })
    return
  }

  await logAdminAction({
    adminId: null,
    action: 'tuition.online_paid',
    entityType: 'tuition_payment',
    entityId: payment.id,
    metadata: { reference, enrollmentId: payment.enrollmentId, amount: payment.amount, channel: verified.channel ?? null },
  })
  if (outcome.kind === 'moved') {
    await logAdminAction({
      adminId: null,
      action: 'enrollment.enrolled_by_tuition',
      entityType: 'enrollment',
      entityId: payment.enrollmentId,
      metadata: { tuitionPaymentId: payment.id, fromStatus: 'plan_agreed', toStatus: 'enrolled' },
    })
  }

  // The admin cancelled this link but the student paid it anyway: the money is recorded (it was taken), and
  // the audit row says so. If it also overpays, the credit shows on the dashboard and the alert below fires.
  if (payment.status === 'cancelled') {
    await logAdminAction({
      adminId: null,
      action: 'tuition.paid_on_cancelled_link',
      entityType: 'tuition_payment',
      entityId: payment.id,
      metadata: { reference, enrollmentId: payment.enrollmentId, amount: payment.amount },
    })
  }

  // Overpayment is judged on the CURRENT ledger (all active charges, all counted payments), not on the
  // point-in-time receipt: a cash payment recorded while the link was open must still be flagged.
  try {
    const current = await prisma.enrollment.findUnique({
      where: { id: payment.enrollmentId },
      select: {
        ratePerClass: true,
        plannedClasses: true,
        selectedMode: true,
        tuitionCharges: true,
        tuitionPayments: { where: { status: { in: [...COUNTED_STATUSES] } }, select: { amount: true, status: true } },
      },
    })
    if (current) {
      const balance = computeTuitionBalance(current, toLedgerCharges(current.tuitionCharges), current.tuitionPayments, null)
      if (balance.mode === 'ledger' && balance.credit > 0) {
        await logAdminAction({
          adminId: null,
          action: 'tuition.overpayment',
          entityType: 'enrollment',
          entityId: payment.enrollmentId,
          metadata: { tuitionPaymentId: payment.id, credit: balance.credit, charged: balance.charged, paid: balance.paid, via: 'paystack' },
        })
        await alertAdmin('overpayment', payment, { amount: balance.credit, detail: `Charged ₦${balance.charged.toLocaleString()}, paid ₦${balance.paid.toLocaleString()}.` })
      }
    }
  } catch (error) {
    console.error('Failed to evaluate overpayment for payment:', payment.id, error)
  }

  // Receipt (student copy + admin copy inside sendTuitionReceipt). Best-effort: an email failure must
  // never bubble up, or Paystack would retry an already-processed event.
  // TODO(S7): route this send through the communications outbox instead of calling lib/email.ts directly.
  try {
    const receiptData = await loadTuitionReceiptData(prisma, payment.id)
    if (!receiptData) return
    const pdf = generateTuitionReceiptPDF(receiptData)
    const sent = await sendTuitionReceipt(receiptData, pdf)
    await prisma.tuitionPayment.update({ where: { id: payment.id }, data: { receiptGenerated: true, receiptSent: sent } })
  } catch (error) {
    console.error('Failed to send tuition receipt for payment:', payment.id, error)
  }
}

/** `charge.failed` for a tuition row: only a still-pending row can fail (never overwrite a completed one). */
export async function handleTuitionChargeFailed(payment: TuitionPayment): Promise<void> {
  await prisma.tuitionPayment.updateMany({ where: { id: payment.id, status: 'pending' }, data: { status: 'failed' } })
}

/** A dispute on a tuition payment: surface it for an admin (no money movement here). */
export async function handleTuitionDispute(payment: TuitionPayment, dispute: { id?: unknown; reason?: unknown; amount?: unknown }) {
  console.warn('Tuition payment dispute for enrollment:', payment.enrollmentId, dispute)
  await logAdminAction({
    adminId: null,
    action: 'tuition.dispute',
    entityType: 'tuition_payment',
    entityId: payment.id,
    metadata: { enrollmentId: payment.enrollmentId, disputeId: dispute.id ?? null, reason: dispute.reason ?? null, amount: dispute.amount ?? null },
  })
  await alertAdmin('dispute', payment, { detail: dispute.reason ? `Reason: ${String(dispute.reason)}` : undefined })
}

/**
 * `refund.processed` for a tuition payment: FLAG it for an admin (audit + email). The ledger is NOT
 * changed: a refund policy for tuition is John's decision and is not built, so a refunded payment still
 * counts as paid until an admin adjusts the ledger by hand. The payload shape is from Paystack's docs
 * and has not been seen from a live account.
 */
export async function handleTuitionRefund(
  payment: TuitionPayment,
  refund: { refund_reference?: unknown; amount?: unknown; currency?: unknown; status?: unknown },
) {
  console.warn('Refund processed on a tuition payment; needs admin attention:', payment.id, refund)
  await logAdminAction({
    adminId: null,
    action: 'tuition.refund_processed',
    entityType: 'tuition_payment',
    entityId: payment.id,
    metadata: {
      enrollmentId: payment.enrollmentId,
      reference: payment.paystackReference,
      refundReference: refund.refund_reference ?? null,
      refundAmountKobo: refund.amount ?? null,
      currency: refund.currency ?? null,
      balanceChanged: false,
    },
  })
  await alertAdmin('refund_processed', payment, {
    detail: typeof refund.amount === 'number' ? `Refunded: ₦${(refund.amount / 100).toLocaleString()}.` : undefined,
  })
}
