import { NextRequest } from 'next/server'
import { withAuth, createResponse } from '@/lib/middleware'
import { createSchedule, getEnrollmentSchedule, planSchedule, SchedulingError } from '@/lib/scheduling/service'
import { schedulingErrorResponse } from '@/lib/scheduling/http'

// GET /api/admin/enrollments/[id]/schedule -> { enrollment (plan + preferences), sessions, instructors who teach the course }
export const GET = withAuth(async (_req: NextRequest, _admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    return createResponse(await getEnrollmentSchedule(id))
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to load the schedule')
  }
})

// POST /api/admin/enrollments/[id]/schedule - assign an instructor and generate the classes from the plan + preferences.
// Body: { instructorId, startDate: 'YYYY-MM-DD', count?, mode?, dryRun?, allowPartial?, overrideAvailability?, overrideReason? }
//   dryRun:true -> 200 { plan } and nothing is written. Otherwise 201 { sessions, plan }.
//   409 INSTRUCTOR_BUSY / STUDENT_BUSY (never overridable) · 422 UNPLACEABLE / OUTSIDE_AVAILABILITY · 400 PLAN_MISSING, NOT_PLANNED, ...
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const b = await req.json().catch(() => ({}))
    if (typeof b.instructorId !== 'string' || !b.instructorId) throw new SchedulingError(400, 'INSTRUCTOR_REQUIRED', 'Choose an instructor')
    const input = {
      instructorId: b.instructorId,
      startDate: b.startDate,
      count: b.count === undefined || b.count === null || b.count === '' ? undefined : Number(b.count),
      mode: b.mode || undefined,
      allowPartial: b.allowPartial === true,
      overrideAvailability: b.overrideAvailability === true,
      overrideReason: typeof b.overrideReason === 'string' ? b.overrideReason : undefined,
    }
    if (b.dryRun === true) return createResponse({ plan: await planSchedule(id, input) })
    const { sessions, plan } = await createSchedule(id, input, admin)
    return createResponse({ sessions, plan }, 201)
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to schedule classes')
  }
})
