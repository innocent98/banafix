import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { drainOutbox } from '@/lib/messaging/outbox'

export const maxDuration = 60

// POST /api/admin/messages/dispatch { limit? } — "Send now": delivers one bounded chunk of due messages.
// The admin UI calls it repeatedly until `remaining` is 0, so a large broadcast needs no long request.
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(100, Math.max(1, Number(body.limit) || 25))
    return createResponse(await drainOutbox({ limit, budgetMs: 40_000 }))
  } catch (error) {
    console.error('Dispatch messages error:', error)
    return createErrorResponse('Failed to send messages', 500)
  }
})
