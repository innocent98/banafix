import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

// GET /api/admin/enrollments/[id] - everything the "Assessment & plan" panel needs:
// the enrollment, ALL its assessments (newest first) and the course's offerings with rates.
// Legacy rows (no plan fields, no assessments) return empty/null values, never an error.
export const GET = withAuth(async (_req: NextRequest, _admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, address: true, landmark: true } },
        course: { select: { id: true, title: true } },
        location: { select: { id: true, name: true } },
        offering: { select: { id: true, deliveryMode: { select: { name: true } } } },
        assessments: {
          orderBy: { createdAt: 'desc' },
          include: { assessor: { select: { id: true, name: true } } },
        },
      },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)

    const offerings = await prisma.courseOffering.findMany({
      where: { courseId: enrollment.courseId },
      select: {
        id: true,
        isActive: true,
        classesPerWeekOptions: true,
        location: { select: { id: true, name: true } },
        deliveryMode: { select: { name: true } },
        rates: { select: { durationMins: true, pricePerClass: true }, orderBy: { durationMins: 'asc' } },
      },
      orderBy: [{ location: { name: 'asc' } }, { deliveryMode: { name: 'asc' } }],
    })

    // Materials for the plan step: required ones are always charged, optional ones can be picked.
    const materials = await prisma.material.findMany({
      where: { courseId: enrollment.courseId, isActive: true },
      select: { id: true, name: true, price: true, required: true },
      orderBy: { createdAt: 'asc' },
    })

    const { assessments, ...rest } = enrollment
    return createResponse({ enrollment: rest, assessments, offerings, materials })
  } catch (error) {
    console.error('Get admin enrollment error:', error)
    return createErrorResponse('Failed to fetch enrollment', 500)
  }
})
