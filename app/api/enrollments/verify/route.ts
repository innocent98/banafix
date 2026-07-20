import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { verifyPayment } from '@/lib/paystack'

// GET /api/enrollments/verify?reference=xxx
// Verify an application (registration) payment for the enrollment success page.
// The webhook is the authoritative source; this endpoint lets the success page
// confirm status immediately, even if the webhook hasn't arrived yet.
export async function GET(req: NextRequest) {
  try {
    const reference = new URL(req.url).searchParams.get('reference')

    if (!reference) {
      return createErrorResponse('Payment reference is required', 400)
    }

    const applicationPayment = await prisma.applicationPayment.findUnique({
      where: { paystackReference: reference },
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                title: true,
                sessionStartDate: true,
                instructor: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!applicationPayment) {
      return createErrorResponse('Payment record not found', 404)
    }

    // Trust the DB if the webhook already marked it complete; otherwise ask Paystack.
    let status = applicationPayment.status
    if (status !== 'completed' && status !== 'failed') {
      const result = await verifyPayment(reference)
      if (result.status && result.data.status === 'success') {
        status = 'completed'
      } else if (result.data?.status === 'failed') {
        status = 'failed'
      }
    }

    return createResponse({
      status, // 'completed' | 'pending' | 'failed'
      amount: applicationPayment.amount,
      receiptNumber: applicationPayment.receiptNumber,
      enrollment: {
        firstName: applicationPayment.enrollment.firstName,
        email: applicationPayment.enrollment.email,
        course: {
          title: applicationPayment.enrollment.course.title,
          instructor: applicationPayment.enrollment.course.instructor?.name || null,
          sessionStartDate: applicationPayment.enrollment.course.sessionStartDate,
        },
      },
    })
  } catch (error) {
    console.error('Verify payment error:', error)
    return createErrorResponse('Failed to verify payment', 500)
  }
}
