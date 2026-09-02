/**
 * Shared shapes + derivations for the two course screens.
 *
 * Both screens read Prisma directly from their server components rather than
 * fetching their own `/api/courses` route: that route defaults to `limit=10`
 * and the old client page passed no limit, so the list silently truncated at
 * ten courses. Reading the model directly removes the pagination hop entirely.
 * The public visibility predicate below is a copy of the one in
 * `app/api/courses/route.ts` — keep the two in step.
 */
import { getCourseExpirationCutoff } from "@/lib/course-utils"

/** `isPublished && isActive && not expired` — same rule the public API applies. */
export function publicCourseWhere() {
  return {
    isPublished: true,
    isActive: true,
    OR: [
      { sessionStartDate: null },
      { sessionStartDate: { gte: getCourseExpirationCutoff() } },
    ],
  }
}

/**
 * `Course.pricing` is `Json`, so Prisma types it as `JsonValue`. Narrow it to
 * the delivery-mode → naira map the app actually stores, dropping anything
 * non-numeric rather than trusting the column.
 */
export function toPricing(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const out: Record<string, number> = {}
  for (const [mode, amount] of Object.entries(value as Record<string, unknown>)) {
    if (typeof amount === "number" && Number.isFinite(amount)) out[mode] = amount
  }
  return out
}

/** The "from" price — the cheapest mode. `null` when the course has no prices. */
export function fromPrice(pricing: Record<string, number>): number | null {
  const amounts = Object.values(pricing)
  return amounts.length ? Math.min(...amounts) : null
}

/** Only the modes that are both offered and priced can be selected or quoted. */
export function pricedModes(
  availableModes: string[],
  pricing: Record<string, number>,
): Array<{ mode: string; price: number }> {
  return availableModes
    .filter((mode) => typeof pricing[mode] === "number")
    .map((mode) => ({ mode, price: pricing[mode] as number }))
}

/**
 * `duration` is free text ("12 weeks", "8 weeks", "3 months"). Only a value
 * that actually parses to a week count may drive the per-lesson caption — the
 * handoff divides by a hardcoded 12, which would be wrong for every course
 * that is not twelve weeks long.
 */
export function parseWeeks(duration: string | null | undefined): number | null {
  if (!duration) return null
  const match = /(\d+)\s*weeks?\b/i.exec(duration)
  if (!match?.[1]) return null
  const weeks = Number.parseInt(match[1], 10)
  return Number.isFinite(weeks) && weeks > 0 ? weeks : null
}

/** "1 course" / "6 courses", "1 format" / "4 formats". */
export function plural(count: number, singular: string, pluralWord = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralWord}`
}

/**
 * Level chip order. Anything the DB holds outside these four (levels are free
 * text on the model) is appended alphabetically rather than dropped.
 */
const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "All Levels"]

export function sortLevels(levels: string[]): string[] {
  return [...levels].sort((a, b) => {
    const ai = LEVEL_ORDER.indexOf(a)
    const bi = LEVEL_ORDER.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })
}
