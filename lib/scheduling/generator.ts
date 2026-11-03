import { isWithinAvailability, type AvailabilityWindow } from './availability'
import type { MinuteWindow } from './bands'
import { overlaps, type Interval } from './overlap'
import { addDays, fromLagos, isoWeekdayOf, type DateKey } from './time'

export interface GenerateInput {
  /** First local date a class may fall on. */
  startDate: DateKey
  /** How many classes to place at most. */
  count: number
  /** Sequence numbers are firstSequence, firstSequence+1... unless `freeSequences` is given. */
  firstSequence?: number
  /** Exact sequence numbers to fill, in order (holes left by cancelled classes). */
  freeSequences?: number[]
  classesPerWeek: number
  durationMins: number
  /** ISO weekdays 1..7. Empty means Monday to Saturday (builder call S9). */
  preferredDays: number[]
  /** Student's acceptable minute-of-day windows (from `preferredWindows`). */
  windows: MinuteWindow[]
  /** Instructor availability; `null` ignores it (admin override). */
  availability: AvailabilityWindow[] | null
  where: { locationId: string | null; mode: string }
  /** Existing active sessions of the instructor AND the student. */
  busy: Interval[]
  /** Slots starting before this instant are never proposed (no booking in the past). */
  earliest?: Date
  stepMins?: number
  maxWeeks?: number
}

export interface GeneratedSlot {
  sequence: number
  startsAt: Date
  endsAt: Date
}

export interface Unplaced {
  sequence: number
  reason: string
}

const DEFAULT_DAYS = [1, 2, 3, 4, 5, 6]

/**
 * Pure planner. Weeks run Monday to Sunday. Each week it finds the preferred days that have a free
 * slot (earliest start on a `stepMins` grid inside preferred window ∩ availability, clear of every busy
 * interval and of what it has already placed), then spreads `classesPerWeek` evenly across those days.
 * Anything it cannot place is reported in `unplaced` with a reason; nothing is dropped silently.
 */
export function generateSessions(i: GenerateInput): { placed: GeneratedSlot[]; unplaced: Unplaced[] } {
  const step = i.stepMins ?? 15
  const maxWeeks = i.maxWeeks ?? 52
  const sequences = (i.freeSequences ?? Array.from({ length: Math.max(0, i.count) }, (_, k) => (i.firstSequence ?? 1) + k)).slice(0, Math.max(0, i.count))
  const days = [...new Set(i.preferredDays.length ? i.preferredDays : DEFAULT_DAYS)].sort((a, b) => a - b)
  const perWeek = Math.max(1, Math.floor(i.classesPerWeek))
  const busy: Interval[] = [...i.busy]
  const placed: GeneratedSlot[] = []

  const findSlot = (dateKey: DateKey): Interval | null => {
    for (const w of [...i.windows].sort((a, b) => a.start - b.start)) {
      for (let t = w.start; t + i.durationMins <= w.end; t += step) {
        const cand: Interval = { start: fromLagos(dateKey, t), end: fromLagos(dateKey, t + i.durationMins) }
        if (i.earliest && cand.start.getTime() < i.earliest.getTime()) continue
        if (i.availability !== null && !isWithinAvailability(cand, i.availability, i.where)) continue
        if (busy.some((b) => overlaps(cand, b))) continue
        return cand
      }
    }
    return null
  }

  const startDow = isoWeekdayOf(i.startDate)
  const firstMonday = addDays(i.startDate, -(startDow - 1))
  let next = 0
  for (let week = 0; week < maxWeeks && next < sequences.length; week++) {
    const monday = addDays(firstMonday, week * 7)
    const feasible: { slot: Interval }[] = []
    for (const wd of days) {
      const dateKey = addDays(monday, wd - 1)
      if (dateKey < i.startDate) continue
      const slot = findSlot(dateKey)
      if (slot) feasible.push({ slot })
    }
    if (!feasible.length) continue
    const take = Math.min(perWeek, feasible.length, sequences.length - next)
    for (let k = 0; k < take; k++) {
      const { slot } = feasible[Math.floor((k * feasible.length) / take)]
      busy.push(slot)
      placed.push({ sequence: sequences[next++], startsAt: slot.start, endsAt: slot.end })
    }
  }

  let reason = `No free time found within ${maxWeeks} weeks of ${i.startDate} that fits the student's preferences`
  if (i.windows.length === 0) reason = 'The preferred time window is empty (check the earliest/latest times)'
  else if (i.availability !== null && i.availability.length === 0) reason = 'The instructor has no availability set. Add availability or use an override'
  const unplaced = sequences.slice(next).map((sequence) => ({ sequence, reason }))
  return { placed, unplaced }
}
