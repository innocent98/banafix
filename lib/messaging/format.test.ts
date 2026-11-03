import { describe, expect, it } from 'vitest'
import { arrangementPhrase, formatLagosDate, formatLagosTime, formatNaira, planSummary } from './format'

describe('formatting', () => {
  it('formats a date and time in Lagos, not UTC', () => {
    const d = new Date('2026-11-10T23:30:00Z') // 00:30 on the 11th in Lagos
    expect(formatLagosDate(d)).toBe('Wednesday 11 November 2026')
    expect(formatLagosTime(d)).toBe('00:30')
  })
  it('naira with thousands separators', () => {
    expect(formatNaira(4000)).toBe('₦4,000')
    expect(formatNaira(5000)).toBe('₦5,000')
  })
  it('arrangement phrase falls back safely', () => {
    expect(arrangementPhrase('HOME')).toBe('at your home address')
    expect(arrangementPhrase('CENTRE')).toBe('at our centre')
    expect(arrangementPhrase('ONLINE')).toBe('online')
    expect(arrangementPhrase(null)).toBe('')
  })
  it('summarises a full plan', () => {
    expect(planSummary({ plannedClasses: 8, durationMins: 60, classesPerWeek: 2, ratePerClass: 4000 })).toBe(
      '8 classes of 60 minutes at ₦4,000 per class, twice a week',
    )
    expect(planSummary({ plannedClasses: 1, durationMins: 45, classesPerWeek: 1, ratePerClass: 3000 })).toBe(
      '1 class of 45 minutes at ₦3,000 per class, once a week',
    )
    expect(planSummary({ plannedClasses: 12, durationMins: 60, classesPerWeek: 3, ratePerClass: 4000 })).toContain('3 times a week')
  })
  it('omits whatever the plan does not have', () => {
    expect(planSummary({ plannedClasses: null, durationMins: 60, classesPerWeek: null, ratePerClass: null })).toBe('classes of 60 minutes')
    expect(planSummary({ plannedClasses: null, durationMins: null, classesPerWeek: null, ratePerClass: null })).toBe('your agreed plan')
  })
})
