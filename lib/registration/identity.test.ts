import { describe, expect, it } from 'vitest'
import {
  ageInYears, aliasCandidates, canonicalEmail, guardianAliasEmail, isMinorDob, phoneKey, sameChild, sameMailbox,
} from './identity'

describe('email helpers', () => {
  it('strips a +tag for the canonical mailbox, nothing else', () => {
    expect(canonicalEmail(' Mum+Ada@Gmail.com ')).toBe('mum@gmail.com')
    expect(canonicalEmail('mum@gmail.com')).toBe('mum@gmail.com')
    expect(canonicalEmail('m.um@gmail.com')).toBe('m.um@gmail.com') // dots are NOT folded: never guess
  })
  it('sameMailbox is true for identical and +tag variants only', () => {
    expect(sameMailbox('mum@x.com', 'MUM+ada@x.com')).toBe(true)
    expect(sameMailbox('mum@x.com', 'dad@x.com')).toBe(false)
    expect(sameMailbox('', '')).toBe(false)
  })
})

describe('phoneKey', () => {
  it('treats local, +234 and 234 forms as one number', () => {
    const k = '9038563822'
    expect(phoneKey('0903 856 3822')).toBe(k)
    expect(phoneKey('+234 903 856 3822')).toBe(k)
    expect(phoneKey('2349038563822')).toBe(k)
  })
  it('is null when too short to trust', () => {
    expect(phoneKey('12345')).toBeNull()
    expect(phoneKey(undefined)).toBeNull()
  })
})

describe('age', () => {
  const now = new Date('2026-11-14T10:00:00Z')
  it('counts whole years and respects the birthday', () => {
    expect(ageInYears(new Date('2008-11-15'), now)).toBe(17)
    expect(ageInYears(new Date('2008-11-14'), now)).toBe(18)
  })
  it('isMinorDob flips at 18', () => {
    expect(isMinorDob(new Date('2008-11-15'), now)).toBe(true)
    expect(isMinorDob(new Date('2008-11-14'), now)).toBe(false)
  })
})

describe('guardianAliasEmail', () => {
  it('tags the guardian mailbox with the child name', () => {
    expect(guardianAliasEmail('Mum@Gmail.com', 'Ada', 'Okafor')).toBe('mum+ada-okafor@gmail.com')
  })
  it('replaces an existing tag instead of stacking', () => {
    expect(guardianAliasEmail('mum+kids@gmail.com', 'Ada', 'Okafor')).toBe('mum+ada-okafor@gmail.com')
  })
  it('is deterministic and ASCII-safe', () => {
    expect(guardianAliasEmail('m@x.com', 'Ọlá', 'N’Diaye')).toBe(guardianAliasEmail('m@x.com', 'Ọlá', 'N’Diaye'))
    expect(guardianAliasEmail('m@x.com', '!!!', '')).toBe('m+child@x.com')
  })
  it('lists the plain alias, then birth date, then counters', () => {
    const c = aliasCandidates('m@x.com', 'Ada', 'O', new Date('2015-03-02'))
    expect(c[0]).toBe('m+ada-o@x.com')
    expect(c[1]).toBe('m+ada-o-20150302@x.com')
    expect(c[2]).toBe('m+ada-o-2@x.com')
  })
})

describe('sameChild', () => {
  const ada = { firstName: 'Ada', dateOfBirth: new Date('2015-03-02') }
  it('matches on first name, case-insensitively', () => {
    expect(sameChild(ada, { firstName: ' ada ', dateOfBirth: null })).toBe(true)
  })
  it('a different first name is a different child', () => {
    expect(sameChild(ada, { firstName: 'Tobi', dateOfBirth: null })).toBe(false)
  })
  it('contradicting birth dates are a different child (twins of one name)', () => {
    expect(sameChild(ada, { firstName: 'Ada', dateOfBirth: new Date('2012-01-01') })).toBe(false)
    expect(sameChild(ada, { firstName: 'Ada', dateOfBirth: new Date('2015-03-02') })).toBe(true)
  })
})
