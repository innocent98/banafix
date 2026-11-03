import { describe, expect, it } from 'vitest'
import { findConflicts, overlaps, type Interval } from './overlap'

const iv = (a: string, b: string): Interval => ({ start: new Date(a), end: new Date(b) })

describe('overlaps (half-open)', () => {
  it('touching intervals do not overlap', () => {
    expect(overlaps(iv('2026-11-09T08:00Z', '2026-11-09T09:00Z'), iv('2026-11-09T09:00Z', '2026-11-09T10:00Z'))).toBe(false)
  })
  it('partial, contained and identical intervals overlap', () => {
    const a = iv('2026-11-09T08:00Z', '2026-11-09T09:00Z')
    expect(overlaps(a, iv('2026-11-09T08:30Z', '2026-11-09T09:15Z'))).toBe(true)
    expect(overlaps(a, iv('2026-11-09T08:10Z', '2026-11-09T08:20Z'))).toBe(true)
    expect(overlaps(a, a)).toBe(true)
  })
  it('is symmetric and false for disjoint ones', () => {
    const a = iv('2026-11-09T08:00Z', '2026-11-09T09:00Z')
    const b = iv('2026-11-09T11:00Z', '2026-11-09T12:00Z')
    expect(overlaps(a, b)).toBe(false)
    expect(overlaps(b, a)).toBe(false)
  })
  it('45 minutes then 60 minutes back to back is fine', () => {
    expect(overlaps(iv('2026-11-09T08:00Z', '2026-11-09T08:45Z'), iv('2026-11-09T08:45Z', '2026-11-09T09:45Z'))).toBe(false)
  })
})

describe('findConflicts', () => {
  it('returns exactly the clashing intervals', () => {
    const c = iv('2026-11-09T08:00Z', '2026-11-09T09:00Z')
    const hit = iv('2026-11-09T08:30Z', '2026-11-09T09:30Z')
    const miss = iv('2026-11-09T09:00Z', '2026-11-09T10:00Z')
    expect(findConflicts(c, [miss, hit])).toEqual([hit])
    expect(findConflicts(c, [])).toEqual([])
  })
})
