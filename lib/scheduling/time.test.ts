import { describe, expect, it } from 'vitest'
import { addDays, fromLagos, isDateKey, isoWeekdayOf, lagosParts } from './time'

describe('lagosParts', () => {
  it('reads Lagos local time (UTC+1) from an instant', () => {
    // 2026-11-09 is a Monday. 08:00Z = 09:00 Lagos.
    expect(lagosParts(new Date('2026-11-09T08:00:00Z'))).toEqual({ dateKey: '2026-11-09', isoWeekday: 1, minuteOfDay: 540 })
  })
  it('rolls into the NEXT local day when UTC is still the previous day', () => {
    // 23:30Z Sunday = 00:30 Lagos Monday
    expect(lagosParts(new Date('2026-11-08T23:30:00Z'))).toEqual({ dateKey: '2026-11-09', isoWeekday: 1, minuteOfDay: 30 })
  })
  it('maps Sunday to ISO 7', () => {
    expect(lagosParts(new Date('2026-11-08T12:00:00Z')).isoWeekday).toBe(7)
  })
})

describe('fromLagos', () => {
  it('is the inverse of lagosParts', () => {
    const d = fromLagos('2026-11-09', 9 * 60 + 15)
    expect(d.toISOString()).toBe('2026-11-09T08:15:00.000Z')
    expect(lagosParts(d)).toEqual({ dateKey: '2026-11-09', isoWeekday: 1, minuteOfDay: 555 })
  })
  it('00:30 Lagos is the previous UTC day', () => {
    expect(fromLagos('2026-11-09', 30).toISOString()).toBe('2026-11-08T23:30:00.000Z')
  })
})

describe('addDays / isoWeekdayOf / isDateKey', () => {
  it('crosses month and year boundaries and leap day', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-11-09', 7)).toBe('2026-11-16')
  })
  it('weekday of a date key', () => {
    expect(isoWeekdayOf('2026-11-09')).toBe(1)
    expect(isoWeekdayOf('2026-11-15')).toBe(7)
  })
  it('validates date keys including impossible dates', () => {
    expect(isDateKey('2026-11-09')).toBe(true)
    expect(isDateKey('2026-02-30')).toBe(false)
    expect(isDateKey('2026-1-9')).toBe(false)
    expect(isDateKey(20261109)).toBe(false)
  })
})
