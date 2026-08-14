import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { validateWebhookSignature, verifyPayment } from '@/lib/paystack'
import { generateApplicationFeeReceiptPDF, ApplicationFeeReceiptData } from '@/lib/receipt'
import { sendApplicationFeeReceipt, sendAdminEnrollmentNotification } from '@/lib/email'

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
          },
        },
      },
    })

    if (!applicationPayment) {
      console.error('Application payment not found for reference:', reference)
      return
    }

    if (applicationPayment.status === 'completed') {
      console.log('Payment already processed for reference:', reference)
      return
    }

    // Update application payment status
    await prisma.applicationPayment.update({
      where: { id: applicationPayment.id },
      data: {
        status: 'completed',
        paystackStatus: 'success',
        paidAt: verificationResult.data.paid_at ? new Date(verificationResult.data.paid_at) : new Date(),
        paymentMethod: verificationResult.data.channel,
        authorizationCode: verificationResult.data.authorization?.authorization_code,
      },
    })

    // Update enrollment status and reduce course seats
    await prisma.$transaction(async (tx: any) => {
      // Update enrollment status
      await tx.enrollment.update({
        where: { id: applicationPayment.enrollmentId },
        data: {
          status: 'application_paid',
          applicationPaid: true,
        },
      })

      // Reduce course seats — only for limited-capacity courses with seats remaining.
      // updateMany lets us filter on non-unique fields and avoids negative seat counts.
      await tx.course.updateMany({
        where: {
          id: applicationPayment.enrollment.courseId,
          unlimitedSeats: false,
          seatsLeft: { gt: 0 },
        },
        data: {
          seatsLeft: {
            decrement: 1,
          },
        },
      })
    })

    console.log('Payment processed successfully for enrollment:', applicationPayment.enrollmentId)

    // Send the student receipt and notify admin. Email failures must NOT bubble
    // up: a thrown error here would make the webhook return 500 and Paystack
    // would retry the whole (already-processed) event. So each send is guarded
    // and logged, never rethrown.
    await sendEnrollmentEmails(applicationPayment, verificationResult.data)

  } catch (error) {
    console.error('Error handling charge success:', error)
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
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        email: enrollment.email,
        phone: enrollment.phone || undefined,
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
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        email: enrollment.email,
        phone: enrollment.phone || undefined,
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

    // Update application payment status
    await prisma.applicationPayment.update({
      where: { id: applicationPayment.id },
      data: {
        status: 'failed',
        paystackStatus: 'failed',
      },
    })

    // Update enrollment status
    await prisma.enrollment.update({
      where: { id: applicationPayment.enrollmentId },
      data: {
        status: 'pending', // Keep as pending so they can retry payment
      },
    })

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