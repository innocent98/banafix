import { describe, expect, it } from 'vitest'
import { isManualMethod } from '../lib/tuition-methods'

describe('isManualMethod', () => {
  it('accepts the offline methods John listed', () => {
    for (const m of ['cash', 'bank-transfer', 'pos', 'card', 'other']) expect(isManualMethod(m)).toBe(true)
  })
  it('rejects paystack (online only), the dropped installment option, and junk', () => {
    for (const m of ['paystack', 'installment', '', 'CASH', null, 5]) expect(isManualMethod(m)).toBe(false)
  })
})
