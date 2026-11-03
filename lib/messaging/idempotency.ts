import type { Channel } from './types'

/** One message = one (scope, channel, recipient). The unique key on `OutboundMessage` enforces it. */
export function idempotencyKey(scope: string, channel: Channel, recipientType: string, recipientId: string): string {
  return `${scope}:${channel}:${recipientType}:${recipientId}`
}

export const enrollmentScope = (enrollmentId: string, event: string, discriminator?: string) =>
  `enr:${enrollmentId}:${event}${discriminator ? `:${discriminator}` : ''}`
export const birthdayScope = (year: number) => `birthday:${year}`
export const monthScope = (year: number, month: number) => `newmonth:${year}-${String(month).padStart(2, '0')}`
export const announcementScope = (announcementId: string) => `ann:${announcementId}`
export const feedbackScope = (feedbackId: string) => `fb:${feedbackId}`
