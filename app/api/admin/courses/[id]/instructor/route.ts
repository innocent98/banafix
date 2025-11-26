import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// PUT /api/admin/courses/[id]/instructor - Update course instructor
export const PUT = withAuth(async (req: NextRequest, admin, { params }: { params: { id: string } }) => {
  try {
    const { id } = params
    const data = await req.json()

    const {
      name,
      bio,
      avatar,
      credentials,
      rating,
      experience,
      availability,
      verified,
    } = data

    if (!name) {
      return createErrorResponse('Instructor name is required', 400)
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id },
    })

    if (!course) {
      return createErrorResponse('Course not found', 404)
    }

    // Upsert instructor (create or update)
    const instructor = await prisma.instructor.upsert({
      where: { courseId: id },
      update: {
        name,
        bio,
        avatar,
        credentials: credentials || [],
        rating: rating || 0,
        experience,
        availability,
        verified: verified || false,
      },
      create: {
        courseId: id,
        name,
        bio,
        avatar,
        credentials: credentials || [],
        rating: rating || 0,
        experience,
        availability,
        verified: verified || false,
      },
    })

    return createResponse({ instructor })
  } catch (error) {
    console.error('Update instructor error:', error)
    return createErrorResponse('Failed to update instructor', 500)
  }
})