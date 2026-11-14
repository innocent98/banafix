import { describe, expect, it } from 'vitest'
import { canReceive, parentConsentFlags } from './consent'

describe('canReceive', () => {
  it('transactional always sends, even with no consent', () => {
    expect(canReceive('TRANSACTIONAL', [])).toEqual({ ok: true })
    expect(canReceive('TRANSACTIONAL', [false])).toEqual({ ok: true })
  })
  it('marketing needs at least one consenting record', () => {
    expect(canReceive('MARKETING', [true])).toEqual({ ok: true })
    expect(canReceive('MARKETING', [false, true])).toEqual({ ok: true })
  })
  it('marketing with no records or only refusals is blocked with a reason', () => {
    expect(canReceive('MARKETING', [])).toEqual({ ok: false, reason: 'No email consent on record' })
    expect(canReceive('MARKETING', [false, false])).toEqual({ ok: false, reason: 'No email consent on record' })
  })
  it('an operational notice overrides marketing consent', () => {
    expect(canReceive('MARKETING', [false], true)).toEqual({ ok: true })
  })
})

describe('parentConsentFlags', () => {
  const e = (consentToEmails: boolean, status: string) => ({ consentToEmails, status })
  it('counts only enrollments past the unconfirmed stage', () => {
    expect(parentConsentFlags([{ enrollments: [e(true, 'pending'), e(true, 'cancelled')] }])).toEqual([])
    expect(parentConsentFlags([{ enrollments: [e(true, 'assessment_paid'), e(false, 'enrolled')] }])).toEqual([true, false])
  })
  it('a parent with no linked child has no consent, so is never marketed to', () => {
    const flags = parentConsentFlags([])
    expect(flags).toEqual([])
    expect(canReceive('MARKETING', flags)).toEqual({ ok: false, reason: 'No email consent on record' })
  })
  it('a spoofed pending application cannot opt a real parent in', () => {
    const flags = parentConsentFlags([{ enrollments: [e(true, 'pending')] }])
    expect(canReceive('MARKETING', flags).ok).toBe(false)
  })
})
