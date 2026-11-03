import type { Prisma } from '@prisma/client'
import { DEFAULT_TEMPLATES } from './default-templates'
import { EVENTS, TEMPLATE_KEYS, type TemplateKey } from './events'
import { CHANNELS, type Category, type Channel } from './types'
import type { TemplateCopyRow } from './compose'

export type TemplateDb = Pick<Prisma.TransactionClient, 'messageTemplate'>

export interface ResolvedTemplate extends TemplateCopyRow {
  key: TemplateKey
  name: string
  description: string
  isActive: boolean
  /** true when an admin-saved row overrides the code default */
  customised: boolean
}

function defaults(key: TemplateKey): ResolvedTemplate {
  const e = EVENTS[key]
  const d = DEFAULT_TEMPLATES[key]
  return {
    key,
    name: e.name,
    description: e.description,
    category: e.category,
    channels: [...e.defaultChannels],
    subject: d.subject,
    body: d.body,
    shortBody: d.shortBody ?? null,
    isActive: e.isActiveByDefault,
    customised: false,
  }
}

function fromRow(key: TemplateKey, row: Prisma.MessageTemplateGetPayload<object>): ResolvedTemplate {
  const e = EVENTS[key]
  return {
    key,
    name: e.name,
    description: e.description,
    // The category is a property of the event (consent rules), never admin-editable.
    category: e.category as Category,
    channels: row.channels.filter((c): c is Channel => (CHANNELS as readonly string[]).includes(c)),
    subject: row.subject,
    body: row.body,
    shortBody: row.shortBody,
    isActive: row.isActive,
    customised: true,
  }
}

/** The saved row if there is one, otherwise the code default. Safe to call inside a transaction. */
export async function getTemplate(db: TemplateDb, key: TemplateKey): Promise<ResolvedTemplate> {
  const row = await db.messageTemplate.findUnique({ where: { key } })
  return row ? fromRow(key, row) : defaults(key)
}

export async function listTemplates(db: TemplateDb): Promise<ResolvedTemplate[]> {
  const rows = await db.messageTemplate.findMany()
  const byKey = new Map(rows.map((r) => [r.key, r]))
  return TEMPLATE_KEYS.map((key) => {
    const row = byKey.get(key)
    return row ? fromRow(key, row) : defaults(key)
  })
}

export interface TemplateInput {
  channels: Channel[]
  subject: string
  body: string
  shortBody?: string | null
  isActive: boolean
}

export async function saveTemplate(db: TemplateDb, key: TemplateKey, input: TemplateInput): Promise<ResolvedTemplate> {
  const e = EVENTS[key]
  const data = {
    name: e.name,
    category: e.category,
    channels: [...new Set(input.channels)],
    subject: input.subject.trim(),
    body: input.body.trim(),
    shortBody: input.shortBody?.trim() ? input.shortBody.trim() : null,
    isActive: input.isActive,
  }
  const row = await db.messageTemplate.upsert({ where: { key }, create: { key, ...data }, update: data })
  return fromRow(key, row)
}

export async function resetTemplate(db: TemplateDb, key: TemplateKey): Promise<ResolvedTemplate> {
  await db.messageTemplate.deleteMany({ where: { key } })
  return defaults(key)
}

/** Sample data for the admin preview. */
export const SAMPLE_VARS: Record<string, string> = {
  firstName: 'Ada',
  lastName: 'Obi',
  fullName: 'Ada Obi',
  academyName: 'Banafix Music Academy',
  supportEmail: 'support@banafix.com',
  siteUrl: 'https://banafix.com',
  courseTitle: 'Piano Foundations',
  locationName: 'Lagos',
  enrollmentId: 'ENR-1234',
  assessmentFee: '₦5,000',
  assessmentDate: 'Tuesday 10 November 2026',
  assessmentTime: '10:00',
  assessmentArrangement: 'at your home address',
  planSummary: '8 classes of 60 minutes at ₦4,000 per class, twice a week',
  monthName: 'December',
  year: '2026',
  feedbackUrl: 'https://banafix.com/feedback',
  feedbackEmail: 'feedback@banafix.com',
  authorName: 'Mrs Obi',
  relationship: 'Parent',
  rating: '5',
  feedbackText: 'My daughter loves her lessons.',
  source: 'WEB',
  allowTestimonial: 'Yes',
  adminUrl: 'https://banafix.com/admin/feedback',
  classDate: 'Saturday 14 November',
  classTime: '11:00',
  instructorName: 'Mr Bello',
}
