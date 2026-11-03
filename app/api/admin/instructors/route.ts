import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { INSTRUCTOR_WITH_COURSES, setInstructorCourses, withCourses } from '@/lib/instructor-courses'

// GET /api/admin/instructors - list roster (optional ?q= on name), with courses taught
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    const q = new URL(req.url).searchParams.get('q')?.trim()
    const instructors = await prisma.instructor.findMany({
      where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
      include: INSTRUCTOR_WITH_COURSES,
      orderBy: { name: 'asc' },
    })
    return createResponse({ instructors: instructors.map(withCourses) })
  } catch (error) {
    console.error('List instructors error:', error)
    return createErrorResponse('Failed to fetch instructors', 500)
  }
})

// POST /api/admin/instructors - create a roster instructor, optionally assigning courses
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return createErrorResponse('Instructor name is required', 400)

    const courseIds: string[] = Array.isArray(body.courseIds) ? body.courseIds : []

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.instructor.create({
      data: {
        name,
        bio: body.bio?.trim() || null,
        avatar: body.avatar?.trim() || null,
        credentials: Array.isArray(body.credentials) ? body.credentials : [],
        rating: typeof body.rating === 'number' ? body.rating : 0,
        experience: body.experience?.trim() || null,
        availability: body.availability?.trim() || null,
        verified: Boolean(body.verified),
      },
      })
      // An instructor can teach several courses and a course can have several instructors.
      await setInstructorCourses(tx, row.id, courseIds)
      return row
    })
    const instructor = withCourses(await prisma.instructor.findUniqueOrThrow({ where: { id: created.id }, include: INSTRUCTOR_WITH_COURSES }))

    await logAdminAction({
      adminId: admin.id,
      action: 'instructor.create',
      entityType: 'instructor',
      entityId: instructor.id,
      metadata: { courseCount: instructor.courses.length },
    })

    return createResponse({ instructor, message: 'Instructor created' }, 201)
  } catch (error: any) {
    if (error?.code === 'P2025' || error?.code === 'P2003') return createErrorResponse('One or more selected courses were not found', 400)
    console.error('Create instructor error:', error)
    return createErrorResponse('Failed to create instructor', 500)
  }
})
