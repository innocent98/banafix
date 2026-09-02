import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

const COURSE_SELECT = { id: true, title: true, instrument: true, level: true } as const

// GET /api/admin/instructors/[id]
export const GET = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const instructor = await prisma.instructor.findUnique({
      where: { id },
      include: { courses: { select: COURSE_SELECT } },
    })
    if (!instructor) return createErrorResponse('Instructor not found', 404)
    return createResponse({ instructor })
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

    // Reassign the set of courses this instructor teaches, when provided.
    // A course has at most one instructor: selected courses are pointed here;
    // courses previously taught by this instructor but now deselected are freed.
    if (Array.isArray(body.courseIds)) {
      const courseIds: string[] = body.courseIds
      await prisma.$transaction([
        prisma.course.updateMany({
          where: { instructorId: id, id: { notIn: courseIds.length ? courseIds : ['__none__'] } },
          data: { instructorId: null },
        }),
        ...(courseIds.length
          ? [prisma.course.updateMany({ where: { id: { in: courseIds } }, data: { instructorId: id } })]
          : []),
      ])
    }

    const instructor = await prisma.instructor.update({
      where: { id },
      data,
      include: { courses: { select: COURSE_SELECT } },
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'instructor.update',
      entityType: 'instructor',
      entityId: id,
      metadata: { courseCount: instructor.courses.length },
    })

    return createResponse({ instructor, message: 'Instructor updated' })
  } catch (error) {
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

    // FK is ON DELETE SET NULL, so courses.instructorId is cleared automatically.
    await prisma.instructor.delete({ where: { id } })

    await logAdminAction({
      adminId: admin.id,
      action: 'instructor.delete',
      entityType: 'instructor',
      entityId: id,
      metadata: { name: existing.name },
    })

    return createResponse({ message: 'Instructor deleted' })
  } catch (error) {
    console.error('Delete instructor error:', error)
    return createErrorResponse('Failed to delete instructor', 500)
  }
})
