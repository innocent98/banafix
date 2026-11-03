import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { checkCronAuth } from '@/lib/cron-auth'
import { drainOutbox } from '@/lib/messaging/outbox'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET /api/cron/messages — daily safety-net drain: due scheduled rows (e.g. feedback requests) and retries.
// Tighten the schedule in vercel.json on a plan that allows sub-daily crons.
export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req)
  if (denied) return denied

  try {
    return createResponse(await drainOutbox({ limit: 200, budgetMs: 45_000 }))
  } catch (error) {
    console.error('Outbox drain cron error:', error)
    return createErrorResponse('Outbox drain failed', 500)
  }
}
