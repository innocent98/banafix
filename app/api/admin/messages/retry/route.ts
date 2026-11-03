import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { logAdminAction } from '@/lib/audit'
import { retryMessages } from '@/lib/messaging/outbox'

// POST /api/admin/messages/retry { ids?: string[], includeSkipped?: boolean } — re-queue failed (and optionally provider-skipped) messages
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const body = await req.json().catch(() => ({}))
    const ids = Array.isArray(body.ids) && body.ids.every((i: unknown) => typeof i === 'string') ? (body.ids as string[]) : undefined
    if (body.ids !== undefined && !ids) return createErrorResponse('ids must be a list of message ids', 400)
    const requeued = await retryMessages({ ids, includeSkipped: body.includeSkipped === true })
    await logAdminAction({
      adminId: admin.id,
      action: 'message.retry',
      entityType: 'outbox',
      entityId: ids?.length === 1 ? ids[0] : 'bulk',
      metadata: { requeued, ids: ids ?? 'all-failed', includeSkipped: body.includeSkipped === true },
    })
    return createResponse({ requeued })
  } catch (error) {
    console.error('Retry messages error:', error)
    return createErrorResponse('Failed to retry messages', 500)
  }
})
