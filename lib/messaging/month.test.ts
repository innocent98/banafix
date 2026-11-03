import { describe, expect, it } from 'vitest'
import { lagosMonthInfo, nextMonthStart } from './month'

describe('lagosMonthInfo', () => {
  it('uses Lagos (UTC+1), not UTC, for the month boundary', () => {
    // 23:30 UTC on 30 Nov is 00:30 on 1 Dec in Lagos
    expect(lagosMonthInfo(new Date('2026-11-30T23:30:00Z'))).toEqual({
      year: 2026,
      month: 12,
      monthName: 'December',
      key: '2026-12',
    })
  })
  it('stays in the same month just before Lagos midnight', () => {
    expect(lagosMonthInfo(new Date('2026-11-30T22:59:00Z')).key).toBe('2026-11')
  })
  it('zero-pads the key', () => {
    expect(lagosMonthInfo(new Date('2027-03-15T10:00:00Z')).key).toBe('2027-03')
  })
})

describe('nextMonthStart', () => {
  it('is midnight Lagos on the 1st of the next month', () => {
    expect(nextMonthStart(new Date('2026-11-03T10:00:00Z')).toISOString()).toBe('2026-11-30T23:00:00.000Z')
  })
  it('rolls December into January of the next year', () => {
    expect(nextMonthStart(new Date('2026-12-20T10:00:00Z')).toISOString()).toBe('2026-12-31T23:00:00.000Z')
    expect(lagosMonthInfo(nextMonthStart(new Date('2026-12-20T10:00:00Z'))).key).toBe('2027-01')
  })
})
