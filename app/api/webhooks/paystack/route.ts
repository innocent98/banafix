import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { validateWebhookSignature, verifyPayment } from '@/lib/paystack'

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
            course: true,
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
    await prisma.$transaction(async (tx) => {
      // Update enrollment status
      await tx.enrollment.update({
        where: { id: applicationPayment.enrollmentId },
        data: {
          status: 'application_paid',
          applicationPaid: true,
        },
      })

      // Reduce course seats
      await tx.course.update({
        where: { id: applicationPayment.enrollment.courseId },
        data: {
          seatsLeft: {
            decrement: 1,
          },
        },
      })
    })

    console.log('Payment processed successfully for enrollment:', applicationPayment.enrollmentId)

    // TODO: Generate and send receipt email
    // This will be implemented in the next phase

  } catch (error) {
    console.error('Error handling charge success:', error)
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