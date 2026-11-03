import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

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
