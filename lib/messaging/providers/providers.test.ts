import { afterEach, describe, expect, it, vi } from 'vitest'
import { getProvider, setProvidersForTest } from './index'
import { createResendProvider } from './resend'
import { createStubProvider } from './stubs'
import { createFakeProvider } from './fake'

afterEach(() => {
  setProvidersForTest(null)
  vi.unstubAllEnvs()
})

const msg = { to: '+2348000000000', text: 'hi' }

describe('stub providers', () => {
  it('SMS is unconfigured and skips instead of pretending to send', async () => {
    const p = createStubProvider('SMS')
    expect(p.isConfigured()).toBe(false)
    expect(await p.send(msg)).toEqual({ status: 'skipped', reason: 'SMS provider not configured' })
  })
  it('WhatsApp likewise', async () => {
    expect(await createStubProvider('WHATSAPP').send(msg)).toEqual({
      status: 'skipped',
      reason: 'WhatsApp provider not configured',
    })
  })
  it('names the chosen-but-unbuilt provider in the reason', async () => {
    vi.stubEnv('SMS_PROVIDER', 'termii')
    expect(await createStubProvider('SMS').send(msg)).toEqual({
      status: 'skipped',
      reason: 'SMS provider "termii" is selected but its adapter is not built yet',
    })
  })
})

describe('Resend adapter', () => {
  it.each([undefined, '', '   ', 'your-resend-api-key', 're_placeholder'])('is unconfigured for key %j', (key) => {
    expect(createResendProvider({ apiKey: key, from: 'a@b.test' }).isConfigured()).toBe(false)
  })
  it('is configured with a real-looking key', () => {
    expect(createResendProvider({ apiKey: 'abc123def456', from: 'a@b.test' }).isConfigured()).toBe(true)
  })
  it('skips when unconfigured', async () => {
    const r = await createResendProvider({ apiKey: '', from: 'a@b.test' }).send({ to: 'x@y.test', subject: 's', text: 't' })
    expect(r).toEqual({ status: 'skipped', reason: 'Email provider not configured (RESEND_API_KEY)' })
  })
})

describe('registry', () => {
  it('returns the stub for SMS and WhatsApp by default', () => {
    expect(getProvider('SMS').isConfigured()).toBe(false)
    expect(getProvider('WHATSAPP').isConfigured()).toBe(false)
  })
  it('honours MESSAGING_EMAIL_PROVIDER=fake outside production', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('MESSAGING_EMAIL_PROVIDER', 'fake')
    expect(getProvider('EMAIL').name).toBe('fake')
  })
  it('ignores the fake switch in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('MESSAGING_EMAIL_PROVIDER', 'fake')
    expect(getProvider('EMAIL').name).toBe('resend')
  })
  it('test overrides win', () => {
    const fake = createFakeProvider('EMAIL')
    setProvidersForTest({ EMAIL: fake })
    expect(getProvider('EMAIL')).toBe(fake)
  })
})

describe('fake provider', () => {
  it('records sends and can be told to fail an address', async () => {
    const f = createFakeProvider('EMAIL')
    f.failFor('bad@x.test', 'boom')
    expect(await f.send({ to: 'ok@x.test', text: 't' })).toMatchObject({ status: 'sent' })
    expect(await f.send({ to: 'bad@x.test', text: 't' })).toEqual({ status: 'failed', error: 'boom' })
    expect(f.sent.map((m) => m.to)).toEqual(['ok@x.test'])
  })
})
