import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/tuition-payments/[id]/cancel - withdraw a still-pending online payment link (T15).
// A pending Paystack transaction cannot be revoked on Paystack's side: if money still arrives the webhook
// settles a cancelled row (the money fact wins), so cancelling only tidies the list.
export const POST = withAuth(async (_req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const result = await prisma.tuitionPayment.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'cancelled' },
    })
    if (result.count === 0) return createErrorResponse('Only a pending payment link can be cancelled', 400)
    await logAdminAction({ adminId: admin.id, action: 'tuition.payment_cancel', entityType: 'tuition_payment', entityId: id })
    return createResponse({ message: 'Payment link cancelled' })
  } catch (error) {
    console.error('Cancel tuition payment error:', error)
    return createErrorResponse('Failed to cancel payment link', 500)
  }
})
