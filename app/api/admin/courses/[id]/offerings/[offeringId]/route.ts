import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { validateClassesPerWeekOptions, validateRates } from '@/lib/admin-validation'

type Ctx = { params: Promise<{ id: string; offeringId: string }> }

const INCLUDE = {
  location: { select: { id: true, name: true, kind: true, isActive: true } },
  deliveryMode: { select: { id: true, name: true, isActive: true } },
  rates: { orderBy: { durationMins: 'asc' as const } },
}

// PATCH /api/admin/courses/[id]/offerings/[offeringId]
// {isActive?, classesPerWeekOptions?, rates?: [{durationMins, pricePerClass}]} (rates replace all existing)
export const PATCH = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId, offeringId } = await context.params
    const body = await req.json()

    const before = await prisma.courseOffering.findFirst({
      where: { id: offeringId, courseId },
      include: INCLUDE,
    })
    if (!before) return createErrorResponse('Offering not found', 404)

    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      return createErrorResponse('isActive must be a boolean', 400)
    }
    if (body.classesPerWeekOptions !== undefined && !validateClassesPerWeekOptions(body.classesPerWeekOptions)) {
      return createErrorResponse('Classes per week options must be a non-empty list of whole numbers from 1 to 7', 400)
    }
    if (body.rates !== undefined) {
      const rateError = validateRates(body.rates)
      if (rateError) return createErrorResponse(rateError, 400)
    }

    // Rate count the offering will have after this request; activation needs at least one.
    const rateCountAfter = body.rates !== undefined ? body.rates.length : before.rates.length
    const activeAfter = body.isActive ?? before.isActive
    if (activeAfter && rateCountAfter === 0) {
      return createErrorResponse('Add at least one rate before activating', 400)
    }

    const offering = await prisma.$transaction(async (tx) => {
      if (body.rates !== undefined) {
        await tx.offeringRate.deleteMany({ where: { offeringId } })
        if (body.rates.length > 0) {
          await tx.offeringRate.createMany({
            data: body.rates.map((r: { durationMins: number; pricePerClass: number }) => ({
              offeringId,
              durationMins: r.durationMins,
              pricePerClass: r.pricePerClass,
            })),
          })
        }
      }
      return tx.courseOffering.update({
        where: { id: offeringId },
        data: {
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
          ...(body.classesPerWeekOptions !== undefined ? { classesPerWeekOptions: body.classesPerWeekOptions } : {}),
        },
        include: INCLUDE,
      })
    })

    await logAdminAction({
      adminId: admin.id,
      action: 'offering.update',
      entityType: 'course_offering',
      entityId: offeringId,
      metadata: { courseId, before, after: offering },
    })

    return createResponse({ offering })
  } catch (error) {
    console.error('Update offering error:', error)
    return createErrorResponse('Failed to update offering', 500)
  }
})

// DELETE /api/admin/courses/[id]/offerings/[offeringId] - refused if enrollments reference it
export const DELETE = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId, offeringId } = await context.params
    const before = await prisma.courseOffering.findFirst({
      where: { id: offeringId, courseId },
      include: INCLUDE,
    })
    if (!before) return createErrorResponse('Offering not found', 404)

    const enrollments = await prisma.enrollment.count({ where: { offeringId } })
    if (enrollments > 0) {
      return createErrorResponse(
        `Cannot delete: ${enrollments} enrollment(s) reference this offering. Deactivate it instead.`,
        409,
      )
    }

    await prisma.courseOffering.delete({ where: { id: offeringId } })

    await logAdminAction({
      adminId: admin.id,
      action: 'offering.delete',
      entityType: 'course_offering',
      entityId: offeringId,
      metadata: { courseId, before },
    })

    return createResponse({ message: 'Offering deleted' })
  } catch (error) {
    console.error('Delete offering error:', error)
    return createErrorResponse('Failed to delete offering', 500)
  }
})
