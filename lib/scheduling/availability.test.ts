import { describe, expect, it } from 'vitest'
import { isWithinAvailability, type AvailabilityWindow } from './availability'
import { fromLagos } from './time'

// Monday 2026-11-09, Lagos local
const mon = (min: number) => fromLagos('2026-11-09', min)
const win = (o: Partial<AvailabilityWindow> = {}): AvailabilityWindow => ({ weekday: 1, startMinute: 540, endMinute: 720, locationId: 'L1', mode: 'CENTRE', ...o })
const where = { locationId: 'L1', mode: 'CENTRE' }
const iv = (s: number, e: number) => ({ start: mon(s), end: mon(e) })

describe('isWithinAvailability', () => {
  it('accepts a class fully inside the window, boundaries inclusive', () => {
    expect(isWithinAvailability(iv(540, 600), [win()], where)).toBe(true)
    expect(isWithinAvailability(iv(660, 720), [win()], where)).toBe(true)
  })
  it('rejects a class that starts early, ends late or has no windows', () => {
    expect(isWithinAvailability(iv(525, 585), [win()], where)).toBe(false)
    expect(isWithinAvailability(iv(690, 750), [win()], where)).toBe(false)
    expect(isWithinAvailability(iv(540, 600), [], where)).toBe(false)
  })
  it('rejects a different weekday, location or mode', () => {
    expect(isWithinAvailability(iv(540, 600), [win({ weekday: 2 })], where)).toBe(false)
    expect(isWithinAvailability(iv(540, 600), [win({ locationId: 'L2' })], where)).toBe(false)
    expect(isWithinAvailability(iv(540, 600), [win({ mode: 'HOME' })], where)).toBe(false)
  })
  it('a session with no location never matches', () => {
    expect(isWithinAvailability(iv(540, 600), [win()], { locationId: null, mode: 'CENTRE' })).toBe(false)
  })
  it('a class cannot span two adjacent windows (must fit in ONE)', () => {
    const two = [win({ endMinute: 600 }), win({ startMinute: 600, endMinute: 720 })]
    expect(isWithinAvailability(iv(570, 630), two, where)).toBe(false)
  })
  it('a class crossing local midnight is never available', () => {
    expect(isWithinAvailability({ start: mon(1410), end: mon(1470) }, [win({ startMinute: 1200, endMinute: 1440 })], where)).toBe(false)
  })
  it('a class ending exactly at midnight fits a window ending at 1440', () => {
    expect(isWithinAvailability(iv(1380, 1440), [win({ startMinute: 1200, endMinute: 1440 })], where)).toBe(true)
  })
})
