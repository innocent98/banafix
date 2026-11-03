import { describe, expect, it } from 'vitest'
import { validateAvailabilitySlots } from './availability-input'

const ok = { weekday: 1, start: '09:00', end: '12:00', locationId: 'L1', mode: 'CENTRE' }

describe('validateAvailabilitySlots', () => {
  it('converts HH:MM to minutes and sorts by weekday then start', () => {
    const r = validateAvailabilitySlots([{ ...ok, weekday: 2 }, { ...ok, start: '13:00', end: '24:00' }, ok])
    expect(r).toEqual({
      ok: true,
      slots: [
        { weekday: 1, startMinute: 540, endMinute: 720, locationId: 'L1', mode: 'CENTRE' },
        { weekday: 1, startMinute: 780, endMinute: 1440, locationId: 'L1', mode: 'CENTRE' },
        { weekday: 2, startMinute: 540, endMinute: 720, locationId: 'L1', mode: 'CENTRE' },
      ],
    })
  })
  it('an empty list is valid (clears availability)', () => {
    expect(validateAvailabilitySlots([])).toEqual({ ok: true, slots: [] })
  })
  it('rejects a non-array, bad weekday, bad times, end before start, bad mode, missing location', () => {
    expect(validateAvailabilitySlots('x').ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, weekday: 0 }]).ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, weekday: 8 }]).ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, start: '9am' }]).ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, start: '12:00', end: '12:00' }]).ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, start: '13:00', end: '12:00' }]).ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, mode: 'PHONE' }]).ok).toBe(false)
    expect(validateAvailabilitySlots([{ ...ok, locationId: '' }]).ok).toBe(false)
  })
  it('rejects overlapping windows on the same weekday with a readable message, allows touching ones', () => {
    const r = validateAvailabilitySlots([ok, { ...ok, start: '11:00', end: '13:00', mode: 'HOME' }])
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toBe('Monday 09:00 to 12:00 overlaps Monday 11:00 to 13:00')
    expect(validateAvailabilitySlots([ok, { ...ok, start: '12:00', end: '13:00' }]).ok).toBe(true)
  })
})
