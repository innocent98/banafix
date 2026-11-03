import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import { buildPlanSnapshot } from '@/lib/offering-rates'
import { buildPlanCharges } from '@/lib/tuition-plan-charges'

// POST /api/admin/enrollments/[id]/plan - agree the plan after assessment.
//   assessed    -> plan_agreed (rate SNAPSHOT written to the enrollment)
//   plan_agreed -> plan edited in place (re-snapshots the CURRENT rate; deliberate, audited)
// Later OfferingRate edits never touch an already-agreed plan.
// Stream 5: the same transaction (re)creates the tuition charges (CLASSES + required materials + chosen
// optional `materialIds`); an edit voids the previous PLAN charges first. See lib/tuition-plan-charges.ts.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const { offeringId, durationMins, classesPerWeek, plannedClasses } = body
    const materialIds: unknown = body.materialIds ?? []
    if (!Array.isArray(materialIds) || materialIds.some((m) => typeof m !== 'string')) {
      return createErrorResponse('materialIds must be an array of material ids', 400)
    }
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

    const materials = await prisma.material.findMany({
      where: { courseId: enrollment.courseId },
      select: { id: true, name: true, price: true, required: true, isActive: true },
      orderBy: { createdAt: 'asc' },
    })
    const charges = buildPlanCharges({
      plannedClasses: snapshot.plannedClasses,
      ratePerClass: snapshot.ratePerClass,
      durationMins: snapshot.durationMins,
      materials,
      optionalMaterialIds: materialIds as string[],
    })
    if (!charges.ok) return createErrorResponse(charges.error, 400)

    const from = enrollment.status
    // ONE transaction: the status move / plan edit FIRST (it row-locks the enrollment, which serialises
    // two concurrent edits), then the PLAN charges are voided and recreated.
    const outcome = await prisma.$transaction(async (tx) => {
      const ok =
        from === 'assessed'
          ? await transitionEnrollment(tx, id, 'assessed', 'plan_agreed', planData)
          : (await tx.enrollment.updateMany({ where: { id, status: 'plan_agreed' }, data: planData })).count === 1
      if (!ok) return null
      const voided = await tx.tuitionCharge.updateMany({
        where: { enrollmentId: id, origin: 'PLAN', voidedAt: null },
        data: { voidedAt: new Date(), voidedBy: admin.id, voidReason: 'Plan edited' },
      })
      await tx.tuitionCharge.createMany({
        data: charges.lines.map((l) => ({
          enrollmentId: id,
          kind: l.kind,
          origin: 'PLAN',
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          description: l.description,
          materialId: l.materialId ?? null,
          createdBy: admin.id,
        })),
      })
      return { voided: voided.count }
    })
    if (!outcome) return createErrorResponse('The enrollment changed while you were editing; refresh and try again', 409)

    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.charges_created',
      entityType: 'enrollment',
      entityId: id,
      metadata: {
        lines: charges.lines,
        total: charges.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
        voidedPlanCharges: outcome.voided,
      },
    })

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
