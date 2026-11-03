import { parseHHMM } from './bands'
import { isSessionMode } from './mode'
import type { AvailabilityWindow } from './availability'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Parse the admin editor's payload `[{weekday, start:'HH:MM', end:'HH:MM'|'24:00', locationId, mode}]`. */
export function validateAvailabilitySlots(raw: unknown): { ok: true; slots: AvailabilityWindow[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: 'slots must be a list' }
  const slots: AvailabilityWindow[] = []
  for (const r of raw) {
    const o = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
    const weekday = o.weekday
    if (typeof weekday !== 'number' || !Number.isInteger(weekday) || weekday < 1 || weekday > 7) return { ok: false, error: 'Weekday must be 1 (Monday) to 7 (Sunday)' }
    const startMinute = parseHHMM(o.start)
    const endMinute = o.end === '24:00' ? 1440 : parseHHMM(o.end)
    if (startMinute === null || endMinute === null) return { ok: false, error: `${DAY_NAMES[weekday - 1]}: times must look like 09:00` }
    if (startMinute >= endMinute) return { ok: false, error: `${DAY_NAMES[weekday - 1]}: the start must be before the end` }
    if (typeof o.locationId !== 'string' || !o.locationId) return { ok: false, error: `${DAY_NAMES[weekday - 1]}: choose a location` }
    if (!isSessionMode(o.mode)) return { ok: false, error: `${DAY_NAMES[weekday - 1]}: mode must be CENTRE, HOME or ONLINE` }
    slots.push({ weekday, startMinute, endMinute, locationId: o.locationId, mode: o.mode })
  }
  slots.sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute)
  for (let i = 1; i < slots.length; i++) {
    const a = slots[i - 1]
    const b = slots[i]
    if (a.weekday === b.weekday && b.startMinute < a.endMinute) {
      const d = DAY_NAMES[a.weekday - 1]
      return { ok: false, error: `${d} ${hhmm(a.startMinute)} to ${hhmm(a.endMinute)} overlaps ${d} ${hhmm(b.startMinute)} to ${hhmm(b.endMinute)}` }
    }
  }
  return { ok: true, slots }
}
