import { describe, expect, it } from 'vitest'
import {
  chargesAsOf,
  openLinkHeadroom,
  checkPaymentAmount,
  classesCovered,
  summarizeLedger,
  type LedgerCharge,
} from '../lib/tuition-ledger'

const classes = (quantity: number, unitPrice: number, createdAt = '2026-01-01T00:00:00Z'): LedgerCharge => ({
  kind: 'CLASSES', quantity, unitPrice, createdAt,
})
const material = (unitPrice: number, createdAt = '2026-01-01T00:00:00Z'): LedgerCharge => ({
  kind: 'MATERIAL', quantity: 1, unitPrice, createdAt,
})

describe('classesCovered', () => {
  it('single rate: floor((paid - materials) / rate)', () => {
    expect(classesCovered([classes(8, 4000), material(3000)], 19000)).toBe(4)
  })
  it('materials settle first: paid below materials covers nothing', () => {
    expect(classesCovered([classes(8, 4000), material(3000)], 2999)).toBe(0)
    expect(classesCovered([classes(8, 4000), material(3000)], 3000)).toBe(0)
    expect(classesCovered([classes(8, 4000), material(3000)], 7000)).toBe(1)
  })
  it('a part-paid class does not count', () => {
    expect(classesCovered([classes(4, 3000)], 5999)).toBe(1)
    expect(classesCovered([classes(4, 3000)], 6000)).toBe(2)
  })
  it('never exceeds the classes purchased', () => {
    expect(classesCovered([classes(4, 3000)], 999999)).toBe(4)
  })
  it('walks several rates in order, each class at its own rate', () => {
    const charges = [classes(4, 3000, '2026-01-01T00:00:00Z'), classes(4, 4000, '2026-02-01T00:00:00Z')]
    expect(classesCovered(charges, 20000)).toBe(4 + 2) // 12000 for the first four, 8000 = 2 x 4000
    expect(classesCovered(charges, 12000)).toBe(4)
    expect(classesCovered(charges, 15999)).toBe(4 + 0)
  })
  it('orders by createdAt, not array order', () => {
    const charges = [classes(4, 4000, '2026-02-01T00:00:00Z'), classes(4, 3000, '2026-01-01T00:00:00Z')]
    expect(classesCovered(charges, 12000)).toBe(4)
  })
  it('a later charge is not covered while an earlier one is incomplete', () => {
    const charges = [classes(4, 5000, '2026-01-01T00:00:00Z'), classes(4, 1000, '2026-02-01T00:00:00Z')]
    // 19999 cannot finish the first four (20000), so the cheap later class must not be counted
    expect(classesCovered(charges, 19999)).toBe(3)
  })
  it('free classes are covered without dividing by zero', () => {
    expect(classesCovered([classes(2, 0), classes(2, 3000, '2026-02-01T00:00:00Z')], 3000)).toBe(3)
  })
  it('ignores voided charges', () => {
    const voided: LedgerCharge = { ...classes(8, 4000), voidedAt: '2026-01-02T00:00:00Z' }
    expect(classesCovered([voided, classes(2, 4000, '2026-02-01T00:00:00Z')], 4000)).toBe(1)
  })
  it('empty ledger and zero paid', () => {
    expect(classesCovered([], 5000)).toBe(0)
    expect(classesCovered([classes(4, 3000)], 0)).toBe(0)
  })
})

