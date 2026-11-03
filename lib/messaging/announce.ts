import { announcementScope } from './idempotency'
import { baseVars, composeMessages, recipientVars, type NewMessage } from './compose'
import { resolveAudience, type AudienceDb, type AudienceFilter } from './audience'
import { enqueueMessages, type OutboxDb } from './outbox'
import type { Channel } from './types'

export interface AnnouncementInput {
  announcementId: string
  subject: string
  body: string
  shortBody?: string | null
  channels: Channel[]
  /** Operational notices send regardless of email consent (closures, schedule changes). */
  operational: boolean
  filter: AudienceFilter
}

export type AnnounceDb = AudienceDb & OutboxDb

/** Resolves the audience and writes one outbox row per person and channel. Returns rows created. */
export async function queueAnnouncement(db: AnnounceDb, input: AnnouncementInput): Promise<{ recipients: number; created: number }> {
  const people = await resolveAudience(db, input.filter)
  const template = {
    key: 'announcement',
    category: input.operational ? ('TRANSACTIONAL' as const) : ('MARKETING' as const),
    channels: input.channels,
    subject: input.subject,
    body: input.body,
    shortBody: input.shortBody ?? null,
  }
  const rows: NewMessage[] = []
  for (const p of people) {
    rows.push(
      ...composeMessages({
        template,
        recipient: p.recipient,
        vars: { ...baseVars(), ...recipientVars(p.recipient) },
        scope: announcementScope(input.announcementId),
        consent: p.consent,
        batchId: input.announcementId,
      }),
    )
  }
  const { created } = await enqueueMessages(db, rows)
  return { recipients: people.length, created }
}

export interface AudiencePreview {
  students: number
  parents: number
  /** per channel: how many would be queued vs skipped (no consent / no address) */
  channels: Record<string, { deliverable: number; skipped: number }>
}

/** Dry run for the compose screen: who would get it, and how many are blocked and why. */
export async function previewAnnouncement(
  db: AudienceDb,
  filter: AudienceFilter,
  channels: Channel[],
  operational: boolean,
): Promise<AudiencePreview> {
  const people = await resolveAudience(db, filter)
  const preview: AudiencePreview = {
    students: people.filter((p) => p.recipient.type === 'student').length,
    parents: people.filter((p) => p.recipient.type === 'parent').length,
    channels: {},
  }
  for (const channel of channels) {
    let deliverable = 0
    for (const p of people) {
      const [row] = composeMessages({
        template: {
          key: 'announcement',
          category: operational ? 'TRANSACTIONAL' : 'MARKETING',
          channels: [channel],
          subject: 's',
          body: 'b',
        },
        recipient: p.recipient,
        vars: {},
        scope: 'preview',
        consent: p.consent,
      })
      if (row?.status === 'queued') deliverable++
    }
    preview.channels[channel] = { deliverable, skipped: people.length - deliverable }
  }
  return preview
}
