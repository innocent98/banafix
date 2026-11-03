// Pure validators shared by the admin location/offering/material routes.

export function isNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0
}

/** Class length in minutes: integer 15..240. */
export function validateDurationMins(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 15 && v <= 240
}

/** Non-empty array of integers 1..7 (classes per week a student may choose). */
export function validateClassesPerWeekOptions(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 7)
  )
}

/** Returns an error string, or null when the rate list is valid (empty is valid). */
export function validateRates(rates: unknown): string | null {
  if (!Array.isArray(rates)) return 'rates must be an array'
  const seen = new Set<number>()
  for (const r of rates) {
    if (!r || typeof r !== 'object') return 'Each rate needs durationMins and pricePerClass'
    const { durationMins, pricePerClass } = r as Record<string, unknown>
    if (!validateDurationMins(durationMins)) return 'Duration must be a whole number of minutes between 15 and 240'
    if (!isNonNegativeInt(pricePerClass)) return 'Price per class must be a non-negative whole number'
    if (seen.has(durationMins)) return `Duplicate rate for ${durationMins} minutes`
    seen.add(durationMins)
  }
  return null
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Collision-safe: appends -2, -3, ... until the slug is not in `taken`. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}
