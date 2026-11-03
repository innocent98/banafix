import { describe, expect, it } from 'vitest'
import { SchedulingConflictError, mapDbConflict } from './conflict-error'

const unknownReq = (msg: string) => Object.assign(new Error(msg), { name: 'PrismaClientUnknownRequestError' })
const known = (code: string, meta: unknown, msg = '') => Object.assign(new Error(msg), { name: 'PrismaClientKnownRequestError', code, meta })

describe('mapDbConflict', () => {
  it('maps an instructor exclusion violation (Prisma unknown-request shape)', () => {
    const e = mapDbConflict(unknownReq('... violates exclusion constraint "class_sessions_instructor_no_overlap" ... DETAIL: Key ("instructorId", tstzrange(...'), { instructor: 'Ada Teacher' })
    expect(e).toBeInstanceOf(SchedulingConflictError)
    expect(e?.kind).toBe('instructor')
    expect(e?.message).toBe('Ada Teacher already has a class at that time')
  })
  it('maps by key column when the constraint name is cut off', () => {
    expect(mapDbConflict(unknownReq('conflicts with existing key ("instructorId", tstzrange("startsAt"'))?.kind).toBe('instructor')
    expect(mapDbConflict(unknownReq('conflicts with existing key ("studentId", tstzrange("startsAt"'))?.kind).toBe('student')
  })
  it('maps a student exclusion violation with a default name', () => {
    const e = mapDbConflict(unknownReq('exclusion constraint "class_sessions_student_no_overlap"'))
    expect(e?.kind).toBe('student')
    expect(e?.message).toBe('The student already has a class at that time')
  })
  it('maps a raw-query P2010 / 23P01', () => {
    const e = mapDbConflict(known('P2010', { code: '23P01', message: 'ERROR: conflicting key value violates exclusion constraint "class_sessions_instructor_no_overlap"' }))
    expect(e?.kind).toBe('instructor')
  })
  it('maps the duplicate sequence slot (P2002 on enrollmentId+sequence)', () => {
    const e = mapDbConflict(known('P2002', { modelName: 'ClassSession', target: ['enrollmentId', 'sequence'] }))
    expect(e?.kind).toBe('sequence')
  })
  it('maps an availability-window overlap', () => {
    const e = mapDbConflict(unknownReq('violates exclusion constraint "instructor_availability_no_overlap"'))
    expect(e?.kind).toBe('availability_overlap')
  })
  it('returns null for anything else (including non-errors)', () => {
    expect(mapDbConflict(new Error('boom'))).toBeNull()
    expect(mapDbConflict(known('P2002', { target: ['email'] }))).toBeNull()
    expect(mapDbConflict(null)).toBeNull()
    expect(mapDbConflict('x')).toBeNull()
  })
})
