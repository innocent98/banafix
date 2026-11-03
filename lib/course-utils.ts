/**
 * Utility functions for course expiration logic
 */

/**
 * Check if a course is expired based on its session start date
 * A course expires 30 days after its sessionStartDate
 * @param sessionStartDate - The session start date of the course
 * @returns true if the course is expired, false otherwise
 */
export function isCourseExpired(sessionStartDate: Date | string | null): boolean {
  if (!sessionStartDate) {
    return false // Courses without a start date never expire
  }

  const startDate = new Date(sessionStartDate)
  const expirationDate = new Date(startDate)
  expirationDate.setDate(expirationDate.getDate() + 30)

  return new Date() > expirationDate
}

/**
 * Get the expiration date for a course
 * @param sessionStartDate - The session start date of the course
 * @returns The expiration date (30 days after start) or null if no start date
 */
export function getCourseExpirationDate(sessionStartDate: Date | string | null): Date | null {
  if (!sessionStartDate) {
    return null
  }

  const startDate = new Date(sessionStartDate)
  const expirationDate = new Date(startDate)
  expirationDate.setDate(expirationDate.getDate() + 30)

  return expirationDate
}

/**
 * Get the cutoff date for filtering non-expired courses
 * This returns the date that is 30 days ago from now
 * Courses with sessionStartDate >= this date are still active
 * @returns Date representing 30 days ago
 */
export function getCourseExpirationCutoff(): Date {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 30)
  return cutoffDate
}

/**
 * Get course status including expiration information
 * @param course - Course object with sessionStartDate, isActive, and isPublished
 * @returns Object with status information
 */
export function getCourseStatus(course: {
  sessionStartDate: Date | string | null
  isActive: boolean
  isPublished: boolean
}) {
  const expired = isCourseExpired(course.sessionStartDate)
  const expirationDate = getCourseExpirationDate(course.sessionStartDate)

  return {
    isExpired: expired,
    expirationDate,
    isPubliclyVisible: course.isActive && course.isPublished && !expired,
    status: expired ? 'expired' : course.isPublished ? 'published' : 'draft'
  }
}
/**
 * Normalise a curriculum module's optional timeframe ("Weeks 1-2"). Blank,
 * missing or non-string input is stored as null so the public curriculum can
 * simply omit the label instead of rendering an empty one.
 */
export function normalizeWeeks(input: unknown): string | null {
  if (typeof input !== "string") return null
  const trimmed = input.trim()
  return trimmed === "" ? null : trimmed
}

function cleanText(input: unknown): string {
  return typeof input === "string" ? input.trim() : ""
}

function cleanTextList(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input.map(cleanText).filter((item) => item !== "")
}

/**
 * Turn the curriculum array the admin create form submits into rows ready for
 * `CurriculumModule`. Untitled modules are dropped; the survivors are numbered
 * and ordered from 1, matching how `POST .../curriculum` numbers a single add.
 */
export function buildCurriculumRows(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
    .map((m) => ({
      title: cleanText(m.title),
      weeks: normalizeWeeks(m.weeks),
      outcomes: cleanTextList(m.outcomes),
      tasks: cleanTextList(m.tasks),
    }))
    .filter((m) => m.title !== "")
    .map((m, i) => ({ module: i + 1, order: i + 1, ...m }))
}

/** Same for `CourseFAQ`: a row needs both a question and an answer. */
export function buildFaqRows(input: unknown) {
  if (!Array.isArray(input)) return []
  return input
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({ question: cleanText(f.question), answer: cleanText(f.answer) }))
    .filter((f) => f.question !== "" && f.answer !== "")
    .map((f, i) => ({ ...f, order: i + 1 }))
}
