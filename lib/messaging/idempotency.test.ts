import { describe, expect, it } from 'vitest'
import {
  announcementScope,
  birthdayScope,
  enrollmentScope,
  feedbackScope,
  idempotencyKey,
  monthScope,
} from './idempotency'

describe('idempotency keys', () => {
  it('are stable for the same inputs', () => {
    const a = idempotencyKey(enrollmentScope('e1', 'enrolled'), 'EMAIL', 'student', 's1')
    const b = idempotencyKey(enrollmentScope('e1', 'enrolled'), 'EMAIL', 'student', 's1')
    expect(a).toBe(b)
    expect(a).toBe('enr:e1:enrolled:EMAIL:student:s1')
  })
  it('differ by channel, recipient, event and discriminator', () => {
    const base = idempotencyKey(enrollmentScope('e1', 'enrolled'), 'EMAIL', 'student', 's1')
    expect(idempotencyKey(enrollmentScope('e1', 'enrolled'), 'SMS', 'student', 's1')).not.toBe(base)
    expect(idempotencyKey(enrollmentScope('e1', 'enrolled'), 'EMAIL', 'guardian', 's1')).not.toBe(base)
    expect(idempotencyKey(enrollmentScope('e1', 'assessed'), 'EMAIL', 'student', 's1')).not.toBe(base)
    expect(enrollmentScope('e1', 'assessment_scheduled', 'a1:2026-11-10T09:00:00.000Z')).toBe(
      'enr:e1:assessment_scheduled:a1:2026-11-10T09:00:00.000Z',
    )
  })
  it('birthday keys carry the year, month keys the YYYY-MM', () => {
    expect(birthdayScope(2026)).toBe('birthday:2026')
    expect(birthdayScope(2027)).not.toBe(birthdayScope(2026))
    expect(monthScope(2026, 3)).toBe('newmonth:2026-03')
    expect(announcementScope('a1')).toBe('ann:a1')
    expect(feedbackScope('f1')).toBe('fb:f1')
  })
})
