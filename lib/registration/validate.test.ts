import { describe, expect, it } from 'vitest'
import { validateRegistrant } from './validate'

const now = new Date('2026-11-14T10:00:00Z')
const v = (i: Parameters<typeof validateRegistrant>[0], o = {}) => validateRegistrant(i, { now, ...o })

describe('adult registrations', () => {
  it('needs an email', () => {
    expect(v({})).toEqual({ ok: false, error: 'Email is required' })
  })
  it('accepts an adult with no guardian', () => {
    const r = v({ email: ' Ada@X.com ', dateOfBirth: '1990-05-05' })
    expect(r).toMatchObject({ ok: true, minor: false, ownEmail: 'ada@x.com', guardian: null })
  })
  it('keeps an optional guardian (someone else pays)', () => {
    const r = v({ email: 'ada@x.com', guardianName: 'Bola', guardianEmail: 'BOLA@x.com' })
    expect(r).toMatchObject({ ok: true, guardian: { name: 'Bola', email: 'bola@x.com' } })
  })
  it('refuses a guardian email without a name', () => {
    expect(v({ email: 'ada@x.com', guardianEmail: 'b@x.com' })).toMatchObject({ ok: false })
  })
  it('ignores a guardian that is the student’s own mailbox', () => {
    const r = v({ email: 'ada@x.com', guardianName: 'Ada', guardianEmail: 'ada+me@x.com' })
    expect(r).toMatchObject({ ok: true, guardian: null })
  })
})

describe('minors', () => {
  it('a declared child needs a guardian name and email', () => {
    expect(v({ registeringFor: 'child', email: 'kid@x.com' })).toMatchObject({ ok: false })
    expect(v({ registeringFor: 'child', guardianName: 'Mum' })).toMatchObject({ ok: false })
  })
  it('a birth date under 18 forces a guardian even when the form says "self"', () => {
    const r = v({ registeringFor: 'self', email: 'kid@x.com', dateOfBirth: '2012-01-01' })
    expect(r).toMatchObject({ ok: false })
  })
  it('a child needs no email of their own', () => {
    const r = v({ registeringFor: 'child', guardianName: 'Mum', guardianEmail: 'mum@x.com' })
    expect(r).toMatchObject({ ok: true, minor: true, ownEmail: null, guardian: { email: 'mum@x.com' } })
  })
  it('drops a child email that is just the guardian’s mailbox', () => {
    const r = v({ registeringFor: 'child', email: 'mum@x.com', guardianName: 'Mum', guardianEmail: 'MUM@x.com' })
    expect(r).toMatchObject({ ok: true, ownEmail: null })
  })
  it('keeps a distinct child email', () => {
    const r = v({ registeringFor: 'child', email: 'kid@x.com', guardianName: 'Mum', guardianEmail: 'mum@x.com' })
    expect(r).toMatchObject({ ok: true, ownEmail: 'kid@x.com' })
  })
  it('public path requires a guardian email; admin may accept a phone only', () => {
    const input = { registeringFor: 'child', guardianName: 'Mum', guardianPhone: '0903 856 3822' }
    expect(v(input)).toMatchObject({ ok: false })
    expect(v(input, { allowGuardianWithoutEmail: true })).toMatchObject({
      ok: true, guardian: { email: null, phone: '0903 856 3822' },
    })
  })
})

describe('malformed input', () => {
  it('rejects bad dates, bad emails and a bad claim', () => {
    expect(v({ email: 'a@x.com', dateOfBirth: 'nope' })).toEqual({ ok: false, error: 'Invalid date of birth' })
    expect(v({ email: 'a@x.com', dateOfBirth: '2030-01-01' })).toMatchObject({ ok: false })
    expect(v({ email: 'nope' })).toEqual({ ok: false, error: 'Invalid email format' })
    expect(v({ email: 'a@x.com', guardianEmail: 'nope', guardianName: 'G' })).toEqual({ ok: false, error: 'Invalid guardian email format' })
    expect(v({ registeringFor: 'robot', email: 'a@x.com' })).toMatchObject({ ok: false })
  })
})
