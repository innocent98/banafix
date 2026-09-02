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
            location: true,
            image: true,
            sessionStartDate: true,
            availableModes: true,
            pricing: true,
            totalSeats: true,
            seatsLeft: true,
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
      const students = courses.reduce(
        (sum, c) => sum + (c.totalSeats ? c.totalSeats - c.seatsLeft : 0),
        0,
      )
      const prices = courses.flatMap((c) =>
        c.pricing ? Object.values(c.pricing as Record<string, number>) : [],
      )
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
              location: primary.location,
              image: primary.image,
              sessionStartDate: primary.sessionStartDate,
              modes: primary.availableModes,
              pricing: primary.pricing,
              totalSeats: primary.totalSeats,
              seatsLeft: primary.seatsLeft,
            }
          : null,
        specialties,
        students,
        location: primary?.location || 'Online',
        courses: courses.length,
        languages: ['English'],
        hourlyRate: prices.length ? Math.min(...prices) : 5000,
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
