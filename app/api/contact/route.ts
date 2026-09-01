/**
 * POST /api/contact — the public "Send a message" form on /contact.
 *
 * Unauthenticated send endpoint, so it carries three cheap defences: a
 * honeypot field, a per-IP throttle, and a strict allow-list on the subject.
 * It deliberately never reports success it did not achieve — a failed Resend
 * send returns 5xx so the form can tell the visitor to use WhatsApp instead.
 *
 * Resend conventions (client construction, FROM_EMAIL / SUPPORT_EMAIL /
 * ADMIN_EMAIL fallbacks) mirror `lib/email.ts`. They are re-declared here
 * rather than imported because `lib/email.ts` is outside this task's scope;
 * see the report — this send belongs there eventually.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

import { createResponse, createErrorResponse } from '@/lib/middleware'
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_SUBJECT_PLACEHOLDER,
  validateContactMessage,
  type ContactMessageInput,
} from '@/lib/contact-message'
import { SITE_EMAIL, SITE_PHONE_DISPLAY } from '@/lib/site'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@banafix.com'
/** Support inbox first, admin inbox as the fallback, per the brief. */
const TO_EMAIL = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'support@banafix.com'

/* -------------------------------------------------------------------------- */
/*  Throttle                                                                   */
/* -------------------------------------------------------------------------- */

const THROTTLE_WINDOW_MS = 10 * 60 * 1000
const THROTTLE_MAX = 3

/**
 * In-memory and therefore per-instance: on Vercel each lambda keeps its own
 * counter, so this slows a naive flood rather than guaranteeing a global cap.
 * That is the right trade for a contact form — a durable limiter would mean a
 * Redis dependency for one endpoint. If abuse becomes real, move it to the
 * edge (the nginx/WAF layer) rather than growing this map.
 */
const hits = new Map<string, number[]>()

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  return first || req.headers.get('x-real-ip') || 'unknown'
}

function isThrottled(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < THROTTLE_WINDOW_MS)

  if (recent.length >= THROTTLE_MAX) {
    hits.set(ip, recent)
    return true
  }

  recent.push(now)
  hits.set(ip, recent)

  // Opportunistic sweep so the map cannot grow without bound on a long-lived
  // instance.
  if (hits.size > 500) {
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= THROTTLE_WINDOW_MS)) hits.delete(key)
    }
  }

  return false
}

/* -------------------------------------------------------------------------- */
/*  Email                                                                      */
/* -------------------------------------------------------------------------- */

/** Visitor-supplied text goes into an HTML email — escape it, every field. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function enquiryHtml(input: ContactMessageInput): string {
  const row = (label: string, value: string) =>
    `<div class="info-row"><span class="info-label">${label}:</span><span>${escapeHtml(value)}</span></div>`

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New website enquiry</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #101a28; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .info-row { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
            .info-label { font-weight: bold; color: #64748b; }
            .message { background: #fbf5ea; border: 1px solid #f0e2c9; border-radius: 8px; padding: 16px; margin-top: 18px; white-space: pre-wrap; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>BANAFIX</h1>
                <p>New website enquiry</p>
            </div>
            <div class="content">
                ${row('Name', input.name)}
                ${row('Email', input.email)}
                ${input.phone ? row('Phone', input.phone) : ''}
                ${row('Subject', input.subject || 'Not specified')}
                <div class="message">${escapeHtml(input.message)}</div>
                <p style="margin-top:18px;color:#64748b;font-size:14px;">Reply directly to this email to answer ${escapeHtml(input.name)}.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

function enquiryText(input: ContactMessageInput): string {
  return [
    `New website enquiry`,
    ``,
    `Name:    ${input.name}`,
    `Email:   ${input.email}`,
    `Phone:   ${input.phone || '—'}`,
    `Subject: ${input.subject || 'Not specified'}`,
    ``,
    input.message,
  ].join('\n')
}

/* -------------------------------------------------------------------------- */
/*  Handler                                                                    */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch {
    return createErrorResponse('We could not read that submission. Please try again.', 400)
  }

  // Honeypot: a filled hidden field means a bot. Return the same 200 a real
  // send returns so the bot learns nothing, but send no email.
  const honeypot = body[CONTACT_HONEYPOT_FIELD]
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    console.warn('Contact form honeypot tripped; discarding submission')
    return createResponse({ success: true })
  }

  const result = validateContactMessage({
    name: body.name,
    phone: body.phone,
    email: body.email,
    // The placeholder option is "no subject chosen", not a subject.
    subject: body.subject === CONTACT_SUBJECT_PLACEHOLDER ? '' : body.subject,
    message: body.message,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Please check the highlighted fields.', fields: result.errors },
      { status: 400 },
    )
  }

  const input = result.value

  // Throttle *after* validation, so a visitor who fat-fingers their email three
  // times is not locked out — only submissions that would actually send count.
  const ip = clientIp(req)
  if (isThrottled(ip)) {
    return createErrorResponse(
      `You have sent a few messages already. Please give it a few minutes, or reach us on WhatsApp at ${SITE_PHONE_DISPLAY}.`,
      429,
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !apiKey.trim()) {
    console.error('Contact form: RESEND_API_KEY is not set — cannot deliver enquiry')
    return createErrorResponse(
      `Our message service is not available right now. Please email ${SITE_EMAIL} or WhatsApp ${SITE_PHONE_DISPLAY} and we will pick it up.`,
      503,
    )
  }

  try {
    const resend = new Resend(apiKey)
    const sent = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: input.email,
      subject: `New website enquiry — ${input.subject || 'General'} (${input.name})`,
      html: enquiryHtml(input),
      text: enquiryText(input),
    })

    if (sent.error) {
      // The provider detail goes to the logs, never to the visitor.
      console.error('Contact form: Resend rejected the send:', sent.error)
      return createErrorResponse(
        `We could not deliver your message just now. Please email ${SITE_EMAIL} or WhatsApp ${SITE_PHONE_DISPLAY} and we will reply the same day.`,
        502,
      )
    }

    return createResponse({ success: true })
  } catch (error) {
    console.error('Contact form: unexpected error sending enquiry:', error)
    return createErrorResponse(
      `We could not deliver your message just now. Please email ${SITE_EMAIL} or WhatsApp ${SITE_PHONE_DISPLAY} and we will reply the same day.`,
      502,
    )
  }
}
