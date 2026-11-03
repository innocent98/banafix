import { describe, expect, it } from 'vitest'
import { BAND_WINDOWS, DEFAULT_WINDOW, parseHHMM, preferredWindows } from './bands'

describe('parseHHMM', () => {
  it('parses valid times to minutes', () => {
    expect(parseHHMM('09:30')).toBe(570)
    expect(parseHHMM('9:05')).toBe(545)
    expect(parseHHMM('00:00')).toBe(0)
    expect(parseHHMM('23:59')).toBe(1439)
  })
  it('rejects junk', () => {
    for (const bad of ['24:00', '12:60', 'noon', '', null, undefined, 930, '12']) expect(parseHHMM(bad as any)).toBeNull()
  })
})

describe('BAND_WINDOWS', () => {
  it('matches the labels in assessment-vocab (9-12, 1-5, 6-9)', () => {
    expect(BAND_WINDOWS.morning).toEqual({ start: 540, end: 720 })
    expect(BAND_WINDOWS.afternoon).toEqual({ start: 780, end: 1020 })
    expect(BAND_WINDOWS.evening).toEqual({ start: 1080, end: 1260 })
  })
})

describe('preferredWindows', () => {
  it('no preferences => the default window', () => {
    expect(preferredWindows({})).toEqual([DEFAULT_WINDOW])
    expect(preferredWindows({ bands: [], from: null, to: null })).toEqual([DEFAULT_WINDOW])
  })
  it('unions bands, sorted', () => {
    expect(preferredWindows({ bands: ['evening', 'morning'] })).toEqual([BAND_WINDOWS.morning, BAND_WINDOWS.evening])
  })
  it('ignores unknown bands; only-unknown falls back to default', () => {
    expect(preferredWindows({ bands: ['brunch'] })).toEqual([DEFAULT_WINDOW])
  })
  it('clips bands to from/to', () => {
    expect(preferredWindows({ bands: ['morning'], from: '10:00', to: '11:30' })).toEqual([{ start: 600, end: 690 }])
    expect(preferredWindows({ bands: ['morning', 'afternoon'], from: '11:00', to: '14:00' })).toEqual([
      { start: 660, end: 720 },
      { start: 780, end: 840 },
    ])
  })
  it('from/to without bands is the range itself', () => {
    expect(preferredWindows({ from: '07:00', to: '09:00' })).toEqual([{ start: 420, end: 540 }])
    expect(preferredWindows({ from: '16:00' })).toEqual([{ start: 960, end: 1440 }])
  })
  it('an empty or inverted clip yields no windows', () => {
    expect(preferredWindows({ bands: ['morning'], from: '13:00', to: '14:00' })).toEqual([])
    expect(preferredWindows({ from: '15:00', to: '14:00' })).toEqual([])
  })
  it('invalid from/to strings are ignored', () => {
    expect(preferredWindows({ bands: ['morning'], from: 'abc', to: '??' })).toEqual([BAND_WINDOWS.morning])
  })
})
