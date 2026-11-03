import { describe, expect, it } from 'vitest'
import { computeTuitionBalance, isLedgerEnrollment } from '../lib/tuition-balance'

const legacyEnr = { ratePerClass: null, plannedClasses: null, selectedMode: 'On-site' }
const planEnr = { ratePerClass: 4000, plannedClasses: 8, selectedMode: 'Online' }

describe('isLedgerEnrollment', () => {
  it('plan fields only, charges only, or both -> ledger', () => {
    expect(isLedgerEnrollment(planEnr, 0)).toBe(true)
    expect(isLedgerEnrollment(legacyEnr, 2)).toBe(true)
    expect(isLedgerEnrollment(planEnr, 3)).toBe(true)
  })
  it('neither -> legacy', () => {
    expect(isLedgerEnrollment(legacyEnr, 0)).toBe(false)
  })
  it('only half of the plan fields -> legacy', () => {
    expect(isLedgerEnrollment({ ratePerClass: 4000, plannedClasses: null, selectedMode: 'x' }, 0)).toBe(false)
  })
})

describe('computeTuitionBalance - ledger', () => {
  it('uses persisted charges', () => {
    const r = computeTuitionBalance(
      planEnr,
      [{ kind: 'CLASSES', quantity: 8, unitPrice: 4000, createdAt: '2026-01-01' }, { kind: 'MATERIAL', quantity: 1, unitPrice: 2000, createdAt: '2026-01-01' }],
      [{ amount: 10000, status: 'completed' }],
      { Online: 999999 },
    )
    expect(r).toMatchObject({ mode: 'ledger', charged: 34000, paid: 10000, outstanding: 24000, classesCovered: 2 })
  })
  it('falls back to a synthetic plan charge when plan fields exist but no rows do (never reads Course.pricing)', () => {
    const r = computeTuitionBalance(planEnr, [], [{ amount: 8000, status: 'partial' }], { Online: 999999 })
    expect(r).toMatchObject({ mode: 'ledger', charged: 32000, paid: 8000, outstanding: 24000, classesCovered: 2 })
  })
  it('all charges voided on a plan row does not resurrect the synthetic charge', () => {
    const r = computeTuitionBalance(
      planEnr,
      [{ kind: 'CLASSES', quantity: 8, unitPrice: 4000, createdAt: '2026-01-01', voidedAt: '2026-01-02' }],
      [],
      null,
    )
    expect(r).toMatchObject({ mode: 'ledger', charged: 0, outstanding: 0 })
  })
})

describe('computeTuitionBalance - legacy (old behaviour, untouched)', () => {
  const pricing = { 'On-site': 50000, Online: 30000 }
  it('expected = Course.pricing[selectedMode], outstanding = max(0, expected - paid)', () => {
    expect(computeTuitionBalance(legacyEnr, [], [{ amount: 20000, status: 'completed' }, { amount: 5000, status: 'partial' }], pricing))
      .toEqual({ mode: 'legacy', expectedTotal: 50000, paid: 25000, outstanding: 25000 })
  })
  it('overpayment clamps to 0', () => {
    expect(computeTuitionBalance(legacyEnr, [], [{ amount: 60000, status: 'completed' }], pricing))
      .toEqual({ mode: 'legacy', expectedTotal: 50000, paid: 60000, outstanding: 0 })
  })
  it('missing price for the mode: no expected total, no outstanding', () => {
    expect(computeTuitionBalance({ ...legacyEnr, selectedMode: 'Masterclass' }, [], [{ amount: 1000, status: 'completed' }], pricing))
      .toEqual({ mode: 'legacy', expectedTotal: undefined, paid: 1000, outstanding: undefined })
    expect(computeTuitionBalance(legacyEnr, [], [], null))
      .toEqual({ mode: 'legacy', expectedTotal: undefined, paid: 0, outstanding: undefined })
  })
  it('does not count pending/failed/cancelled payments', () => {
    expect(computeTuitionBalance(legacyEnr, [], [{ amount: 9000, status: 'pending' }, { amount: 9000, status: 'cancelled' }], pricing))
      .toMatchObject({ paid: 0, outstanding: 50000 })
  })
})
