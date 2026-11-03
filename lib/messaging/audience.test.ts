import { describe, expect, it } from 'vitest'
import { parentWhere, studentWhere } from './audience'

describe('studentWhere', () => {
  it('defaults to enrolled students only', () => {
    expect(studentWhere({ scope: 'students' })).toEqual({ enrollments: { some: { status: 'enrolled' } } })
  })
  it('includeApplicants widens to everyone not cancelled', () => {
    expect(studentWhere({ scope: 'students', includeApplicants: true })).toEqual({
      enrollments: { some: { status: { not: 'cancelled' } } },
    })
  })
  it('narrows by location and course on the SAME enrollment', () => {
    expect(studentWhere({ scope: 'both', locationId: 'L1', courseId: 'C1' })).toEqual({
      enrollments: { some: { status: 'enrolled', locationId: 'L1', courseId: 'C1' } },
    })
  })
})

describe('parentWhere', () => {
  it('is the parents of the matching students', () => {
    expect(parentWhere({ scope: 'parents', locationId: 'L1' })).toEqual({
      children: { some: { enrollments: { some: { status: 'enrolled', locationId: 'L1' } } } },
    })
  })
})
