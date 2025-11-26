import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/courses/[id] - Get course details
export const GET = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        curriculum: {
          orderBy: { order: 'asc' },
        },
        faqs: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    if (!course) {
      return createErrorResponse('Course not found', 404)
    }

    return createResponse({ course })
  } catch (error) {
    console.error('Get course error:', error)
    return createErrorResponse('Failed to fetch course', 500)
  }
})

// PUT /api/admin/courses/[id] - Update course
export const PUT = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params
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
      seatsLeft,
      outcomes,
      equipment,
      image,
      sampleVideoUrl,
      sampleVideoTitle,
      sampleVideoDuration,
      isActive,
      isPublished,
    } = data

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (instrument !== undefined) updateData.instrument = instrument
    if (level !== undefined) updateData.level = level
    if (duration !== undefined) updateData.duration = duration
    if (location !== undefined) updateData.location = location
    if (session !== undefined) updateData.session = session
    if (sessionStartDate !== undefined) {
      updateData.sessionStartDate = sessionStartDate ? new Date(sessionStartDate) : null
    }
    if (availableModes !== undefined) updateData.availableModes = availableModes
    if (pricing !== undefined) updateData.pricing = pricing
    if (totalSeats !== undefined) updateData.totalSeats = totalSeats
    if (seatsLeft !== undefined) updateData.seatsLeft = seatsLeft
    if (outcomes !== undefined) updateData.outcomes = outcomes
    if (equipment !== undefined) updateData.equipment = equipment
    if (image !== undefined) updateData.image = image
    if (sampleVideoUrl !== undefined) updateData.sampleVideoUrl = sampleVideoUrl
    if (sampleVideoTitle !== undefined) updateData.sampleVideoTitle = sampleVideoTitle
    if (sampleVideoDuration !== undefined) updateData.sampleVideoDuration = sampleVideoDuration
    if (isActive !== undefined) updateData.isActive = isActive
    if (isPublished !== undefined) updateData.isPublished = isPublished

    updateData.updatedAt = new Date()

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        instructor: true,
        curriculum: {
          orderBy: { order: 'asc' },
        },
        faqs: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return createResponse({ course })
  } catch (error) {
    console.error('Update course error:', error)
    return createErrorResponse('Failed to update course', 500)
  }
})

// DELETE /api/admin/courses/[id] - Delete course
export const DELETE = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params

    // Check if course has enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: id },
    })

    if (enrollmentCount > 0) {
      return createErrorResponse(
        `Cannot delete course. It has ${enrollmentCount} enrollment(s).`,
        400
      )
    }

    // Delete course (this will cascade delete instructor, curriculum, faqs)
    await prisma.course.delete({
      where: { id },
    })

    return createResponse({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return createErrorResponse('Failed to delete course', 500)
  }
})