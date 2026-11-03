import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/enrollments/[id]/tuition/charges/[chargeId]/void  { reason }
// Charges are voided, never deleted (T4). Voiding below what was paid shows as credit, never an error.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string; chargeId: string }> }) => {
  try {
    const { id, chargeId } = await context.params
    const body = await req.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!reason || reason.length > 200) return createErrorResponse('A reason (up to 200 characters) is required', 400)

    const result = await prisma.$transaction(async (tx) => {
      // Same row lock as the other ledger writes.
      const locked = await tx.enrollment.updateMany({ where: { id }, data: { updatedAt: new Date() } })
      if (locked.count === 0) return 'missing' as const
      const voided = await tx.tuitionCharge.updateMany({
        where: { id: chargeId, enrollmentId: id, voidedAt: null },
        data: { voidedAt: new Date(), voidedBy: admin.id, voidReason: reason },
      })
      return voided.count === 1 ? ('voided' as const) : ('gone' as const)
    })
    if (result === 'missing') return createErrorResponse('Enrollment not found', 404)
    if (result === 'gone') return createErrorResponse('Charge not found or already voided', 409)

    const charge = await prisma.tuitionCharge.findUnique({ where: { id: chargeId } })
    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.charge_void',
      entityType: 'tuition_charge',
      entityId: chargeId,
      metadata: {
        enrollmentId: id,
        reason,
        kind: charge?.kind,
        total: charge ? charge.quantity * charge.unitPrice : undefined,
      },
    })
    return createResponse({ charge })
  } catch (error) {
    console.error('Void tuition charge error:', error)
    return createErrorResponse('Failed to void charge', 500)
  }
})
