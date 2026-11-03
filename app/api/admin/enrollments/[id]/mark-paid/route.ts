import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getAssessmentFee, AssessmentFeeError, ASSESSMENT_FEE_CURRENCY } from '@/lib/assessment-fee'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/enrollments/[id]/mark-paid - mark the assessment fee paid in
// cash for an existing pending enrollment (moves it to assessment_paid, no seat change) (walk-in payment made at the office).
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const paymentMethod = body.paymentMethod || 'cash'

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { student: { select: { email: true, firstName: true, lastName: true } } },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (enrollment.applicationPaid) {
      return createErrorResponse('Assessment fee is already marked paid', 400)
    }
    if (enrollment.status !== 'pending') {
      return createErrorResponse(`Cannot record the assessment fee on a ${enrollment.status} enrollment`, 400)
    }

    // Snapshot taken at application time wins; otherwise the location's current fee.
    let amount = enrollment.applicationFeeAmount
    if (amount == null) {
      if (!enrollment.locationId) return createErrorResponse('Enrollment has no location', 400)
      try {
        amount = await getAssessmentFee(prisma, enrollment.locationId)
      } catch (e) {
        if (e instanceof AssessmentFeeError) return createErrorResponse(e.message, 400)
        throw e
      }
    }

    // Payment row + status move in ONE transaction; the compare-and-set makes a double click harmless.
    const moved = await prisma.$transaction(async (tx) => {
      const won = await transitionEnrollment(tx, enrollment.id, 'pending', 'assessment_paid', {
        applicationPaid: true,
      })
      if (!won) return false
      await tx.applicationPayment.create({
        data: {
          enrollmentId: enrollment.id,
          amount: amount as number,
          currency: ASSESSMENT_FEE_CURRENCY,
          paymentMethod,
          paystackStatus: 'success',
          status: 'completed',
          paidAt: new Date(),
          receiptNumber: `APP-${Date.now()}-${enrollment.id.slice(-6)}`,
          billingEmail: enrollment.student.email,
          billingName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        },
      })
      return true
    })
    if (!moved) return createErrorResponse('Assessment fee is already marked paid', 400)

    await logAdminAction({
      adminId: admin.id,
      action: 'application.cash_paid',
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: { amount, paymentMethod, toStatus: 'assessment_paid' },
    })

    return createResponse({ message: 'Assessment fee marked as paid' })
  } catch (error) {
    console.error('Mark application fee paid error:', error)
    return createErrorResponse('Failed to mark assessment fee paid', 500)
  }
})
