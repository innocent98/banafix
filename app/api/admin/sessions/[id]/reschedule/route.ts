import { NextRequest } from 'next/server'
import { withAuth, createResponse } from '@/lib/middleware'
import { rescheduleSession, SchedulingError } from '@/lib/scheduling/service'
import { schedulingErrorResponse } from '@/lib/scheduling/http'

// POST /api/admin/sessions/[id]/reschedule
// Body: { startsAt: ISO instant, instructorId?, durationMins? (45|60), mode?, overrideAvailability?, overrideReason? }
// Old class becomes `rescheduled`, a new `scheduled` class takes the same sequence. 200 { session }.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const b = (await req.json().catch(() => null)) ?? {}
    const startsAt = new Date(b.startsAt)
    if (typeof b.startsAt !== 'string' || Number.isNaN(startsAt.getTime())) throw new SchedulingError(400, 'BAD_START', 'startsAt must be a valid date and time')
    const session = await rescheduleSession(
      id,
      {
        startsAt,
        instructorId: typeof b.instructorId === 'string' && b.instructorId ? b.instructorId : undefined,
        durationMins: b.durationMins === undefined ? undefined : Number(b.durationMins),
        mode: b.mode || undefined,
        overrideAvailability: b.overrideAvailability === true,
        overrideReason: typeof b.overrideReason === 'string' ? b.overrideReason : undefined,
      },
      admin,
    )
    return createResponse({ session })
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to reschedule the class')
  }
})
