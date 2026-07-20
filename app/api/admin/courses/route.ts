import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { getCourseExpirationCutoff, getCourseStatus } from '@/lib/course-utils'

// GET /api/admin/courses - List all courses
export const GET = withAuth(async (req: NextRequest, admin) => {
  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const instrument = url.searchParams.get('instrument') || ''
    const level = url.searchParams.get('level') || ''
    const status = url.searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Get cutoff date for course expiration (30 days ago)
    const expirationCutoff = getCourseExpirationCutoff()

    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (instrument) where.instrument = instrument
    if (level) where.level = level
    if (status === 'published') where.isPublished = true
    if (status === 'draft') where.isPublished = false
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    // Handle expired status filter
    if (status === 'expired') {
      where.AND = [
        { sessionStartDate: { not: null } }, // Must have a session start date
        { sessionStartDate: { lt: expirationCutoff } } // Session started more than 30 days ago
      ]
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          instructor: true,
          _count: {
            select: {
              curriculum: true,
              faqs: true,
              enrollments: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    // Transform courses to include expiration status
    const transformedCourses = courses.map((course: any) => {
      const statusInfo = getCourseStatus({
        sessionStartDate: course.sessionStartDate,
        isActive: course.isActive,
        isPublished: course.isPublished
      })

      return {
        ...course,
        isExpired: statusInfo.isExpired,
        expirationDate: statusInfo.expirationDate,
        isPubliclyVisible: statusInfo.isPubliclyVisible,
        computedStatus: statusInfo.status
      }
    })

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
    console.error('Get courses error:', error)
    return createErrorResponse('Failed to fetch courses', 500)
  }
})

// POST /api/admin/courses - Create new course
export const POST = withAuth(async (req: NextRequest, admin) => {
  try {
    const data = await req.json()

    const {
      title,
      description,
      instrument,
      level,
      duration,
      location,
      session,
      sessionStartDate,
      availableModes,
      pricing,
      totalSeats,
      unlimitedSeats,
      outcomes,
      equipment,
      image,
      sampleVideoUrl,
      sampleVideoTitle,
      sampleVideoDuration,
    } = data

    if (!title || !instrument || !level || !duration) {
      return createErrorResponse('Title, instrument, level, and duration are required', 400)
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        instrument,
        level,
        duration,
        location,
        session,
        sessionStartDate: sessionStartDate ? new Date(sessionStartDate) : null,
        availableModes: availableModes || [],
        pricing: pricing || {},
        totalSeats: totalSeats || 20,
        seatsLeft: totalSeats || 20,
        unlimitedSeats: unlimitedSeats ?? false,
        outcomes: outcomes || [],
        equipment: equipment || [],
        image,
        sampleVideoUrl,
        sampleVideoTitle,
        sampleVideoDuration,
        isActive: true,
        isPublished: false,
      },
      include: {
        instructor: true,
      },
    })

    return createResponse({ course }, 201)
  } catch (error) {
    console.error('Create course error:', error)
    return createErrorResponse('Failed to create course', 500)
  }
})