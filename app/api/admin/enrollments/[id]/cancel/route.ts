import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import { canTransition } from '@/lib/enrollment-status'

// POST /api/admin/enrollments/[id]/cancel - any non-terminal status -> cancelled.
// The assessment fee stays non-refundable: cancelling never touches payments.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const enrollment = await prisma.enrollment.findUnique({ where: { id }, select: { status: true } })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (!canTransition(enrollment.status, 'cancelled')) {
      return createErrorResponse(`A ${enrollment.status} enrollment cannot be cancelled`, 400)
    }
    const from = enrollment.status as Parameters<typeof transitionEnrollment>[2]
    const moved = await transitionEnrollment(prisma, id, from, 'cancelled')
    if (!moved) return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)

    await logAdminAction({
      adminId: admin.id,
      action: 'enrollment.cancel',
      entityType: 'enrollment',
      entityId: id,
      metadata: { fromStatus: from, toStatus: 'cancelled', reason: body.reason ?? null },
    })
    return createResponse({ message: 'Enrollment cancelled' })
  } catch (error) {
    console.error('Cancel enrollment error:', error)
    return createErrorResponse('Failed to cancel enrollment', 500)
  }
})
