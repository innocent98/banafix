import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { isNonNegativeInt, validateDurationMins } from '@/lib/admin-validation'

type Ctx = { params: Promise<{ id: string }> }

// POST /api/admin/courses/[id]/offerings/bulk-rate
// {durationMins, pricePerClass, offeringIds?: string[], all?: boolean}
// Upserts that duration's rate on the chosen offerings of THIS course; returns the count.
export const POST = withAuth(async (req: NextRequest, admin, context: Ctx) => {
  try {
    const { id: courseId } = await context.params
    const body = await req.json()

    if (!validateDurationMins(body.durationMins)) {
      return createErrorResponse('Duration must be a whole number of minutes between 15 and 240', 400)
    }
    if (!isNonNegativeInt(body.pricePerClass)) {
      return createErrorResponse('Price per class must be a non-negative whole number', 400)
    }
    const hasIds = Array.isArray(body.offeringIds) && body.offeringIds.length > 0
    if (!hasIds && body.all !== true) {
      return createErrorResponse('Choose offerings (offeringIds) or set all: true', 400)
    }
    if (hasIds && !body.offeringIds.every((x: unknown) => typeof x === 'string')) {
      return createErrorResponse('offeringIds must be strings', 400)
    }

    // Scoping by courseId means ids from another course are silently ignored.
    const offerings = await prisma.courseOffering.findMany({
      where: { courseId, ...(body.all === true ? {} : { id: { in: body.offeringIds } }) },
      select: { id: true },
    })

    await prisma.$transaction(
      offerings.map((o) =>
        prisma.offeringRate.upsert({
          where: { offeringId_durationMins: { offeringId: o.id, durationMins: body.durationMins } },
          create: { offeringId: o.id, durationMins: body.durationMins, pricePerClass: body.pricePerClass },
          update: { pricePerClass: body.pricePerClass },
        }),
      ),
    )

    await logAdminAction({
      adminId: admin.id,
      action: 'offering.bulk_rate',
      entityType: 'course_offering',
      entityId: courseId,
      metadata: {
        courseId,
        durationMins: body.durationMins,
        pricePerClass: body.pricePerClass,
        offeringIds: offerings.map((o) => o.id),
      },
    })

    return createResponse({ count: offerings.length })
  } catch (error) {
    console.error('Bulk rate error:', error)
    return createErrorResponse('Failed to set rates', 500)
  }
})
