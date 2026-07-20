import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getCourseExpirationCutoff } from '@/lib/course-utils'

// GET /api/courses - Public endpoint to list published courses
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const instrument = url.searchParams.get('instrument') || ''
    const level = url.searchParams.get('level') || ''
    const location = url.searchParams.get('location') || ''

    const skip = (page - 1) * limit

    // Get cutoff date for course expiration (30 days ago)
    const expirationCutoff = getCourseExpirationCutoff()

    const where: any = {
      isPublished: true,
      isActive: true,
      // Only show courses that are not expired
      // A course is expired if sessionStartDate is more than 30 days ago
      AND: [
        {
          OR: [
            { sessionStartDate: null }, // Courses without start date never expire
            { sessionStartDate: { gte: expirationCutoff } } // Courses that haven't expired yet
          ]
        }
      ]
    }

    if (search) {
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      })
    }

    if (instrument && instrument !== 'all') where.instrument = instrument
    if (level && level !== 'all') where.level = level
    if (location && location !== 'all') where.location = location

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: {
            select: {
              name: true,
              rating: true,
              experience: true,
              verified: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: [
          { sessionStartDate: 'asc' },
          { updatedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    // Transform courses to match frontend expectations
    const transformedCourses = courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      instrument: course.instrument,
      level: course.level,
      duration: course.duration,
      location: course.location,
      session: course.session,
      sessionStartDate: course.sessionStartDate,
      modes: course.availableModes,
      pricing: course.pricing,
      price: course.pricing ? Math.min(...Object.values(course.pricing as Record<string, number>)) : 0,
      totalSeats: course.totalSeats,
      seatsLeft: course.seatsLeft,
      unlimitedSeats: course.unlimitedSeats,
      outcomes: course.outcomes,
      equipment: course.equipment,
      image: course.image,
      instructor: course.instructor ? {
        name: course.instructor.name,
        rating: course.instructor.rating,
        experience: course.instructor.experience,
        verified: course.instructor.verified,
      } : null,
      students: course._count.enrollments,
      rating: course.instructor?.rating || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }))

    return createResponse({
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get public courses error:', error)
    return createErrorResponse('Failed to fetch courses', 500)
  }
}