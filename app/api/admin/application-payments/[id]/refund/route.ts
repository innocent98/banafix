import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'

// POST /api/admin/application-payments/[id]/refund - record that a DUPLICATE assessment-fee payment
// has been refunded. The refund itself is done by hand in the Paystack dashboard; this only closes
// the "refund needed" flag. Only a `duplicate` payment can be marked refunded (the fee proper is
// non-refundable). Conditional update, so a double click records once.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))
    const payment = await prisma.applicationPayment.findUnique({
      where: { id },
      select: { status: true, enrollmentId: true, amount: true, paystackReference: true },
    })
    if (!payment) return createErrorResponse('Payment not found', 404)
    if (payment.status !== 'duplicate') {
      return createErrorResponse('Only a duplicate payment needing a refund can be marked refunded', 400)
    }
    const done = await prisma.applicationPayment.updateMany({
      where: { id, status: 'duplicate' },
      data: { status: 'refunded', refundedAt: new Date(), refundedBy: admin.id },
    })
    if (done.count !== 1) return createErrorResponse('Already marked refunded', 409)

    await logAdminAction({
      adminId: admin.id,
      action: 'application.duplicate_refunded',
      entityType: 'application_payment',
      entityId: id,
      metadata: {
        enrollmentId: payment.enrollmentId,
        amount: payment.amount,
        reference: payment.paystackReference,
        note: body.note ?? null,
      },
    })
    return createResponse({ message: 'Marked as refunded' })
  } catch (error) {
    console.error('Mark refunded error:', error)
    return createErrorResponse('Failed to mark refunded', 500)
  }
})
