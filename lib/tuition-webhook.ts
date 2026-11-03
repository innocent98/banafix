import type { TuitionPayment } from '@prisma/client'
import { prisma } from './prisma'
import { logAdminAction } from './audit'
import { chargeMatches } from './assessment-payment'
import { settleTuitionPayment, tuitionMetadataMatches } from './tuition-payment'
import { loadTuitionReceiptData } from './tuition-receipt-data'
import { generateTuitionReceiptPDF } from './receipt'
import { sendTuitionReceipt } from './email'
import type { PaystackVerifyResponse } from './paystack'

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

  // Receipt (student copy + admin copy inside sendTuitionReceipt). Best-effort: an email failure must
  // never bubble up, or Paystack would retry an already-processed event.
  // TODO(S7): route this send through the communications outbox instead of calling lib/email.ts directly.
  try {
    const receiptData = await loadTuitionReceiptData(prisma, payment.id)
    if (!receiptData) return
    if (receiptData.ledger && receiptData.ledger.credit > 0) {
      await logAdminAction({
        adminId: null,
        action: 'tuition.overpayment',
        entityType: 'enrollment',
        entityId: payment.enrollmentId,
        metadata: { tuitionPaymentId: payment.id, credit: receiptData.ledger.credit, via: 'paystack' },
      })
    }
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
}
