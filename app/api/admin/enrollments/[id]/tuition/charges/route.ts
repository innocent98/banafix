import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { classesDescription, topUpRate } from '@/lib/tuition-plan-charges'

const MAX_TOP_UP_CLASSES = 500

// POST /api/admin/enrollments/[id]/tuition/charges - add a charge to the ledger AFTER the plan (T3, T5):
//   { kind: 'CLASSES', quantity }  top-up classes at TODAY's rate for the student's offering + duration
//   { kind: 'MATERIAL', materialId } an active material of the course, price snapshotted now
// Never rewrites an old charge. The enrollment row is locked first so concurrent edits serialise.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        courseId: true,
        offeringId: true,
        durationMins: true,
        offering: { select: { rates: { select: { durationMins: true, pricePerClass: true } } } },
      },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (enrollment.status !== 'plan_agreed' && enrollment.status !== 'enrolled') {
      return createErrorResponse('Charges can only be added once the plan is agreed (and not after cancellation)', 400)
    }

    let line: { kind: 'CLASSES' | 'MATERIAL'; quantity: number; unitPrice: number; description: string; materialId?: string }
    if (body.kind === 'CLASSES') {
      const quantity = body.quantity
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TOP_UP_CLASSES) {
        return createErrorResponse(`Quantity must be a whole number from 1 to ${MAX_TOP_UP_CLASSES}`, 400)
      }
      const rate = topUpRate(enrollment.offering?.rates, enrollment.durationMins)
      if (rate === null) {
        return createErrorResponse('There is no current rate for this student\'s offering and class length; set the rate first', 400)
      }
      line = {
        kind: 'CLASSES',
        quantity,
        unitPrice: rate,
        description: `${classesDescription(quantity, enrollment.durationMins)} (top-up)`,
      }
    } else if (body.kind === 'MATERIAL') {
      if (typeof body.materialId !== 'string' || !body.materialId) return createErrorResponse('materialId is required', 400)
      const material = await prisma.material.findUnique({ where: { id: body.materialId } })
      if (!material || material.courseId !== enrollment.courseId || !material.isActive) {
        return createErrorResponse('materialId must be an active material of this course', 400)
      }
      line = { kind: 'MATERIAL', quantity: 1, unitPrice: material.price, description: material.name, materialId: material.id }
    } else {
      return createErrorResponse("kind must be 'CLASSES' or 'MATERIAL'", 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      // Row lock: serialises with other charge/void/plan writes for this enrollment.
      await tx.enrollment.updateMany({ where: { id }, data: { updatedAt: new Date() } })
      const existing = await tx.tuitionCharge.count({ where: { enrollmentId: id } })
      if (existing === 0) return { error: 'ledger' as const }
      if (line.materialId) {
        const dup = await tx.tuitionCharge.count({
          where: { enrollmentId: id, materialId: line.materialId, voidedAt: null },
        })
        if (dup > 0) return { error: 'duplicate' as const }
      }
      const charge = await tx.tuitionCharge.create({
        data: { enrollmentId: id, origin: 'ADJUSTMENT', createdBy: admin.id, materialId: null, ...line },
      })
      return { charge }
    })
    if ('error' in result) {
      return result.error === 'ledger'
        ? createErrorResponse('This enrollment has no tuition ledger yet; save the plan first', 409)
        : createErrorResponse('This material is already charged to the student', 409)
    }

    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.charge_add',
      entityType: 'tuition_charge',
      entityId: result.charge.id,
      metadata: { enrollmentId: id, ...line, total: line.quantity * line.unitPrice },
    })
    return createResponse({ charge: result.charge }, 201)
  } catch (error) {
    console.error('Add tuition charge error:', error)
    return createErrorResponse('Failed to add charge', 500)
  }
})
