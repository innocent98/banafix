import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/courses/[id]/instructor - set this course's instructor.
// Accepts either `instructorId` (assign an existing roster instructor, or null to
// unassign) OR instructor detail fields (updates the course's current instructor,
// or creates a new roster entry and assigns it).
export const PUT = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const data = await req.json()

    const course = await prisma.course.findUnique({ where: { id }, select: { id: true, instructorId: true } })
    if (!course) return createErrorResponse('Course not found', 404)

    // Explicit unassign.
    if (data.instructorId === null) {
      await prisma.course.update({ where: { id }, data: { instructorId: null } })
      return createResponse({ instructor: null })
    }

    // Assign an existing roster instructor by id.
    if (typeof data.instructorId === 'string' && data.instructorId) {
      const exists = await prisma.instructor.findUnique({ where: { id: data.instructorId } })
      if (!exists) return createErrorResponse('Instructor not found', 404)
      await prisma.course.update({ where: { id }, data: { instructorId: data.instructorId } })
      const instructor = await prisma.instructor.findUnique({
        where: { id: data.instructorId },
        include: { courses: { select: { id: true, title: true } } },
      })
      return createResponse({ instructor })
    }

    // Otherwise: detail fields provided — update the course's current instructor,
    // or create a new roster entry and assign it.
    if (!data.name) {
      return createErrorResponse('Instructor name or instructorId is required', 400)
    }
    const fields = {
      name: data.name,
      bio: data.bio ?? null,
      avatar: data.avatar ?? null,
      credentials: data.credentials || [],
      rating: data.rating || 0,
      experience: data.experience ?? null,
      availability: data.availability ?? null,
      verified: data.verified || false,
    }

    let instructorId = course.instructorId
    if (instructorId) {
      await prisma.instructor.update({ where: { id: instructorId }, data: fields })
    } else {
      const created = await prisma.instructor.create({ data: fields })
      instructorId = created.id
      await prisma.course.update({ where: { id }, data: { instructorId } })
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: { courses: { select: { id: true, title: true } } },
    })
    return createResponse({ instructor })
  } catch (error) {
    console.error('Set course instructor error:', error)
    return createErrorResponse('Failed to set course instructor', 500)
  }
})
