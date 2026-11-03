import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/instructors - Public endpoint: instructors who teach at least one
// published, active course. An instructor can now teach multiple courses.
export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        courses: { some: { isPublished: true, isActive: true } },
      },
      include: {
        courses: {
          where: { isPublished: true, isActive: true },
          select: {
            id: true,
            title: true,
            instrument: true,
            level: true,
            duration: true,
            image: true,
            sessionStartDate: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    })

    // Transform to the frontend shape. `course` is kept (the primary/first published
    // course) for backward compatibility; `courses`/aggregates reflect the roster model.
    const transformedInstructors = instructors.map((instructor: any) => {
      const courses = instructor.courses as any[]
      const primary = courses[0] ?? null
      const specialties = Array.from(new Set(courses.map((c) => c.instrument).filter(Boolean)))
      return {
        id: instructor.id,
        name: instructor.name,
        avatar: instructor.avatar,
        bio: instructor.bio,
        credentials: instructor.credentials,
        rating: instructor.rating,
        experience: instructor.experience,
        availability: instructor.availability,
        verified: instructor.verified,
        course: primary
          ? {
              id: primary.id,
              title: primary.title,
              instrument: primary.instrument,
              level: primary.level,
              duration: primary.duration,
              image: primary.image,
              sessionStartDate: primary.sessionStartDate,
            }
          : null,
        specialties,
        courses: courses.length,
        languages: ['English'],
      }
    })

    return createResponse({
      instructors: transformedInstructors,
      total: transformedInstructors.length,
    })
  } catch (error) {
    console.error('Get public instructors error:', error)
    return createErrorResponse('Failed to fetch instructors', 500)
  }
}
