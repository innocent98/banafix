/** Pure per-class rate logic (D8). Amounts are whole naira. */
export interface Rate {
  durationMins: number
  pricePerClass: number
}

/** The rate for an exact class duration, or null when that duration is not priced. */
export function resolveRate(rates: Rate[], durationMins: number): number | null {
  const match = rates.find((rate) => rate.durationMins === durationMins)
  return match ? match.pricePerClass : null
}

/** Cheapest per-class rate, for "from ₦X per class" captions. Null when nothing is priced. */
export function fromRate(rates: Rate[]): number | null {
  return rates.length ? Math.min(...rates.map((rate) => rate.pricePerClass)) : null
}

export function planTotal(ratePerClass: number, plannedClasses: number): number {
  return ratePerClass * plannedClasses
}

/** Largest class count one plan may hold (a typo guard; also keeps quantity x rate inside an int column). */
export const MAX_PLANNED_CLASSES = 1000

/** A whole number from a JSON number or a digit string; NaN for anything else (booleans, null, '1e3', ...). */
export function toWholeNumber(v: unknown): number {
  if (typeof v === 'number') return Number.isInteger(v) ? v : NaN
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim())
  return NaN
}

export type PlanSnapshot =
  | {
      ok: true
      ratePerClass: number
      durationMins: number
      classesPerWeek: number
      plannedClasses: number
    }
  | { ok: false; error: string }

/**
 * Validate an agreed plan against the offering and snapshot the rate. The snapshot is stored on
 * the Enrollment so later OfferingRate edits never move an existing student's price.
 */
export function buildPlanSnapshot(input: {
  rates: Rate[]
  classesPerWeekOptions: number[]
  durationMins: number
  classesPerWeek: number
  plannedClasses: number
}): PlanSnapshot {
  const { rates, classesPerWeekOptions, durationMins, classesPerWeek, plannedClasses } = input
  const rate = resolveRate(rates, durationMins)
  if (rate === null) {
    return { ok: false, error: `This offering has no rate for ${durationMins}-minute classes` }
  }
  if (!Number.isInteger(classesPerWeek) || !classesPerWeekOptions.includes(classesPerWeek)) {
    return {
      ok: false,
      error: `Classes per week must be one of: ${classesPerWeekOptions.join(', ')}`,
    }
  }
  if (!Number.isInteger(plannedClasses) || plannedClasses <= 0 || plannedClasses > MAX_PLANNED_CLASSES) {
    return { ok: false, error: `Planned classes must be a whole number from 1 to ${MAX_PLANNED_CLASSES}` }
  }
  return { ok: true, ratePerClass: rate, durationMins, classesPerWeek, plannedClasses }
}
