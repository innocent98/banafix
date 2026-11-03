import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import { buildPlanSnapshot } from '@/lib/offering-rates'

// POST /api/admin/enrollments/[id]/plan - agree the plan after assessment.
//   assessed    -> plan_agreed (rate SNAPSHOT written to the enrollment)
//   plan_agreed -> plan edited in place (re-snapshots the CURRENT rate; deliberate, audited)
// Later OfferingRate edits never touch an already-agreed plan.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const { offeringId, durationMins, classesPerWeek, plannedClasses } = body
    if (typeof offeringId !== 'string' || !offeringId) return createErrorResponse('offeringId is required', 400)

    const enrollment = await prisma.enrollment.findUnique({ where: { id } })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (enrollment.status !== 'assessed' && enrollment.status !== 'plan_agreed') {
      return createErrorResponse('A plan can only be agreed once the student has been assessed', 400)
    }

    const offering = await prisma.courseOffering.findUnique({
      where: { id: offeringId },
      include: { rates: true },
    })
    if (!offering || offering.courseId !== enrollment.courseId) {
      return createErrorResponse('offeringId must be an offering of this course', 400)
    }

    const snapshot = buildPlanSnapshot({
      rates: offering.rates,
      classesPerWeekOptions: offering.classesPerWeekOptions,
      durationMins: Number(durationMins),
      classesPerWeek: Number(classesPerWeek),
      plannedClasses: Number(plannedClasses),
    })
    if (!snapshot.ok) return createErrorResponse(snapshot.error, 400)

    const planData = {
      offeringId: offering.id,
      locationId: offering.locationId,
      durationMins: snapshot.durationMins,
      classesPerWeek: snapshot.classesPerWeek,
      plannedClasses: snapshot.plannedClasses,
      ratePerClass: snapshot.ratePerClass,
    }

    const from = enrollment.status
    if (from === 'assessed') {
      const moved = await transitionEnrollment(prisma, id, 'assessed', 'plan_agreed', planData)
      if (!moved) return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)
    } else {
      const edited = await prisma.enrollment.updateMany({ where: { id, status: 'plan_agreed' }, data: planData })
      if (edited.count !== 1) return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)
    }

    await logAdminAction({
      adminId: admin.id,
      action: from === 'assessed' ? 'plan.agree' : 'plan.edit',
      entityType: 'enrollment',
      entityId: id,
      metadata: {
        ...planData,
        total: snapshot.ratePerClass * snapshot.plannedClasses,
        fromStatus: from,
        toStatus: 'plan_agreed',
        previous: from === 'plan_agreed'
          ? { offeringId: enrollment.offeringId, durationMins: enrollment.durationMins, classesPerWeek: enrollment.classesPerWeek, plannedClasses: enrollment.plannedClasses, ratePerClass: enrollment.ratePerClass }
          : undefined,
      },
    })

    return createResponse({ enrollment: await prisma.enrollment.findUnique({ where: { id } }) })
  } catch (error) {
    console.error('Agree plan error:', error)
    return createErrorResponse('Failed to save plan', 500)
  }
})
