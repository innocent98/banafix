import { idempotencyKey } from './idempotency'
import { canReceive } from './consent'
import { renderEmailHtml, renderTemplate } from './template'
import type { Category, Channel, Recipient, VarMap } from './types'

export interface NewMessage {
  channel: Channel
  recipientType: string
  recipientId: string | null
  toName: string | null
  toAddress: string | null
  templateKey: string
  category: Category
  subject: string | null
  body: string
  html: string | null
  status: 'queued' | 'skipped' | 'failed'
  error: string | null
  idempotencyKey: string
  batchId: string | null
  enrollmentId: string | null
  scheduledFor: Date | null
}

export interface TemplateCopyRow {
  key: string
  category: Category
  channels: Channel[]
  subject: string
  body: string
  shortBody?: string | null
}

const ACADEMY_NAME = 'Banafix Music Academy'

export function baseVars(): VarMap {
  return {
    academyName: ACADEMY_NAME,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@banafix.com',
    siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  }
}

export function recipientVars(r: Pick<Recipient, 'name'>): VarMap {
  const parts = r.name.trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' '), fullName: parts.join(' ') }
}

export interface ComposeInput {
  template: TemplateCopyRow
  recipient: Recipient
  vars: VarMap
  /** Idempotency scope, e.g. `enr:<id>:enrolled`. */
  scope: string
  /** Consent flags that apply to this person (students: their enrollments; parents: their children's). */
  consent?: boolean[]
  /** Admin-declared notice that overrides marketing consent. */
  operational?: boolean
  supportEmail?: string
  batchId?: string
  enrollmentId?: string
  scheduledFor?: Date
}

/**
 * Pure: turns (template, recipient, variables) into the outbox rows to write, one per switched-on
 * channel. A missing address, a missing consent or a render problem is recorded as a `skipped` /
 * `failed` row with a reason, so nothing is ever dropped silently and nothing throws into a trigger.
 */
export function composeMessages(input: ComposeInput): NewMessage[] {
  const { template, recipient, vars, scope } = input
  const supportEmail = input.supportEmail ?? String(baseVars().supportEmail)
  const consent = canReceive(template.category, input.consent ?? [], input.operational)
  const rows: NewMessage[] = []

  for (const channel of [...new Set(template.channels)]) {
    const base = {
      channel,
      recipientType: recipient.type,
      recipientId: recipient.id,
      toName: recipient.name,
      templateKey: template.key,
      category: template.category,
      idempotencyKey: idempotencyKey(scope, channel, recipient.type, recipient.id),
      batchId: input.batchId ?? null,
      enrollmentId: input.enrollmentId ?? null,
      scheduledFor: input.scheduledFor ?? null,
    }
    const address = channel === 'EMAIL' ? recipient.email?.trim() || null : recipient.phone?.trim() || null
    const blocked = (error: string, status: 'skipped' | 'failed' = 'skipped'): NewMessage => ({
      ...base,
      toAddress: address,
      subject: null,
      body: '',
      html: null,
      status,
      error,
    })

    if (!consent.ok) {
      rows.push(blocked(consent.reason))
      continue
    }
    if (!address) {
      rows.push(blocked(channel === 'EMAIL' ? 'No email address on file' : 'No phone number on file'))
      continue
    }

    try {
      if (channel === 'EMAIL') {
        const subject = renderTemplate(template.subject, vars)
        const body = renderTemplate(template.body, vars)
        rows.push({
          ...base,
          toAddress: address,
          subject,
          body,
          html: renderEmailHtml({ subject, body, category: template.category, supportEmail }),
          status: 'queued',
          error: null,
        })
      } else {
        rows.push({
          ...base,
          toAddress: address,
          subject: null,
          body: renderTemplate(template.shortBody?.trim() ? template.shortBody : template.body, vars),
          html: null,
          status: 'queued',
          error: null,
        })
      }
    } catch (e) {
      rows.push(blocked(`Render failed: ${e instanceof Error ? e.message : String(e)}`, 'failed'))
    }
  }
  return rows
}
