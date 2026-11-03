import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getAssessmentFee, AssessmentFeeError, ASSESSMENT_FEE_CURRENCY } from '@/lib/assessment-fee'
import {
  coverApplication,
  findCoveringFeePayment,
  lockStudent,
  recordCashAssessmentFee,
  FeeAlreadyPaidError,
  FeeStateChangedError,
} from '@/lib/assessment-payment'
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

    // Student row locked, fee-already-paid check, pending Paystack payments superseded, payment row
    // and status move: ONE transaction (lib/assessment-payment.ts).
    let result: { paymentId: string | null; supersededCount: number; covered: boolean }
    try {
      result = await prisma.$transaction(async (tx) => {
        await lockStudent(tx, enrollment.studentId)
        // The student already paid the (once per student) fee, e.g. an earlier application settled
        // while this one sat pending. NO second fee is recorded; the application is covered so it
        // is not stranded at `pending`.
        const covering = await findCoveringFeePayment(tx, enrollment.studentId)
        if (covering) {
          await coverApplication(tx, enrollment.id, covering.id)
          return { paymentId: null, supersededCount: 0, covered: true }
        }
        const recorded = await recordCashAssessmentFee(tx, {
          enrollmentId: enrollment.id,
          studentId: enrollment.studentId,
          amount: amount as number,
          currency: ASSESSMENT_FEE_CURRENCY,
          paymentMethod,
          billingEmail: enrollment.student.email,
          billingName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        })
        return { ...recorded, covered: false }
      })
    } catch (e) {
      if (e instanceof FeeAlreadyPaidError) return createErrorResponse(e.message, 409)
      if (e instanceof FeeStateChangedError) return createErrorResponse('Assessment fee is already marked paid', 409)
      throw e
    }

    await logAdminAction({
      adminId: admin.id,
      action: 'application.cash_paid',
      entityType: 'enrollment',
      entityId: enrollment.id,
      metadata: { amount: result.covered ? 0 : amount, paymentMethod: result.covered ? null : paymentMethod, toStatus: 'assessment_paid', feeCovered: result.covered, supersededPaystackPayments: result.supersededCount },
    })

    return createResponse({
      feeCovered: result.covered,
      message: result.covered
        ? 'This student already paid the assessment fee, so no second fee was recorded; the application is now covered.'
        : 'Assessment fee marked as paid',
    })
  } catch (error) {
    console.error('Mark application fee paid error:', error)
    return createErrorResponse('Failed to mark assessment fee paid', 500)
  }
})
