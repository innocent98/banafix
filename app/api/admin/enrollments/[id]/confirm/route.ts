import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'

// POST /api/admin/enrollments/[id]/confirm - audited "Confirm enrolment": plan_agreed -> enrolled.
// (Recording a tuition payment on a plan_agreed enrollment does the same; see the tuition route.)
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const enrollment = await prisma.enrollment.findUnique({ where: { id }, select: { status: true } })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (enrollment.status !== 'plan_agreed') {
      return createErrorResponse('Only an enrollment with an agreed plan can be confirmed', 400)
    }
    const moved = await transitionEnrollment(prisma, id, 'plan_agreed', 'enrolled')
    if (!moved) return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)

    await logAdminAction({
      adminId: admin.id,
      action: 'enrollment.confirm',
      entityType: 'enrollment',
      entityId: id,
      metadata: { fromStatus: 'plan_agreed', toStatus: 'enrolled', note: body.note ?? null },
    })
    return createResponse({ message: 'Enrolment confirmed' })
  } catch (error) {
    console.error('Confirm enrolment error:', error)
    return createErrorResponse('Failed to confirm enrolment', 500)
  }
})
