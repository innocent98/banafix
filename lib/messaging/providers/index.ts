import type { Channel, ChannelProvider } from '../types'
import { createFakeProvider } from './fake'
import { createResendProvider } from './resend'
import { createStubProvider } from './stubs'

let override: Partial<Record<Channel, ChannelProvider>> | null = null
let fakeEmail: ChannelProvider | null = null

/** Tests inject their own adapters; pass null to clear. */
export function setProvidersForTest(p: Partial<Record<Channel, ChannelProvider>> | null): void {
  override = p
}

export function getProvider(channel: Channel): ChannelProvider {
  const injected = override?.[channel]
  if (injected) return injected

  if (channel === 'EMAIL') {
    // The fake is impossible to enable in production (spec C13).
    if (process.env.MESSAGING_EMAIL_PROVIDER === 'fake' && process.env.NODE_ENV !== 'production') {
      return (fakeEmail ??= createFakeProvider('EMAIL'))
    }
    return createResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.FROM_EMAIL || 'noreply@banafix.com',
    })
  }
  return createStubProvider(channel)
}
