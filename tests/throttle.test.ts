import { describe, expect, it } from 'vitest'
import { isThrottled } from '../lib/throttle'

describe('isThrottled', () => {
  it('allows up to max hits in the window, then throttles', () => {
    const t0 = 1_000_000
    expect([1, 2, 3].map((i) => isThrottled('a', 3, 60_000, t0 + i))).toEqual([false, false, false])
    expect(isThrottled('a', 3, 60_000, t0 + 10)).toBe(true)
  })
  it('releases once the window has passed', () => {
    const t0 = 2_000_000
    isThrottled('b', 1, 1000, t0)
    expect(isThrottled('b', 1, 1000, t0 + 500)).toBe(true)
    expect(isThrottled('b', 1, 1000, t0 + 1500)).toBe(false)
  })
  it('keeps keys independent', () => {
    isThrottled('c', 1, 1000, 3_000_000)
    expect(isThrottled('d', 1, 1000, 3_000_000)).toBe(false)
  })
})
