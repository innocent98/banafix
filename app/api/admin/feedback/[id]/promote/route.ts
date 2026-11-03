import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { createTestimonial, toTestimonialInput } from '@/lib/feedback-promotion'

type Ctx = { params: Promise<{ id: string }> }

// POST /api/admin/feedback/[id]/promote — one-click: creates an UNPUBLISHED testimonial (needs the author's permission)
export const POST = withAuth(async (_req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const feedback = await prisma.feedback.findUnique({ where: { id } })
    if (!feedback) return createErrorResponse('Feedback not found', 404)
    if (feedback.testimonialId) return createErrorResponse('This feedback is already a testimonial', 409)
    if (!feedback.allowTestimonial) {
      return createErrorResponse('The author has not given permission to quote this feedback. Record their permission first.', 409)
    }
    const testimonialId = await createTestimonial(toTestimonialInput(feedback))
    const updated = await prisma.feedback.update({ where: { id }, data: { testimonialId, status: 'reviewed' } })
    await logAdminAction({ adminId: admin.id, action: 'feedback.promote', entityType: 'feedback', entityId: id, metadata: { testimonialId } })
    return createResponse({ feedback: updated, testimonialId })
  } catch (error) {
    console.error('Promote feedback error:', error)
    return createErrorResponse('Failed to promote feedback', 500)
  }
})
