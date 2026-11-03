import { describe, expect, it } from 'vitest'
import { ACTIVE_STATUSES, SLOT_STATUSES, canMoveSession } from './session-status'

describe('session status', () => {
  it('active = scheduled|held; slot occupiers add missed', () => {
    expect([...ACTIVE_STATUSES].sort()).toEqual(['held', 'scheduled'])
    expect([...SLOT_STATUSES].sort()).toEqual(['held', 'missed', 'scheduled'])
  })
  it('allows the documented moves', () => {
    for (const to of ['held', 'missed', 'cancelled', 'rescheduled']) expect(canMoveSession('scheduled', to)).toBe(true)
    expect(canMoveSession('held', 'missed')).toBe(true)
    expect(canMoveSession('held', 'scheduled')).toBe(true)
    expect(canMoveSession('missed', 'held')).toBe(true)
    expect(canMoveSession('missed', 'scheduled')).toBe(true)
  })
  it('cancelled and rescheduled are terminal; nothing moves to itself; unknown is false', () => {
    for (const to of ['scheduled', 'held', 'missed', 'cancelled', 'rescheduled']) {
      expect(canMoveSession('cancelled', to)).toBe(false)
      expect(canMoveSession('rescheduled', to)).toBe(false)
    }
    expect(canMoveSession('scheduled', 'scheduled')).toBe(false)
    expect(canMoveSession('held', 'cancelled')).toBe(false)
    expect(canMoveSession('bogus', 'held')).toBe(false)
    expect(canMoveSession('scheduled', 'bogus')).toBe(false)
  })
})
