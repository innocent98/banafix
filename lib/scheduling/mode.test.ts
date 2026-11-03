import { describe, expect, it } from 'vitest'
import { defaultSessionMode, isSessionMode, modeFitsLocation } from './mode'

describe('session modes', () => {
  it('knows the three modes', () => {
    expect(isSessionMode('HOME')).toBe(true)
    expect(isSessionMode('home')).toBe(false)
    expect(isSessionMode(null)).toBe(false)
  })
  it('defaults from the location kind and the delivery-mode name', () => {
    expect(defaultSessionMode('ONLINE', 'Online')).toBe('ONLINE')
    expect(defaultSessionMode('ONLINE', 'One-on-One')).toBe('ONLINE')
    expect(defaultSessionMode('PHYSICAL', 'Home Training')).toBe('HOME')
    expect(defaultSessionMode('PHYSICAL', 'home training ')).toBe('HOME')
    expect(defaultSessionMode('PHYSICAL', 'On-site')).toBe('CENTRE')
    expect(defaultSessionMode('PHYSICAL', null)).toBe('CENTRE')
  })
  it('ONLINE mode belongs to ONLINE locations only; CENTRE/HOME to physical ones', () => {
    expect(modeFitsLocation('ONLINE', 'ONLINE')).toBe(true)
    expect(modeFitsLocation('CENTRE', 'ONLINE')).toBe(false)
    expect(modeFitsLocation('HOME', 'PHYSICAL')).toBe(true)
    expect(modeFitsLocation('ONLINE', 'PHYSICAL')).toBe(false)
  })
})
