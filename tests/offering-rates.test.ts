import { describe, expect, it } from 'vitest'
import { buildPlanSnapshot, fromRate, planTotal, resolveRate } from '../lib/offering-rates'

const rates = [
  { durationMins: 45, pricePerClass: 4000 },
  { durationMins: 60, pricePerClass: 5000 },
]

describe('rate resolution', () => {
  it('resolves an exact duration and returns null for an unpriced one', () => {
    expect(resolveRate(rates, 45)).toBe(4000)
    expect(resolveRate(rates, 60)).toBe(5000)
    expect(resolveRate(rates, 30)).toBeNull()
    expect(resolveRate([], 60)).toBeNull()
  })
  it('fromRate is the cheapest, null when nothing is priced', () => {
    expect(fromRate(rates)).toBe(4000)
    expect(fromRate([])).toBeNull()
  })
  it('planTotal multiplies the snapshot rate', () => {
    expect(planTotal(5000, 12)).toBe(60000)
  })
})

describe('buildPlanSnapshot', () => {
  const base = { rates, classesPerWeekOptions: [1, 2], durationMins: 60, classesPerWeek: 2, plannedClasses: 24 }
  it('snapshots the rate for a valid plan', () => {
    expect(buildPlanSnapshot(base)).toEqual({
      ok: true, ratePerClass: 5000, durationMins: 60, classesPerWeek: 2, plannedClasses: 24,
    })
  })
  it('rejects a duration with no rate', () => {
    const r = buildPlanSnapshot({ ...base, durationMins: 30 })
    expect(r).toMatchObject({ ok: false })
    expect((r as { error: string }).error).toContain('30-minute')
  })
  it('rejects classes/week outside the offering options', () => {
    expect(buildPlanSnapshot({ ...base, classesPerWeek: 3 })).toMatchObject({ ok: false })
    expect(buildPlanSnapshot({ ...base, classesPerWeek: 1.5 })).toMatchObject({ ok: false })
  })
  it.each([0, -1, 2.5, NaN])('rejects plannedClasses=%s', (plannedClasses) => {
    expect(buildPlanSnapshot({ ...base, plannedClasses })).toMatchObject({ ok: false })
  })
})

import { toWholeNumber, MAX_PLANNED_CLASSES } from '../lib/offering-rates'

describe('toWholeNumber / plannedClasses bounds', () => {
  it('accepts integers and digit strings only', () => {
    expect(toWholeNumber(8)).toBe(8)
    expect(toWholeNumber(' 12 ')).toBe(12)
    for (const bad of [true, null, undefined, 1.5, '1e3', '-2', 'abc', {}, []]) expect(Number.isNaN(toWholeNumber(bad))).toBe(true)
  })
  it('rejects a planned class count above the cap', () => {
    const base = { rates: [{ durationMins: 60, pricePerClass: 5000 }], classesPerWeekOptions: [1], durationMins: 60, classesPerWeek: 1 }
    expect(buildPlanSnapshot({ ...base, plannedClasses: MAX_PLANNED_CLASSES })).toMatchObject({ ok: true })
    expect(buildPlanSnapshot({ ...base, plannedClasses: MAX_PLANNED_CLASSES + 1 })).toMatchObject({ ok: false })
    expect(buildPlanSnapshot({ ...base, plannedClasses: 3e9 })).toMatchObject({ ok: false })
  })
})
