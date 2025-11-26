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