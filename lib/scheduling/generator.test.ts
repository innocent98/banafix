import { describe, expect, it } from 'vitest'
import { generateSessions, type GenerateInput } from './generator'
import type { AvailabilityWindow } from './availability'
import { fromLagos, lagosParts } from './time'

const WHERE = { locationId: 'L1', mode: 'CENTRE' }
const MORNING = [{ start: 540, end: 720 }]
const base = (o: Partial<GenerateInput> = {}): GenerateInput => ({
  startDate: '2026-11-09', // Monday
  count: 4,
  firstSequence: 1,
  classesPerWeek: 1,
  durationMins: 60,
  preferredDays: [1], // Mondays
  windows: MORNING,
  availability: null,
  where: WHERE,
  busy: [],
  ...o,
})
const local = (d: Date) => { const p = lagosParts(d); return `${p.dateKey} ${String(Math.floor(p.minuteOfDay / 60)).padStart(2, '0')}:${String(p.minuteOfDay % 60).padStart(2, '0')}` }
const avail = (o: Partial<AvailabilityWindow> = {}): AvailabilityWindow => ({ weekday: 1, startMinute: 540, endMinute: 720, locationId: 'L1', mode: 'CENTRE', ...o })

describe('generateSessions', () => {
  it('one class a week on Mondays at the start of the window, sequences 1..n', () => {
    const r = generateSessions(base())
    expect(r.placed.map((s) => [s.sequence, local(s.startsAt)])).toEqual([
      [1, '2026-11-09 09:00'], [2, '2026-11-16 09:00'], [3, '2026-11-23 09:00'], [4, '2026-11-30 09:00'],
    ])
    expect(r.unplaced).toEqual([])
    expect(r.placed[0].endsAt.getTime() - r.placed[0].startsAt.getTime()).toBe(60 * 60_000)
  })

  it('two a week from a mid-week start: first partial week places only the days left', () => {
    // Wed 2026-11-11 start; Mon/Wed/Fri preferred; 2/wk. Week 1 has Wed, Fri left.
    const r = generateSessions(base({ startDate: '2026-11-11', preferredDays: [1, 3, 5], classesPerWeek: 2, count: 5 }))
    expect(r.placed.map((s) => local(s.startsAt).slice(0, 10))).toEqual(['2026-11-11', '2026-11-13', '2026-11-16', '2026-11-18', '2026-11-23'])
  })

  it('spreads classes across the preferred days of a week instead of taking the first two', () => {
    const r = generateSessions(base({ preferredDays: [1, 2, 3, 4, 5], classesPerWeek: 2, count: 2 }))
    expect(r.placed.map((s) => local(s.startsAt).slice(0, 10))).toEqual(['2026-11-09', '2026-11-11']) // Mon + Wed
  })

  it('never places before the start date, even on a preferred weekday earlier in that week', () => {
    const r = generateSessions(base({ startDate: '2026-11-12', preferredDays: [1, 4], classesPerWeek: 2, count: 2 }))
    expect(r.placed.map((s) => local(s.startsAt).slice(0, 10))).toEqual(['2026-11-12', '2026-11-16'])
  })

  it('works around busy intervals (instructor/student) by moving later in the window', () => {
    const busy = [{ start: fromLagos('2026-11-09', 540), end: fromLagos('2026-11-09', 600) }]
    const r = generateSessions(base({ count: 1, busy }))
    expect(local(r.placed[0].startsAt)).toBe('2026-11-09 10:00')
  })

  it('skips a day that is fully busy and uses the same weekday next week', () => {
    const busy = [{ start: fromLagos('2026-11-09', 540), end: fromLagos('2026-11-09', 720) }]
    const r = generateSessions(base({ count: 1, busy }))
    expect(local(r.placed[0].startsAt)).toBe('2026-11-16 09:00')
  })

  it('places at most one class per preferred day: 2/week with only Mondays preferred gives one per week, never two stacked on a Monday', () => {
    const r = generateSessions(base({ durationMins: 45, preferredDays: [1], classesPerWeek: 2, count: 6 }))
    expect(r.placed).toHaveLength(6)
    expect(new Set(r.placed.map((s) => local(s.startsAt).slice(0, 10))).size).toBe(6)
  })

  it('respects instructor availability: only inside a matching window', () => {
    const r = generateSessions(base({ count: 2, windows: [{ start: 540, end: 1260 }], availability: [avail({ startMinute: 600, endMinute: 660 })] }))
    expect(r.placed.map((s) => local(s.startsAt))).toEqual(['2026-11-09 10:00', '2026-11-16 10:00'])
  })

  it('availability at the wrong location/mode places nothing and says why', () => {
    const r = generateSessions(base({ count: 2, availability: [avail({ mode: 'HOME' })] }))
    expect(r.placed).toEqual([])
    expect(r.unplaced.map((u) => u.sequence)).toEqual([1, 2])
    expect(r.unplaced[0].reason).toMatch(/no free time/i)
  })

  it('an instructor with no windows at all reports that specifically', () => {
    const r = generateSessions(base({ count: 1, availability: [] }))
    expect(r.unplaced[0].reason).toMatch(/availability/i)
  })

  it('availability:null (override) ignores availability but still honours preferences and busy', () => {
    const r = generateSessions(base({ count: 1, availability: null }))
    expect(local(r.placed[0].startsAt)).toBe('2026-11-09 09:00')
  })

  it('a window narrower than the class fits nothing', () => {
    const r = generateSessions(base({ count: 1, windows: [{ start: 540, end: 580 }] }))
    expect(r.placed).toEqual([])
    expect(r.unplaced).toHaveLength(1)
  })

  it('no preferred windows => unplaced with a clear reason', () => {
    const r = generateSessions(base({ count: 1, windows: [] }))
    expect(r.unplaced[0].reason).toMatch(/time window/i)
  })

  it('empty preferred days means Monday to Saturday', () => {
    const r = generateSessions(base({ preferredDays: [], classesPerWeek: 1, count: 1, startDate: '2026-11-08' })) // Sunday start
    expect(local(r.placed[0].startsAt).slice(0, 10)).toBe('2026-11-09') // Monday, not Sunday
  })

  it('rolls over month and year boundaries', () => {
    const r = generateSessions(base({ startDate: '2026-12-28', count: 2 }))
    expect(r.placed.map((s) => local(s.startsAt).slice(0, 10))).toEqual(['2026-12-28', '2027-01-04'])
  })

  it('count 0 places nothing; free sequences fill the holes in order, capped by count', () => {
    expect(generateSessions(base({ count: 0 }))).toEqual({ placed: [], unplaced: [] })
    const r = generateSessions(base({ freeSequences: [2, 5, 7], count: 2 }))
    expect(r.placed.map((s) => s.sequence)).toEqual([2, 5])
  })

  it('is bounded by maxWeeks and reports the rest as unplaced instead of looping', () => {
    const r = generateSessions(base({ count: 10, maxWeeks: 3 }))
    expect(r.placed).toHaveLength(3)
    expect(r.unplaced.map((u) => u.sequence)).toEqual([4, 5, 6, 7, 8, 9, 10])
  })
})
