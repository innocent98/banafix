import { lagosParts } from './time'
import type { Interval } from './overlap'

export interface AvailabilityWindow {
  weekday: number // ISO 1..7
  startMinute: number
  endMinute: number
  locationId: string
  mode: string // CENTRE | HOME | ONLINE
}

/**
 * True iff the class (Lagos local time) lies wholly inside ONE availability window for the same
 * weekday, location and mode. A class crossing local midnight, or with no location, is never available.
 */
export function isWithinAvailability(
  i: Interval,
  windows: AvailabilityWindow[],
  where: { locationId: string | null; mode: string },
): boolean {
  if (where.locationId === null) return false
  const s = lagosParts(i.start)
  const durationMin = (i.end.getTime() - i.start.getTime()) / 60_000
  const endMinute = s.minuteOfDay + durationMin
  if (endMinute > 1440) return false
  return windows.some(
    (w) =>
      w.weekday === s.isoWeekday &&
      w.locationId === where.locationId &&
      w.mode === where.mode &&
      w.startMinute <= s.minuteOfDay &&
      endMinute <= w.endMinute,
  )
}
