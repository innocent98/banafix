import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { getAvailability, setAvailability } from '@/lib/scheduling/service'
import { schedulingErrorResponse } from '@/lib/scheduling/http'
import { validateAvailabilitySlots } from '@/lib/scheduling/availability-input'

// GET /api/admin/instructors/[id]/availability - weekly windows (minutes from Lagos local midnight, weekday ISO 1..7)
export const GET = withAuth(async (_req: NextRequest, _admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    return createResponse({ availability: await getAvailability(id) })
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to load availability')
  }
})

// PUT /api/admin/instructors/[id]/availability - replace the whole week.
// Body: { slots: [{ weekday: 1..7, start: 'HH:MM', end: 'HH:MM'|'24:00', locationId, mode: CENTRE|HOME|ONLINE }] }
export const PUT = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const parsed = validateAvailabilitySlots(body.slots)
    if (!parsed.ok) return createErrorResponse(parsed.error, 400)
    const availability = await setAvailability(id, parsed.slots, admin)
    return createResponse({ availability })
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to save availability')
  }
})
