import { Resend } from 'resend'
import type { ChannelProvider, ProviderMessage, ProviderResult } from '../types'

const PLACEHOLDER = /^(your[-_]|re_placeholder|changeme|placeholder)/i

export function looksUnconfigured(key: string | undefined): boolean {
  return !key || !key.trim() || PLACEHOLDER.test(key.trim())
}

/** Working email adapter. Unconfigured (missing or placeholder key) => `skipped`, never a failed send. */
export function createResendProvider(opts: { apiKey: string | undefined; from: string; replyTo?: string }): ChannelProvider {
  return {
    channel: 'EMAIL',
    name: 'resend',
    // Resend's default limit is 2 requests/second per team.
    minIntervalMs: 600,
    isConfigured: () => !looksUnconfigured(opts.apiKey),
    async send(m: ProviderMessage): Promise<ProviderResult> {
      if (looksUnconfigured(opts.apiKey)) {
        return { status: 'skipped', reason: 'Email provider not configured (RESEND_API_KEY)' }
      }
      try {
        const res = await new Resend(opts.apiKey).emails.send({
          from: opts.from,
          to: m.to,
          subject: m.subject ?? '(no subject)',
          html: m.html,
          text: m.text,
          ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
        })
        if (res.error) return { status: 'failed', error: `${res.error.name}: ${res.error.message}` }
        return { status: 'sent', providerMessageId: res.data?.id }
      } catch (e) {
        return { status: 'failed', error: e instanceof Error ? e.message : String(e) }
      }
    },
  }
}
