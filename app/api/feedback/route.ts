/**
 * POST /api/feedback — the public feedback form (/feedback). No login, so it carries the same cheap
 * defences as /api/contact: a honeypot, a per-IP throttle, strict validation. Stored in the DB first (the
 * feedback is never lost to a mail problem); the admin notice goes through the outbox.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { FEEDBACK_HONEYPOT_FIELD, validateFeedback } from '@/lib/feedback'
import { clientIp, createThrottle } from '@/lib/throttle'
import { emitFeedbackNotice } from '@/lib/messaging/feedback-notice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const isThrottled = createThrottle({ windowMs: 10 * 60 * 1000, max: 3 })

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return createErrorResponse('We could not read that submission. Please try again.', 400)
  }

  // Honeypot: same 200 a real submission gets, nothing stored.
  const trap = body[FEEDBACK_HONEYPOT_FIELD]
  if (typeof trap === 'string' && trap.trim() !== '') return createResponse({ success: true })

  const result = validateFeedback(body)
  if (!result.ok) {
    return NextResponse.json({ error: 'Please check the highlighted fields.', fields: result.errors }, { status: 400 })
  }

  // Throttle after validation so a typo is not punished, only submissions that would be stored.
  if (isThrottled(clientIp(req))) {
    return createErrorResponse('You have sent a few messages already. Please try again in a few minutes.', 429)
  }

  try {
    const feedback = await prisma.feedback.create({ data: { ...result.value, source: 'WEB' } })
    try {
      await emitFeedbackNotice(prisma, feedback)
    } catch (e) {
      console.error('Feedback notice could not be queued (feedback is saved):', e)
    }
    return createResponse({ success: true }, 201)
  } catch (error) {
    console.error('Feedback submit error:', error)
    return createErrorResponse('We could not save your feedback just now. Please try again.', 500)
  }
}
