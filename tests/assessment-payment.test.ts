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
  it('compares requested_amount when present: pass-through fees make `amount` larger than the fee we asked for', () => {
    // Paystack "pass charges to customer": amount = base + fees, requested_amount = base.
    expect(chargeMatches({ amount: 507500, requested_amount: 500000, currency: 'NGN' }, expected)).toBe(true)
  })
  it('still rejects when requested_amount itself is wrong, whatever amount says', () => {
    expect(chargeMatches({ amount: 500000, requested_amount: 200000, currency: 'NGN' }, expected)).toBe(false)
  })
  it('falls back to amount when requested_amount is absent or null', () => {
    expect(chargeMatches({ amount: 500000, requested_amount: null, currency: 'NGN' }, expected)).toBe(true)
    expect(chargeMatches({ amount: 507500, requested_amount: null, currency: 'NGN' }, expected)).toBe(false)
  })
})
