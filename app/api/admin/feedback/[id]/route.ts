import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { FEEDBACK_STATUSES } from '@/lib/feedback'

type Ctx = { params: Promise<{ id: string }> }

// PATCH /api/admin/feedback/[id] { status?, allowTestimonial? } — review state, and recording permission obtained later
export const PATCH = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const b = await req.json().catch(() => ({}))
    const data: { status?: string; allowTestimonial?: boolean } = {}
    if (b.status !== undefined) {
      if (typeof b.status !== 'string' || !(FEEDBACK_STATUSES as readonly string[]).includes(b.status)) return createErrorResponse('Unknown status', 400)
      data.status = b.status
    }
    if (b.allowTestimonial !== undefined) {
      if (typeof b.allowTestimonial !== 'boolean') return createErrorResponse('allowTestimonial must be true or false', 400)
      data.allowTestimonial = b.allowTestimonial
    }
    if (Object.keys(data).length === 0) return createErrorResponse('Nothing to update', 400)
    const before = await prisma.feedback.findUnique({ where: { id } })
    if (!before) return createErrorResponse('Feedback not found', 404)
    const feedback = await prisma.feedback.update({ where: { id }, data })
    await logAdminAction({
      adminId: admin.id, action: 'feedback.update', entityType: 'feedback', entityId: id,
      metadata: { before: { status: before.status, allowTestimonial: before.allowTestimonial }, after: data },
    })
    return createResponse({ feedback })
  } catch (error) {
    console.error('Update feedback error:', error)
    return createErrorResponse('Failed to update feedback', 500)
  }
})
