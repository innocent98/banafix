import { NextRequest } from 'next/server'
import { withAuth, createResponse } from '@/lib/middleware'
import { setSessionStatus } from '@/lib/scheduling/service'
import { schedulingErrorResponse } from '@/lib/scheduling/http'

// POST /api/admin/sessions/[id]/status  Body: { status: 'held'|'missed'|'cancelled'|'scheduled', note? } -> 200 { session }
// held/missed only once the class has started. cancelled frees the class number; missed keeps it.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const b = await req.json().catch(() => ({}))
    const session = await setSessionStatus(id, b.status, typeof b.note === 'string' ? b.note : undefined, admin)
    return createResponse({ session })
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to update the class')
  }
})
