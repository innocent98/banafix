import type { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse } from '@/lib/middleware'

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Returns a response to send back, or null when authorised. */
export function checkCronAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return createErrorResponse('CRON_SECRET not configured', 500)
  if (req.headers.get('authorization') !== `Bearer ${secret}`) return createErrorResponse('Unauthorized', 401)
  return null
}
