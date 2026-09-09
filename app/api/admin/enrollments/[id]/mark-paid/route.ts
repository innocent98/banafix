import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { calculateApplicationFee } from '@/lib/application-fee'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/enrollments/[id]/mark-paid - mark the application fee paid in
// cash for an existing enrollment (walk-in payment made at the office).
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const paymentMethod = body.paymentMethod || 'cash'

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { course: { select: { location: true } }, student: { select: { email: true, firstName: true, lastName: true } } },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (enrollment.applicationPaid) {
      return createErrorResponse('Application fee is already marked paid', 400)
    }

    const fee = calculateApplicationFee(enrollment.course.location)
    const amount = enrollment.applicationFeeAmount ?? fee.amount

    await prisma.$transaction([
      prisma.applicationPayment.create({
        data: {
          enrollmentId: enrollment.id,
          amount,
          currency: fee.currency,
          paymentMethod,
          paystackStatus: 'success',
          status: 'completed',
          paidAt: new Date(),
          receiptNumber: `APP-${Date.now()}-${enrollment.id.slice(-6)}`,
          billingEmail: enrollment.student.email,
          billingName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        },
      }),
      prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { applicationPaid: true, status: 'enrolled' },
      }),
    ])

    await logAdminAction({
      adminId: admin.id,
      action: 'application.cash_paid',
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: { amount, paymentMethod },
    })

    return createResponse({ message: 'Application fee marked as paid' })
  } catch (error) {
    console.error('Mark application fee paid error:', error)
    return createErrorResponse('Failed to mark application fee paid', 500)
  }
})
