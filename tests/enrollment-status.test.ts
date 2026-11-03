import { describe, expect, it } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  InvalidTransitionError,
  assertTransition,
  canTransition,
  isEnrollmentStatus,
} from '../lib/enrollment-status'

describe('enrollment status guard', () => {
  it.each([
    ['pending', 'assessment_paid'],
    ['assessment_paid', 'assessment_scheduled'],
    ['assessment_scheduled', 'assessed'],
    ['assessed', 'plan_agreed'],
    ['plan_agreed', 'enrolled'],
    ['assessed', 'assessment_scheduled'], // re-assessment (B5)
    ['assessment_paid', 'assessed'], // reuse latest assessment (B16)
  ])('allows %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true)
  })

  it.each(['pending', 'assessment_paid', 'assessment_scheduled', 'assessed', 'plan_agreed'])(
    'allows cancelled from non-terminal %s',
    (from) => expect(canTransition(from, 'cancelled')).toBe(true),
  )

  it.each([
    ['pending', 'assessed'],
    ['pending', 'enrolled'],
    ['pending', 'plan_agreed'],
    ['assessment_paid', 'enrolled'],
    ['assessment_paid', 'plan_agreed'],
    ['pending', 'assessed'],
    ['assessed', 'pending'],
    ['assessed', 'enrolled'],
    ['plan_agreed', 'assessed'],
    ['enrolled', 'cancelled'],
    ['enrolled', 'pending'],
    ['cancelled', 'pending'],
    ['cancelled', 'enrolled'],
    ['pending', 'pending'],
  ])('rejects %s -> %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false)
  })

  it('treats terminal states as having no exits', () => {
    expect(ALLOWED_TRANSITIONS.enrolled).toEqual([])
    expect(ALLOWED_TRANSITIONS.cancelled).toEqual([])
  })

  it('rejects unknown and retired statuses in either position', () => {
    expect(canTransition('application_paid', 'enrolled')).toBe(false)
    expect(canTransition('pending', 'application_paid')).toBe(false)
    expect(canTransition('', 'pending')).toBe(false)
    expect(canTransition('toString', 'pending')).toBe(false)
    expect(isEnrollmentStatus('constructor')).toBe(false)
  })

  it('assertTransition throws a typed error carrying both ends', () => {
    expect(() => assertTransition('pending', 'enrolled')).toThrow(InvalidTransitionError)
    try {
      assertTransition('pending', 'enrolled')
    } catch (e) {
      expect((e as InvalidTransitionError).from).toBe('pending')
      expect((e as InvalidTransitionError).to).toBe('enrolled')
    }
    expect(() => assertTransition('pending', 'assessment_paid')).not.toThrow()
  })
})
