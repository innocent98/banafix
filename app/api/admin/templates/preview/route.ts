import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { EVENTS, isTemplateKey } from '@/lib/messaging/events'
import { SAMPLE_VARS } from '@/lib/messaging/templates'
import { renderEmailHtml, renderTemplate, smsSegments, validateTemplate } from '@/lib/messaging/template'

// POST /api/admin/templates/preview { key, subject, body, shortBody? } — renders with sample data; nothing is stored or sent
export const POST = withAuth(async (req: NextRequest) => {
  const b = await req.json().catch(() => ({}))
  const key = typeof b.key === 'string' ? b.key : 'announcement'
  if (key !== 'announcement' && !isTemplateKey(key)) return createErrorResponse('Unknown template key', 404)
  if (typeof b.subject !== 'string' || typeof b.body !== 'string') return createErrorResponse('subject and body are required', 400)
  const shortBody = typeof b.shortBody === 'string' && b.shortBody.trim() ? b.shortBody : null
  const check = validateTemplate(key, { subject: b.subject, body: b.body, shortBody })
  const category = key === 'announcement' ? 'MARKETING' : EVENTS[key as keyof typeof EVENTS].category
  const subject = renderTemplate(b.subject, SAMPLE_VARS)
  const text = renderTemplate(b.body, SAMPLE_VARS)
  const sms = renderTemplate(shortBody ?? b.body, SAMPLE_VARS)
  return createResponse({
    unknownFields: check.ok ? [] : check.unknown,
    subject,
    text,
    html: renderEmailHtml({ subject, body: text, category, supportEmail: SAMPLE_VARS.supportEmail }),
    sms: { text: sms, ...smsSegments(sms) },
  })
})
