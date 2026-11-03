import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { INSTRUCTOR_WITH_COURSES, setInstructorCourses, withCourses } from '@/lib/instructor-courses'

// GET /api/admin/instructors/[id]
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const instructor = await prisma.instructor.findUnique({ where: { id }, include: INSTRUCTOR_WITH_COURSES })
    if (!instructor) return createErrorResponse('Instructor not found', 404)
    return createResponse({ instructor: withCourses(instructor) })
  } catch (error) {
    console.error('Get instructor error:', error)
    return createErrorResponse('Failed to fetch instructor', 500)
  }
})

// PATCH /api/admin/instructors/[id] - edit fields and/or reassign the set of courses taught
export const PATCH = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json()

    const existing = await prisma.instructor.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Instructor not found', 404)

    const data: Record<string, unknown> = {}
    if (typeof body.name === 'string') {
      if (!body.name.trim()) return createErrorResponse('Name cannot be empty', 400)
      data.name = body.name.trim()
    }
    if ('bio' in body) data.bio = body.bio?.trim() || null
    if ('avatar' in body) data.avatar = body.avatar?.trim() || null
    if ('credentials' in body) data.credentials = Array.isArray(body.credentials) ? body.credentials : []
    if ('rating' in body && typeof body.rating === 'number') data.rating = body.rating
    if ('experience' in body) data.experience = body.experience?.trim() || null
    if ('availability' in body) data.availability = body.availability?.trim() || null
    if ('verified' in body) data.verified = Boolean(body.verified)

    // Set the courses this instructor teaches, when provided. Adds/removes rows for THIS instructor only:
    // a course can have several instructors, so this never takes a course away from another teacher.
    if (body.courseIds !== undefined && !(Array.isArray(body.courseIds) && body.courseIds.every((c: unknown) => typeof c === 'string'))) {
      return createErrorResponse('courseIds must be a list of course ids', 400)
    }
    if (Array.isArray(body.courseIds)) {
      await prisma.$transaction((tx) => setInstructorCourses(tx, id, body.courseIds as string[]))
    }

    await prisma.instructor.update({ where: { id }, data })
    const instructor = withCourses(await prisma.instructor.findUniqueOrThrow({ where: { id }, include: INSTRUCTOR_WITH_COURSES }))

    await logAdminAction({
      adminId: admin.id,
      action: 'instructor.update',
      entityType: 'instructor',
      entityId: id,
      metadata: { courseCount: instructor.courses.length },
    })

    return createResponse({ instructor, message: 'Instructor updated' })
  } catch (error: any) {
    if (error?.code === 'P2003') return createErrorResponse('One or more selected courses were not found', 400)
    console.error('Update instructor error:', error)
    return createErrorResponse('Failed to update instructor', 500)
  }
})

// DELETE /api/admin/instructors/[id] - remove from roster (courses are freed, not deleted)
export const DELETE = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const existing = await prisma.instructor.findUnique({ where: { id } })
    if (!existing) return createErrorResponse('Instructor not found', 404)

    // Classes on record (any status) are history we keep: the FK restricts deletion, so say so plainly.
    const classes = await prisma.classSession.count({ where: { instructorId: id } })
    if (classes > 0) {
      return createErrorResponse(`${existing.name} has ${classes} ${classes === 1 ? 'class' : 'classes'} on record and cannot be removed. Reassign or cancel their upcoming classes and keep them on the roster`, 409)
    }

    // Courses.instructorId is ON DELETE SET NULL; availability and InstructorCourse rows cascade.
    await prisma.instructor.delete({ where: { id } })

    await logAdminAction({
      adminId: admin.id,
      action: 'instructor.delete',
      entityType: 'instructor',
      entityId: id,
      metadata: { name: existing.name },
    })

    return createResponse({ message: 'Instructor deleted' })
  } catch (error: any) {
    if (error?.code === 'P2003') return createErrorResponse('This instructor has classes on record and cannot be removed', 409)
    console.error('Delete instructor error:', error)
    return createErrorResponse('Failed to delete instructor', 500)
  }
})
