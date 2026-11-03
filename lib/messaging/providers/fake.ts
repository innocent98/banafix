import type { Channel, ChannelProvider, ProviderMessage, ProviderResult } from '../types'

export interface FakeProvider extends ChannelProvider {
  sent: ProviderMessage[]
  failFor(address: string, error?: string): void
  reset(): void
}

/** In-memory adapter for tests and local verification. Never reachable in production (see registry). */
export function createFakeProvider(channel: Channel): FakeProvider {
  const failing = new Map<string, string>()
  const fake: FakeProvider = {
    channel,
    name: 'fake',
    sent: [],
    isConfigured: () => true,
    async send(m: ProviderMessage): Promise<ProviderResult> {
      const error = failing.get(m.to)
      if (error) return { status: 'failed', error }
      fake.sent.push(m)
      return { status: 'sent', providerMessageId: `fake-${fake.sent.length}` }
    },
    failFor(address, error = 'simulated provider failure') {
      failing.set(address, error)
    },
    reset() {
      fake.sent = []
      failing.clear()
    },
  }
  return fake
}
