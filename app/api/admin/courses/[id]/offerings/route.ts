import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { validateClassesPerWeekOptions } from '@/lib/admin-validation'

type Ctx = { params: Promise<{ id: string }> }

const OFFERING_INCLUDE = {
  location: { select: { id: true, name: true, kind: true, isActive: true } },
  deliveryMode: { select: { id: true, name: true, isActive: true } },
  rates: { orderBy: { durationMins: 'asc' as const } },
}

// GET /api/admin/courses/[id]/offerings - every offering of the course, with rates
export const GET = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id } = await context.params
    const offerings = await prisma.courseOffering.findMany({
      where: { courseId: id },
      include: OFFERING_INCLUDE,
      orderBy: { createdAt: 'asc' },
    })
    return createResponse({ offerings })
  } catch (error) {
    console.error('Get offerings error:', error)
    return createErrorResponse('Failed to fetch offerings', 500)
  }
})

// POST /api/admin/courses/[id]/offerings - {locationId, deliveryModeId, classesPerWeekOptions?, isActive?}
// New offerings have no rates, so they cannot be created active.
export const POST = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId } = await context.params
    const body = await req.json()

    if (typeof body.locationId !== 'string' || typeof body.deliveryModeId !== 'string') {
      return createErrorResponse('locationId and deliveryModeId are required', 400)
    }
    if (body.classesPerWeekOptions !== undefined && !validateClassesPerWeekOptions(body.classesPerWeekOptions)) {
      return createErrorResponse('Classes per week options must be a non-empty list of whole numbers from 1 to 7', 400)
    }
    if (body.isActive === true) return createErrorResponse('Add at least one rate before activating', 400)

    const [course, location, mode] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
      prisma.location.findUnique({ where: { id: body.locationId }, select: { id: true } }),
      prisma.deliveryMode.findUnique({ where: { id: body.deliveryModeId }, select: { id: true } }),
    ])
    if (!course) return createErrorResponse('Course not found', 404)
    if (!location) return createErrorResponse('Location not found', 404)
    if (!mode) return createErrorResponse('Delivery mode not found', 404)

    const dup = await prisma.courseOffering.findUnique({
      where: {
        courseId_locationId_deliveryModeId: {
          courseId,
          locationId: body.locationId,
          deliveryModeId: body.deliveryModeId,
        },
      },
    })
    if (dup) return createErrorResponse('This course already has an offering for that location and format', 409)

    const offering = await prisma.courseOffering.create({
      data: {
        courseId,
        locationId: body.locationId,
        deliveryModeId: body.deliveryModeId,
        ...(body.classesPerWeekOptions ? { classesPerWeekOptions: body.classesPerWeekOptions } : {}),
        isActive: false,
      },
      include: OFFERING_INCLUDE,
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'offering.create',
      entityType: 'course_offering',
      entityId: offering.id,
      metadata: { courseId, after: offering },
    })

    return createResponse({ offering }, 201)
  } catch (error) {
    console.error('Create offering error:', error)
    return createErrorResponse('Failed to create offering', 500)
  }
})
