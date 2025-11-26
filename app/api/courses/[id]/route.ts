import { NextRequest } from 'next/server'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/courses/[id] - Public endpoint to get course details
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const course = await prisma.course.findUnique({
      where: {
        id,
        isPublished: true,
        isActive: true,
      },
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

    // Transform course to match frontend expectations
    const transformedCourse = {
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
      prices: course.pricing,
      totalSeats: course.totalSeats,
      seatsLeft: course.seatsLeft,
      outcomes: course.outcomes,
      equipment: course.equipment,
      image: course.image,
      sampleVideoUrl: course.sampleVideoUrl,
      sampleVideoTitle: course.sampleVideoTitle,
      sampleVideoDuration: course.sampleVideoDuration,
      instructor: course.instructor ? {
        name: course.instructor.name,
        bio: course.instructor.bio,
        avatar: course.instructor.avatar,
        credentials: course.instructor.credentials,
        rating: course.instructor.rating,
        experience: course.instructor.experience,
        availability: course.instructor.availability,
        verified: course.instructor.verified,
      } : null,
      curriculum: course.curriculum.map((module) => ({
        module: module.module,
        title: module.title,
        weeks: module.weeks,
        outcomes: module.outcomes,
        tasks: module.tasks,
      })),
      faqs: course.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
      })),
      students: course._count.enrollments,
      rating: course.instructor?.rating || 0,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }

    return createResponse({ course: transformedCourse })
  } catch (error) {
    console.error('Get public course error:', error)
    return createErrorResponse('Failed to fetch course', 500)
  }
}