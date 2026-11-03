import { NextRequest } from 'next/server'
import { withAuth, createResponse } from '@/lib/middleware'
import { getTimetable } from '@/lib/scheduling/service'
import { schedulingErrorResponse } from '@/lib/scheduling/http'

// GET /api/admin/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD[&instructorId=] (Lagos local dates, inclusive)
// -> { sessions, availability (for instructorId), needsScheduling }
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const sp = new URL(req.url).searchParams
    const data = await getTimetable({ from: sp.get('from') ?? '', to: sp.get('to') ?? '', instructorId: sp.get('instructorId') || undefined })
    return createResponse(data)
  } catch (e) {
    return schedulingErrorResponse(e, 'Failed to load the timetable')
  }
})
