import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { verifyPayment } from '@/lib/paystack'
import { settleAssessmentFee } from '@/lib/assessment-payment'

// GET /api/enrollments/[id] - enrollment details incl. student PII. Admin-only (was unauthenticated;
// nothing in the app called it). The admin panel uses GET /api/admin/enrollments/[id].
export const GET = withAuth(async (
  req: NextRequest,
  admin,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const params = await context.params
    const enrollmentId = params.id

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, address: true },
        },
        course: {
          select: {
            title: true,
            instrument: true,
            level: true,
            duration: true,
            sessionStartDate: true,
            instructor: {
              select: {
                name: true,
              },
            },
          },
        },
        applicationPayments: {
          select: {
            id: true,
            amount: true,
            status: true,
            receiptNumber: true,
            paidAt: true,
            paystackReference: true,
            paystackStatus: true,
            receiptGenerated: true,
            receiptSent: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        tuitionPayments: {
          select: {
            id: true,
            amount: true,
            status: true,
            receiptNumber: true,
            paidAt: true,
            description: true,
            receiptGenerated: true,
            receiptSent: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404)
    }

    return createResponse({ enrollment })

  } catch (error) {
    console.error('Get enrollment error:', error)
    return createErrorResponse('Failed to fetch enrollment', 500)
  }
})

// POST /api/enrollments/[id]/verify-payment - Manually verify payment status
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const enrollmentId = params.id

    // Find the enrollment and its pending application payment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        applicationPayments: {
          where: {
            status: 'pending',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404)
    }

    const pendingPayment = enrollment.applicationPayments[0]
    if (!pendingPayment || !pendingPayment.paystackReference) {
      return createErrorResponse('No pending payment found', 400)
    }

    // Verify payment with Paystack
    const verificationResult = await verifyPayment(pendingPayment.paystackReference)

    if (!verificationResult.status) {
      return createErrorResponse('Payment verification failed', 400)
    }

    const paymentData = verificationResult.data

    // Update payment status based on Paystack response
    if (paymentData.status === 'success') {
      // Same settle path as the webhook: atomic, idempotent, no seat decrement.
      await settleAssessmentFee(prisma, {
        paymentId: pendingPayment.id,
        enrollmentId,
        paystack: paymentData,
      })

      return createResponse({
        message: 'Payment verified successfully',
        status: 'success',
        payment: {
          amount: paymentData.amount / 100, // Convert from kobo to naira
          paidAt: paymentData.paid_at,
          reference: paymentData.reference,
        },
      })

    } else if (paymentData.status === 'failed') {
      await prisma.applicationPayment.update({
        where: { id: pendingPayment.id },
        data: {
          status: 'failed',
          paystackStatus: 'failed',
        },
      })

      return createResponse({
        message: 'Payment verification failed',
        status: 'failed',
        reason: paymentData.gateway_response,
      })

    } else {
      // Payment is still pending
      return createResponse({
        message: 'Payment is still pending',
        status: 'pending',
      })
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return createErrorResponse('Failed to verify payment', 500)
  }
}