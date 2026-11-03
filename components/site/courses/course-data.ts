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
