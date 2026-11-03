import { describe, expect, it } from 'vitest'
import { canReceive } from './consent'

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
