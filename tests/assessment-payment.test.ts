import { describe, expect, it } from 'vitest'
import { chargeMatches } from '../lib/assessment-payment'

describe('chargeMatches', () => {
  const expected = { amountNaira: 5000, currency: 'NGN' }
  it('accepts the exact kobo amount in NGN', () => {
    expect(chargeMatches({ amount: 500000, currency: 'NGN' }, expected)).toBe(true)
  })
  it('treats a missing currency as NGN', () => {
    expect(chargeMatches({ amount: 500000 }, expected)).toBe(true)
  })
  it('rejects a different amount (under or over)', () => {
    expect(chargeMatches({ amount: 200000, currency: 'NGN' }, expected)).toBe(false)
    expect(chargeMatches({ amount: 800000, currency: 'NGN' }, expected)).toBe(false)
  })
  it('rejects a missing amount and a foreign currency', () => {
    expect(chargeMatches({ currency: 'NGN' }, expected)).toBe(false)
    expect(chargeMatches({ amount: 500000, currency: 'USD' }, expected)).toBe(false)
  })
})
