import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { validateWebhookSignature, verifyPayment } from '@/lib/paystack'
import { generateApplicationFeeReceiptPDF, ApplicationFeeReceiptData } from '@/lib/receipt'
import { sendApplicationFeeReceipt, sendAdminEnrollmentNotification, sendAdminCancelledPaymentNotice } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'
import { settleAssessmentFee, chargeMatches } from '@/lib/assessment-payment'
import { reportDuplicateFeePayment } from '@/lib/duplicate-fee'

// POST /api/webhooks/paystack - Handle Paystack webhook events
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature') || ''

    // Validate webhook signature
    if (!validateWebhookSignature(body, signature)) {
      console.error('Invalid Paystack webhook signature')
      return createErrorResponse('Invalid signature', 400)
    }

    const event = JSON.parse(body)

    console.log('Paystack webhook event:', event.event, event.data?.reference)

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data)
        break

      case 'charge.dispute.create':
        await handleChargeDispute(event.data)
        break

      default:
        console.log('Unhandled Paystack event type:', event.event)
    }

    return createResponse({ message: 'Webhook processed successfully' })

  } catch (error) {
    console.error('Paystack webhook error:', error)
    return createErrorResponse('Webhook processing failed', 500)
  }
}

/**
 * Handle successful payment charge
 */
async function handleChargeSuccess(data: any) {
  try {
    const reference = data.reference

    // Verify the payment with Paystack to ensure authenticity
    const verificationResult = await verifyPayment(reference)

    if (!verificationResult.status || verificationResult.data.status !== 'success') {
      console.error('Payment verification failed for reference:', reference)
      return
    }

    // Find the application payment record
    const applicationPayment = await prisma.applicationPayment.findUnique({
      where: { paystackReference: reference },
      include: {
        enrollment: {
          include: {
            course: {
              include: {
                instructor: { select: { name: true } },
              },
            },
            student: true,
          },
        },
      },
    })

    if (!applicationPayment) {
      // Money may have been taken for a reference we have no record of. Leave a trace for an admin.
      console.error('Application payment not found for reference:', reference)
      await logAdminAction({
        adminId: null,
        action: 'payment.unmatched_reference',
        entityType: 'application_payment',
        entityId: String(reference),
        metadata: { amountKobo: verificationResult.data.amount, currency: verificationResult.data.currency },
      })
      return
    }

    // The charge must be what we asked for. On a mismatch do not settle: flag it for an admin and
    // answer 200 (a retry would fail identically).
    if (!chargeMatches(verificationResult.data, { amountNaira: applicationPayment.amount, currency: applicationPayment.currency })) {
      console.error('Charge amount mismatch for reference:', reference)
      await logAdminAction({
        adminId: null,
        action: 'enrollment.fee_amount_mismatch',
        entityType: 'enrollment',
        entityId: applicationPayment.enrollmentId,
        metadata: {
          reference,
          expectedNaira: applicationPayment.amount,
          expectedCurrency: applicationPayment.currency,
          paidKobo: verificationResult.data.amount,
          paidCurrency: verificationResult.data.currency,
        },
      })
      return
    }

    // Cheap early-out for replays; the atomic claim below is what actually guarantees idempotency.
    if (applicationPayment.status === 'completed') {
      console.log('Payment already processed for reference:', reference)
      return
    }

    // B12: payment claim + enrollment move are ONE transaction (see lib/assessment-payment.ts).
    const outcome = await settleAssessmentFee(prisma, {
      paymentId: applicationPayment.id,
      enrollmentId: applicationPayment.enrollmentId,
      paystack: verificationResult.data,
    })

    if (outcome.kind === 'already_processed') {
      console.log('Payment already processed for reference:', reference)
      return
    }

    console.log('Payment processed successfully for enrollment:', applicationPayment.enrollmentId)

    // The fee was already covered (or a cash fee superseded this payment): the money is recorded as
    // `duplicate` for a manual refund; no enrollment change, no student receipt.
    if (outcome.kind === 'duplicate') {
      await reportDuplicateFeePayment({
        paymentId: applicationPayment.id,
        enrollmentId: applicationPayment.enrollmentId,
        amount: applicationPayment.amount,
        reference,
        reason: outcome.reason,
        student: applicationPayment.enrollment.student,
      })
      return
    }

    await logAdminAction({
      adminId: null,
      action: outcome.kind === 'moved' ? 'enrollment.assessment_paid' : 'enrollment.fee_paid_unexpected_state',
      entityType: 'enrollment',
      entityId: applicationPayment.enrollmentId,
      metadata: {
        reference,
        amount: applicationPayment.amount,
        ...(outcome.kind === 'unexpected_state' ? { statusAtPayment: outcome.status } : { toStatus: 'assessment_paid' }),
      },
    })

    // A cancelled enrollment got paid: surface it, but don't email a "you're in" receipt for it.
    if (outcome.kind === 'unexpected_state' && outcome.status === 'cancelled') {
      console.warn('Fee paid on a cancelled enrollment; needs admin attention:', applicationPayment.enrollmentId)
      try {
        await sendAdminCancelledPaymentNotice({
          studentName: `${applicationPayment.enrollment.student.firstName} ${applicationPayment.enrollment.student.lastName}`,
          studentEmail: applicationPayment.enrollment.student.email,
          amount: applicationPayment.amount,
          enrollmentId: applicationPayment.enrollmentId,
        })
      } catch (error) {
        console.error('Cancelled-payment admin notice failed:', error)
      }
      return
    }

    // Send the student receipt and notify admin. Email failures must NOT bubble
    // up: a thrown error here would make the webhook return 500 and Paystack
    // would retry the whole (already-processed) event. So each send is guarded
    // and logged, never rethrown.
    await sendEnrollmentEmails(applicationPayment, verificationResult.data)

  } catch (error) {
    // Rethrow: the route answers 500 so Paystack retries. Safe because the DB work is one
    // transaction (nothing half-applied) and the email sends below it are individually guarded.
    console.error('Error handling charge success:', error)
    throw error
  }
}

