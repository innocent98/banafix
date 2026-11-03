export const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP'] as const
export type Channel = (typeof CHANNELS)[number]

export type Category = 'TRANSACTIONAL' | 'MARKETING'

export const MESSAGE_STATUSES = ['queued', 'sent', 'failed', 'skipped'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

export type RecipientType = 'student' | 'guardian' | 'parent' | 'admin'

/** A person (or inbox) a message can go to. Address fields may be missing. */
export interface Recipient {
  type: RecipientType
  id: string
  name: string
  email?: string | null
  phone?: string | null
}

export type VarMap = Record<string, string | number | null | undefined>

/** What a provider adapter is asked to deliver. */
export interface ProviderMessage {
  to: string
  toName?: string
  subject?: string
  text: string
  html?: string
}

export type ProviderResult =
  | { status: 'sent'; providerMessageId?: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string }

export interface ChannelProvider {
  channel: Channel
  name: string
  /** false => the drain records `skipped`, never `sent`. */
  isConfigured(): boolean
  send(message: ProviderMessage): Promise<ProviderResult>
}
