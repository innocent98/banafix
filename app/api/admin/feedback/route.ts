import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { FEEDBACK_SOURCES, FEEDBACK_STATUSES, validateFeedback } from '@/lib/feedback'

// GET /api/admin/feedback?status=&source=&testimonial=1
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get('status')
    const source = sp.get('source')
    if (status && !(FEEDBACK_STATUSES as readonly string[]).includes(status)) return createErrorResponse('Unknown status', 400)
    if (source && !(FEEDBACK_SOURCES as readonly string[]).includes(source)) return createErrorResponse('Unknown source', 400)
    const where: Prisma.FeedbackWhereInput = {
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      ...(sp.get('testimonial') === '1' ? { allowTestimonial: true } : {}),
    }
    const [feedback, counts] = await Promise.all([
      prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.feedback.groupBy({ by: ['status'], _count: { _all: true } }),
    ])
    const byStatus = { new: 0, reviewed: 0, archived: 0, ...Object.fromEntries(counts.map((c) => [c.status, c._count._all])) }
    return createResponse({ feedback, counts: byStatus })
  } catch (error) {
    console.error('Get feedback error:', error)
    return createErrorResponse('Failed to fetch feedback', 500)
  }
})

// POST /api/admin/feedback — add feedback by hand (forwarded email, WhatsApp message, in person)
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const b = await req.json().catch(() => ({}))
    const result = validateFeedback(b)
    if (!result.ok) return createResponse({ error: 'Please check the highlighted fields.', fields: result.errors }, 400)
    const source = typeof b.source === 'string' && (FEEDBACK_SOURCES as readonly string[]).includes(b.source) && b.source !== 'WEB' ? b.source : 'ADMIN'
    const feedback = await prisma.feedback.create({ data: { ...result.value, source } })
    await logAdminAction({ adminId: admin.id, action: 'feedback.create', entityType: 'feedback', entityId: feedback.id, metadata: { source, allowTestimonial: feedback.allowTestimonial } })
    return createResponse({ feedback }, 201)
  } catch (error) {
    console.error('Create feedback error:', error)
    return createErrorResponse('Failed to add feedback', 500)
  }
})
