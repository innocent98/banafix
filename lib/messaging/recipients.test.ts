import { describe, expect, it } from 'vitest'
import { enrollmentRecipients } from './recipients'

const base = { studentId: 's1', firstName: 'Ada', lastName: 'Obi', email: 'ada@x.test', phone: '0801' }

describe('enrollmentRecipients', () => {
  it('returns just the student when there is no guardian', () => {
    expect(enrollmentRecipients(base)).toEqual([
      { type: 'student', id: 's1', name: 'Ada Obi', email: 'ada@x.test', phone: '0801' },
    ])
  })
  it('adds a distinct guardian', () => {
    const r = enrollmentRecipients({ ...base, guardianName: 'Mrs Obi', guardianEmail: 'mum@x.test', guardianPhone: '0802' })
    expect(r).toHaveLength(2)
    expect(r[1]).toEqual({ type: 'guardian', id: 's1:guardian', name: 'Mrs Obi', email: 'mum@x.test', phone: '0802' })
  })
  it('drops a guardian that shares the student’s email (case-insensitive)', () => {
    const r = enrollmentRecipients({ ...base, guardianName: 'Ada', guardianEmail: 'ADA@x.test' })
    expect(r).toHaveLength(1)
  })
  it('drops a guardian with no contact details', () => {
    expect(enrollmentRecipients({ ...base, guardianName: 'Mrs Obi' })).toHaveLength(1)
  })
  it('falls back to the email when the student has no name', () => {
    const r = enrollmentRecipients({ ...base, firstName: '', lastName: '' })
    expect(r[0].name).toBe('ada@x.test')
  })
})
