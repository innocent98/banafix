import type { Channel, ChannelProvider } from '../types'

const LABEL: Partial<Record<Channel, { label: string; env: string }>> = {
  SMS: { label: 'SMS', env: 'SMS_PROVIDER' },
  WHATSAPP: { label: 'WhatsApp', env: 'WHATSAPP_PROVIDER' },
}

/**
 * Disabled adapter for a channel whose external provider John has not chosen yet. It never sends:
 * every message is recorded `skipped` with a reason, so nothing is silently dropped and nothing is
 * pretended. Plugging a provider in later means writing an adapter and returning it from the
 * registry; the outbox, templates and admin pages do not change.
 */
export function createStubProvider(channel: 'SMS' | 'WHATSAPP'): ChannelProvider {
  const { label, env } = LABEL[channel]!
  return {
    channel,
    name: `${channel.toLowerCase()}-stub`,
    isConfigured: () => false,
    async send() {
      const chosen = process.env[env]?.trim()
      return {
        status: 'skipped',
        reason: chosen
          ? `${label} provider "${chosen}" is selected but its adapter is not built yet`
          : `${label} provider not configured`,
      }
    },
  }
}
