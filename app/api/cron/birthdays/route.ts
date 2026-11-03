import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { logAdminAction } from '@/lib/audit'
import { checkCronAuth } from '@/lib/cron-auth'
import { runBirthdays } from '@/lib/messaging/runs'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/cron/birthdays — daily Vercel Cron; guarded by CRON_SECRET.
// Enqueues student + parent wishes through the outbox (idempotent per recipient per year) and drains.
export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req)
  if (denied) return denied

  try {
    const result = await runBirthdays()
    await logAdminAction({
      adminId: null,
      action: 'birthday.run',
      entityType: 'birthday',
      entityId: result.date,
      metadata: { candidates: result.candidates, queued: result.queued, sent: result.sent, failed: result.failed, skipped: result.skipped },
    })
    return createResponse(result)
  } catch (error) {
    console.error('Birthday cron error:', error)
    return createErrorResponse('Birthday cron failed', 500)
  }
}
