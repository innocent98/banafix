import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { EVENTS } from '@/lib/messaging/events'
import { listTemplates } from '@/lib/messaging/templates'

// GET /api/admin/templates — every template (saved row or code default) with its allowed merge fields
export const GET = withAuth(async () => {
  try {
    const templates = (await listTemplates(prisma)).map((t) => ({ ...t, fields: EVENTS[t.key].fields }))
    return createResponse({ templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return createErrorResponse('Failed to fetch templates', 500)
  }
})
