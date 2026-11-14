import { describe, expect, it } from 'vitest'
import { chooseStudentEmail, NoStudentEmailError } from './student'
import { validateRegistrant } from './validate'

type S = { firstName: string; dateOfBirth: Date | null }
const dbWith = (rows: Record<string, S>) =>
  ({ student: { findUnique: async ({ where }: any) => rows[where.email] ?? null } }) as any

const kid = (extra: Record<string, unknown> = {}) => {
  const r = validateRegistrant({ registeringFor: 'child', guardianName: 'Mum', guardianEmail: 'mum@x.com', ...extra })
  if (!r.ok) throw new Error(r.error)
  return r
}

describe('chooseStudentEmail', () => {
  it('adults are keyed on their own email', async () => {
    const r = validateRegistrant({ email: 'Ada@x.com' })
    if (!r.ok) throw new Error('x')
    expect(await chooseStudentEmail(dbWith({}), r, { firstName: 'Ada', lastName: 'O' })).toBe('ada@x.com')
  })
  it('a child with no email gets a guardian-derived address; siblings stay distinct', async () => {
    const ada = await chooseStudentEmail(dbWith({}), kid(), { firstName: 'Ada', lastName: 'O' })
    expect(ada).toBe('mum+ada-o@x.com')
    const db = dbWith({ [ada]: { firstName: 'Ada', dateOfBirth: null } })
    expect(await chooseStudentEmail(db, kid(), { firstName: 'Tobi', lastName: 'O' })).toBe('mum+tobi-o@x.com')
  })
  it('the same child applying again finds the same student', async () => {
    const db = dbWith({ 'mum+ada-o@x.com': { firstName: 'Ada', dateOfBirth: null } })
    expect(await chooseStudentEmail(db, kid(), { firstName: 'Ada', lastName: 'O' })).toBe('mum+ada-o@x.com')
  })
  it('a same-named child with a different birth date does not merge', async () => {
    const db = dbWith({ 'mum+ada-o@x.com': { firstName: 'Ada', dateOfBirth: new Date('2015-03-02') } })
    const v = kid({ dateOfBirth: '2012-01-01' })
    expect(await chooseStudentEmail(db, v, { firstName: 'Ada', lastName: 'O' })).toBe('mum+ada-o-20120101@x.com')
  })
  it('a parent typing their own registered email into the child box does not attach the child to themselves', async () => {
    const db = dbWith({ 'mum@x.com': { firstName: 'Mum', dateOfBirth: null } })
    const v = kid({ email: 'mum@y.com' })
    const dbY = dbWith({ 'mum@y.com': { firstName: 'Mum', dateOfBirth: null } })
    expect(await chooseStudentEmail(dbY, v, { firstName: 'Ada', lastName: 'O' })).toBe('mum+ada-o@x.com')
    void db
  })
  it('a distinct unclaimed child email is honoured', async () => {
    expect(await chooseStudentEmail(dbWith({}), kid({ email: 'kid@x.com' }), { firstName: 'Ada', lastName: 'O' })).toBe('kid@x.com')
  })
  it('a phone-only guardian with no child email cannot be keyed', async () => {
    const r = validateRegistrant({ registeringFor: 'child', guardianName: 'Mum', guardianPhone: '09038563822' }, { allowGuardianWithoutEmail: true })
    if (!r.ok) throw new Error('x')
    await expect(chooseStudentEmail(dbWith({}), r, { firstName: 'Ada', lastName: 'O' })).rejects.toBeInstanceOf(NoStudentEmailError)
  })
})