/**
 * Send the post-payment emails: a paid-receipt (with PDF) to the student and a
 * new-enrollment notification to the admin/support inbox. Best-effort — any
 * failure is logged and swallowed so it never breaks webhook processing.
 */
async function sendEnrollmentEmails(applicationPayment: any, paystackData: any) {
  const { enrollment } = applicationPayment
  const { course } = enrollment

  const paidAt = paystackData.paid_at ? new Date(paystackData.paid_at) : new Date()
  const paymentMethod = paystackData.channel || 'card'

  // --- Student: paid application-fee receipt with PDF attachment ---
  try {
    const receiptData: ApplicationFeeReceiptData = {
      receiptNumber: applicationPayment.receiptNumber,
      enrollment: {
        id: enrollment.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        phone: enrollment.student.phone || undefined,
        createdAt: enrollment.createdAt.toISOString(),
      },
      course: {
        title: course.title,
        instrument: course.instrument,
        level: course.level,
        duration: course.duration,
        instructor: course.instructor?.name,
        sessionStartDate: course.sessionStartDate?.toISOString(),
      },
      payment: {
        amount: applicationPayment.amount,
        paidAt: paidAt.toISOString(),
        reference: applicationPayment.paystackReference,
        paymentMethod,
      },
    }

    const pdfBuffer = generateApplicationFeeReceiptPDF(receiptData)
    const emailSent = await sendApplicationFeeReceipt(receiptData, pdfBuffer)

    if (emailSent) {
      await prisma.applicationPayment.update({
        where: { id: applicationPayment.id },
        data: { receiptGenerated: true, receiptSent: true },
      })
    }
  } catch (error) {
    console.error('Failed to send student receipt email for enrollment:', enrollment.id, error)
  }

  // --- Admin: new paid enrollment notification ---
  try {
    await sendAdminEnrollmentNotification({
      enrollment: {
        id: enrollment.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        email: enrollment.student.email,
        phone: enrollment.student.phone || undefined,
        selectedMode: enrollment.selectedMode || undefined,
      },
      course: {
        title: course.title,
        instrument: course.instrument,
        level: course.level,
      },
      payment: {
        amount: applicationPayment.amount,
        reference: applicationPayment.paystackReference,
        paidAt: paidAt.toISOString(),
        paymentMethod,
      },
    })
  } catch (error) {
    console.error('Failed to send admin notification for enrollment:', enrollment.id, error)
  }
}

/**
 * Handle failed payment charge
 */
async function handleChargeFailed(data: any) {
  try {
    const reference = data.reference

    // Find the application payment record
    const applicationPayment = await prisma.applicationPayment.findUnique({
      where: { paystackReference: reference },
    })

    if (!applicationPayment) {
      console.error('Application payment not found for reference:', reference)
      return
    }

    // Only a still-pending payment can fail: a late/out-of-order charge.failed must never overwrite
    // a payment that already completed.
    await prisma.applicationPayment.updateMany({
      where: { id: applicationPayment.id, status: 'pending' },
      data: {
        status: 'failed',
        paystackStatus: 'failed',
      },
    })

    // Nothing to change on the enrollment: an unpaid enrollment is already `pending` (retryable),
    // and a failed charge must never move a paid / progressed enrollment.

    console.log('Payment failed for enrollment:', applicationPayment.enrollmentId)

  } catch (error) {
    console.error('Error handling charge failed:', error)
  }
}

/**
 * Handle payment dispute
 */
async function handleChargeDispute(data: any) {
  try {
    const reference = data.transaction?.reference

    if (!reference) {
      console.error('No reference found in dispute data')
      return
    }

    // Find the application payment record
    const applicationPayment = await prisma.applicationPayment.findUnique({
      where: { paystackReference: reference },
    })

    if (!applicationPayment) {
      console.error('Application payment not found for dispute reference:', reference)
      return
    }

    // Log the dispute for admin review
    console.warn('Payment dispute created for enrollment:', applicationPayment.enrollmentId, {
      reference,
      disputeId: data.id,
      reason: data.reason,
      amount: data.amount,
    })

    // TODO: Notify admin about the dispute
    // This could be done via email or admin dashboard notification

  } catch (error) {
    console.error('Error handling charge dispute:', error)
  }
}