import type { Prisma } from '@prisma/client'
import { baseVars, composeMessages } from './compose'
import { feedbackScope } from './idempotency'
import { enqueueMessages, scheduleDrainAfterResponse } from './outbox'
import { getTemplate } from './templates'

export function feedbackInbox(): string {
  return process.env.FEEDBACK_EMAIL || process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'support@banafix.com'
}

/** Tells the feedback inbox about a new submission, through the outbox (idempotent per feedback id). */
export async function emitFeedbackNotice(
  db: Pick<Prisma.TransactionClient, 'messageTemplate' | 'outboundMessage'>,
  f: { id: string; authorName: string; relationship: string | null; rating: number | null; text: string; source: string; allowTestimonial: boolean },
): Promise<number> {
  const template = await getTemplate(db, 'feedback_admin_notice')
  if (!template.isActive) return 0
  const base = String(baseVars().siteUrl).replace(/\/$/, '')
  const rows = composeMessages({
    template: { ...template, channels: ['EMAIL'] },
    recipient: { type: 'admin', id: 'feedback-inbox', name: 'Banafix feedback inbox', email: feedbackInbox() },
    vars: {
      ...baseVars(),
      authorName: f.authorName,
      relationship: f.relationship ?? 'no relationship given',
      rating: f.rating ?? 'not rated',
      feedbackText: f.text,
      source: f.source,
      allowTestimonial: f.allowTestimonial ? 'Yes' : 'No',
      adminUrl: `${base}/admin/feedback`,
    },
    scope: feedbackScope(f.id),
  })
  const { created } = await enqueueMessages(db, rows)
  if (created > 0) scheduleDrainAfterResponse()
  return created
}
