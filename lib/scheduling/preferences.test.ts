import { describe, expect, it } from 'vitest'
import { describePreferences, normaliseDay, validatePreferences } from './preferences'

describe('normaliseDay', () => {
  it('accepts canonical keys, legacy full names and any case', () => {
    expect(normaliseDay('mon')).toBe(1)
    expect(normaliseDay('Monday')).toBe(1)
    expect(normaliseDay('THU')).toBe(4)
    expect(normaliseDay(' sunday ')).toBe(7)
  })
  it('rejects junk and non-strings', () => {
    for (const bad of ['', 'mo', 'someday', 3, null, undefined, {}]) expect(normaliseDay(bad as any)).toBeNull()
  })
})

describe('validatePreferences', () => {
  it('empty input is valid with empty values', () => {
    expect(validatePreferences({})).toEqual({
      ok: true,
      value: { preferredDays: [], preferredTimeBands: [], preferredFromTime: null, preferredToTime: null, preferredClassesPerWeek: null },
    })
    expect(validatePreferences(undefined).ok).toBe(true)
  })
  it('normalises, dedupes and orders days and bands; pads times', () => {
    const r = validatePreferences({
      preferredDays: ['Wednesday', 'mon', 'MON'],
      preferredTimeBands: ['evening', 'morning', 'morning'],
      preferredFromTime: '9:00',
      preferredToTime: '17:30',
      preferredClassesPerWeek: 2,
    })
    expect(r).toEqual({
      ok: true,
      value: { preferredDays: ['mon', 'wed'], preferredTimeBands: ['morning', 'evening'], preferredFromTime: '09:00', preferredToTime: '17:30', preferredClassesPerWeek: 2 },
    })
  })
  it('rejects an unknown day, band, bad time, inverted range, or classes per week outside 1|2', () => {
    expect(validatePreferences({ preferredDays: ['funday'] })).toEqual({ ok: false, error: 'Unknown day "funday"' })
    expect(validatePreferences({ preferredTimeBands: ['brunch'] })).toEqual({ ok: false, error: 'Unknown time band "brunch"' })
    expect(validatePreferences({ preferredFromTime: '25:00' }).ok).toBe(false)
    expect(validatePreferences({ preferredFromTime: '15:00', preferredToTime: '14:00' })).toEqual({ ok: false, error: 'The earliest time must be before the latest time' })
    expect(validatePreferences({ preferredClassesPerWeek: 3 })).toEqual({ ok: false, error: 'Classes per week must be 1 or 2' })
    expect(validatePreferences({ preferredDays: 'mon' }).ok).toBe(false)
  })
  it('empty strings for optional fields mean "not set"', () => {
    const r = validatePreferences({ preferredFromTime: '', preferredToTime: '', preferredClassesPerWeek: '' })
    expect(r.ok && r.value.preferredFromTime).toBeNull()
    expect(r.ok && r.value.preferredClassesPerWeek).toBeNull()
  })
  it('accepts classes per week as a numeric string (form posts)', () => {
    const r = validatePreferences({ preferredClassesPerWeek: '1' })
    expect(r.ok && r.value.preferredClassesPerWeek).toBe(1)
  })
})

describe('describePreferences', () => {
  it('summarises structured preferences', () => {
    expect(describePreferences({ preferredDays: ['mon', 'wed'], preferredTimeBands: ['morning'], preferredFromTime: null, preferredToTime: null, preferredClassesPerWeek: 2 })).toBe('Mon, Wed · Morning · 2 classes a week')
  })
  it('falls back to the legacy schedulePreference and tolerates legacy day names', () => {
    expect(describePreferences({ preferredDays: ['Monday'], preferredTimeBands: [], schedulePreference: 'weekday-afternoon' })).toBe('Mon · weekday-afternoon')
    expect(describePreferences({ preferredDays: [], preferredTimeBands: [] })).toBe('No preference given')
  })
})
