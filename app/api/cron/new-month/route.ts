import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { logAdminAction } from '@/lib/audit'
import { checkCronAuth } from '@/lib/cron-auth'
import { runNewMonth } from '@/lib/messaging/runs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/cron/new-month — 1st of the month, 06:00 Lagos; guarded by CRON_SECRET.
// Idempotent per Lagos calendar month, so a late or repeated run cannot double-send.
export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req)
  if (denied) return denied

  try {
    const result = await runNewMonth()
    await logAdminAction({ adminId: null, action: 'newmonth.run', entityType: 'newmonth', entityId: result.month, metadata: result })
    return createResponse(result)
  } catch (error) {
    console.error('New-month cron error:', error)
    return createErrorResponse('New-month cron failed', 500)
  }
}