describe('summarizeLedger', () => {
  const charges = [classes(8, 4000), material(3000)] // 35000
  it('counts completed and partial payments only', () => {
    const s = summarizeLedger(charges, [
      { amount: 10000, status: 'completed' },
      { amount: 5000, status: 'partial' },
      { amount: 9999, status: 'pending' },
      { amount: 9999, status: 'failed' },
      { amount: 9999, status: 'cancelled' },
    ])
    expect(s).toMatchObject({ charged: 35000, paid: 15000, outstanding: 20000, credit: 0, materials: 3000, classesPurchased: 8 })
    expect(s.classesCovered).toBe(3) // (15000 - 3000) / 4000
  })
  it('partial payments accumulate to zero outstanding', () => {
    const s = summarizeLedger(charges, [
      { amount: 20000, status: 'completed' },
      { amount: 15000, status: 'completed' },
    ])
    expect(s.outstanding).toBe(0)
    expect(s.credit).toBe(0)
    expect(s.classesCovered).toBe(8)
  })
  it('overpayment: outstanding 0, credit = excess', () => {
    const s = summarizeLedger(charges, [{ amount: 40000, status: 'completed' }])
    expect(s.outstanding).toBe(0)
    expect(s.credit).toBe(5000)
  })
  it('voiding a charge below what was paid shows credit, never negative outstanding', () => {
    const voided: LedgerCharge = { ...material(3000), voidedAt: '2026-01-05T00:00:00Z' }
    const s = summarizeLedger([classes(8, 4000), voided], [{ amount: 35000, status: 'completed' }])
    expect(s.charged).toBe(32000)
    expect(s.outstanding).toBe(0)
    expect(s.credit).toBe(3000)
    expect(s.materials).toBe(0)
  })
  it('zero-priced material is harmless', () => {
    const s = summarizeLedger([classes(2, 1000), material(0)], [{ amount: 1000, status: 'completed' }])
    expect(s).toMatchObject({ charged: 2000, outstanding: 1000, materials: 0, classesCovered: 1 })
  })
  it('empty ledger is all zeros', () => {
    expect(summarizeLedger([], [])).toEqual({
      charged: 0, paid: 0, outstanding: 0, credit: 0, materials: 0, classesPurchased: 0, classesCovered: 0,
    })
  })
})

describe('chargesAsOf', () => {
  const t = new Date('2026-03-01T00:00:00Z')
  const before: LedgerCharge = { ...classes(1, 1, '2026-02-01T00:00:00Z') }
  const after: LedgerCharge = { ...classes(1, 2, '2026-04-01T00:00:00Z') }
  const voidedBefore: LedgerCharge = { ...classes(1, 3, '2026-01-01T00:00:00Z'), voidedAt: '2026-02-15T00:00:00Z' }
  const voidedAfter: LedgerCharge = { ...classes(1, 4, '2026-01-01T00:00:00Z'), voidedAt: '2026-05-01T00:00:00Z' }
  it('keeps charges created by t and not yet voided at t', () => {
    expect(chargesAsOf([before, after, voidedBefore, voidedAfter], t).map((c) => c.unitPrice)).toEqual([1, 4])
  })
  it('a charge created exactly at t is included', () => {
    expect(chargesAsOf([{ ...classes(1, 9, '2026-03-01T00:00:00Z') }], t)).toHaveLength(1)
  })
})

describe('checkPaymentAmount', () => {
  it('rejects zero, negative, fractional and non-numeric', () => {
    for (const bad of [0, -5, 1.5, 'abc', null, undefined, NaN, Infinity]) {
      expect(checkPaymentAmount(10000, bad, true).ok).toBe(false)
    }
  })
  it('accepts a whole number equal to the outstanding balance', () => {
    expect(checkPaymentAmount(10000, 10000, false)).toEqual({ ok: true, amount: 10000 })
  })
  it('rejects above outstanding unless overpayment is allowed', () => {
    const r = checkPaymentAmount(10000, 10001, false)
    expect(r.ok).toBe(false)
    expect(checkPaymentAmount(10000, 10001, true)).toEqual({ ok: true, amount: 10001 })
  })
  it('accepts a numeric string of whole naira', () => {
    expect(checkPaymentAmount(10000, '2500', false)).toEqual({ ok: true, amount: 2500 })
  })
  it('caps an absurd amount', () => {
    expect(checkPaymentAmount(10000, 1e12, true).ok).toBe(false)
  })
})

describe('openLinkHeadroom', () => {
  it('no open links: the whole outstanding balance', () => {
    expect(openLinkHeadroom(40000, [])).toBe(40000)
  })
  it('subtracts every open link', () => {
    expect(openLinkHeadroom(40000, [25000])).toBe(15000)
    expect(openLinkHeadroom(40000, [10000, 10000, 5000])).toBe(15000)
  })
  it('a link for the full balance leaves nothing (the 40,000 + 40,000 case)', () => {
    expect(openLinkHeadroom(40000, [40000])).toBe(0)
  })
  it('never negative (links opened before the balance shrank)', () => {
    expect(openLinkHeadroom(10000, [25000])).toBe(0)
    expect(openLinkHeadroom(0, [])).toBe(0)
  })
})
