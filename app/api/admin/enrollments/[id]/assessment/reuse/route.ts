import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'

// POST /api/admin/enrollments/[id]/assessment/reuse - for a fee-covered (or any assessment_paid)
// application of a student who has ALREADY been assessed: copy the student's latest completed
// assessment result onto this enrollment and move assessment_paid -> assessed (B16). The alternative
// is scheduling a new assessment (POST .../assessment).
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { assessments: { orderBy: { createdAt: 'desc' } } },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (enrollment.status !== 'assessment_paid') {
      return createErrorResponse('An assessment can only be reused while the enrollment is awaiting its assessment', 400)
    }

    // The panel sends the assessment it displayed (sourceAssessmentId) so a concurrent newer result
    // cannot be copied instead; without it, the student's latest completed assessment is used.
    const source = await prisma.assessment.findFirst({
      where: {
        status: 'completed',
        resultLevel: { not: null },
        enrollment: { studentId: enrollment.studentId },
        ...(typeof body.sourceAssessmentId === 'string' ? { id: body.sourceAssessmentId } : {}),
      },
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
    })
    if (!source) return createErrorResponse('This student has no completed assessment to reuse', 400)

    const requested = enrollment.assessments.find((a) => a.status === 'requested')
    const copy = {
      status: 'completed',
      resultLevel: source.resultLevel,
      resultNotes: source.resultNotes,
      assessorId: source.assessorId,
      completedAt: source.completedAt ?? new Date(),
      // The recommended offering belongs to the source course; do not carry it across courses.
      recommendedOfferingId: null,
    }

    const assessment = await prisma.$transaction(async (tx) => {
      const moved = await transitionEnrollment(tx, id, 'assessment_paid', 'assessed')
      if (!moved) throw new Error('STATE_CHANGED')
      return requested
        ? tx.assessment.update({ where: { id: requested.id }, data: copy })
        : tx.assessment.create({ data: { enrollmentId: id, arrangement: source.arrangement, ...copy } })
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'assessment.reuse',
      entityType: 'enrollment',
      entityId: id,
      metadata: {
        assessmentId: assessment.id,
        sourceAssessmentId: source.id,
        sourceEnrollmentId: source.enrollmentId,
        resultLevel: source.resultLevel,
        fromStatus: 'assessment_paid',
        toStatus: 'assessed',
      },
    })
    return createResponse({ assessment })
  } catch (error: any) {
    if (error?.message === 'STATE_CHANGED') {
      return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)
    }
    console.error('Reuse assessment error:', error)
    return createErrorResponse('Failed to reuse assessment', 500)
  }
})
