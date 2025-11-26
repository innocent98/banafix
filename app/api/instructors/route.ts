import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/instructors - Public endpoint to get all instructors from published courses
export async function GET() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        course: {
          isPublished: true,
          isActive: true
        }
      },
      include: {
        course: {
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
            seatsLeft: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    })

    // Transform instructors to match the expected frontend format
    const transformedInstructors = instructors.map((instructor) => ({
      id: instructor.id,
      name: instructor.name,
      avatar: instructor.avatar,
      bio: instructor.bio,
      credentials: instructor.credentials,
      rating: instructor.rating,
      experience: instructor.experience,
      availability: instructor.availability,
      verified: instructor.verified,
      // Transform course data
      course: instructor.course ? {
        id: instructor.course.id,
        title: instructor.course.title,
        instrument: instructor.course.instrument,
        level: instructor.course.level,
        duration: instructor.course.duration,
        location: instructor.course.location,
        image: instructor.course.image,
        sessionStartDate: instructor.course.sessionStartDate,
        modes: instructor.course.availableModes,
        pricing: instructor.course.pricing,
        totalSeats: instructor.course.totalSeats,
        seatsLeft: instructor.course.seatsLeft
      } : null,
      // For compatibility with existing frontend
      specialties: [instructor.course?.instrument].filter(Boolean),
      students: instructor.course?.totalSeats ? instructor.course.totalSeats - instructor.course.seatsLeft : 0,
      location: instructor.course?.location || "Online",
      courses: 1, // Single course per instructor for now
      languages: ["English"], // Default languages
      hourlyRate: instructor.course?.pricing ?
        Math.min(...Object.values(instructor.course.pricing as Record<string, number>)) :
        5000
    }))

    return createResponse({
      instructors: transformedInstructors,
      total: transformedInstructors.length
    })
  } catch (error) {
    console.error('Get public instructors error:', error)
    return createErrorResponse('Failed to fetch instructors', 500)
  }
}