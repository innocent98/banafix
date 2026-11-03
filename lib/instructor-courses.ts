import type { Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient

/** An instructor teaches a course if they have an InstructorCourse row (or are the course's legacy primary). */
export async function instructorTeaches(db: Pick<Tx, 'instructorCourse' | 'course'>, instructorId: string, courseId: string): Promise<boolean> {
  const row = await db.instructorCourse.findUnique({ where: { instructorId_courseId: { instructorId, courseId } }, select: { courseId: true } })
  if (row) return true
  const course = await db.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  return course?.instructorId === instructorId
}

/**
 * Set the full list of courses an instructor teaches (adds and removes rows for THIS instructor only; it
 * never takes a course away from another teacher). Course.instructorId is the public /tutors "primary":
 * a course without one adopts this instructor; a removed primary hands over to another teacher or clears.
 */
export async function setInstructorCourses(tx: Tx, instructorId: string, courseIds: string[]): Promise<void> {
  const wanted = [...new Set(courseIds)]
  await tx.instructorCourse.deleteMany({ where: { instructorId, courseId: { notIn: wanted.length ? wanted : ['__none__'] } } })
  if (wanted.length) {
    await tx.instructorCourse.createMany({ data: wanted.map((courseId) => ({ instructorId, courseId })), skipDuplicates: true })
    await tx.course.updateMany({ where: { id: { in: wanted }, instructorId: null }, data: { instructorId } })
  }
  const orphaned = await tx.course.findMany({
    where: { instructorId, id: { notIn: wanted.length ? wanted : ['__none__'] } },
    select: { id: true },
  })
  for (const c of orphaned) {
    const other = await tx.instructorCourse.findFirst({ where: { courseId: c.id, instructorId: { not: instructorId } }, orderBy: { createdAt: 'asc' }, select: { instructorId: true } })
    await tx.course.update({ where: { id: c.id }, data: { instructorId: other?.instructorId ?? null } })
  }
}

/**
 * The course page names ONE instructor (Course.instructorId). Keep InstructorCourse in step: the previous
 * primary stops teaching it, the new one starts. Other teachers added from the instructor page are untouched.
 */
export async function setCoursePrimaryInstructor(tx: Tx, courseId: string, newInstructorId: string | null): Promise<void> {
  const course = await tx.course.findUnique({ where: { id: courseId }, select: { instructorId: true } })
  const previous = course?.instructorId ?? null
  if (previous && previous !== newInstructorId) {
    await tx.instructorCourse.deleteMany({ where: { instructorId: previous, courseId } })
  }
  if (newInstructorId) {
    await tx.instructorCourse.createMany({ data: [{ instructorId: newInstructorId, courseId }], skipDuplicates: true })
  }
}

const COURSE_SELECT = { id: true, title: true, instrument: true, level: true } as const

/** Prisma include that loads the courses an instructor teaches (M:N), for API responses. */
export const INSTRUCTOR_WITH_COURSES = { teaches: { select: { course: { select: COURSE_SELECT } }, orderBy: { createdAt: 'asc' as const } } } as const

/** Response shape the admin UI already expects: `courses` is the list the instructor teaches. */
export function withCourses<T extends { teaches: { course: { id: string; title: string; instrument: string; level: string } }[] }>(i: T) {
  const { teaches, ...rest } = i
  return { ...rest, courses: teaches.map((t) => t.course) }
}
