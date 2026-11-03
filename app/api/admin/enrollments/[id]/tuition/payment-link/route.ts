import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { initializePayment, createTuitionPayment, generatePaymentReference } from '@/lib/paystack'
import { generateReceiptNumber } from '@/lib/receipt'
import { computeTuitionBalance } from '@/lib/tuition-balance'
import { checkPaymentAmount, toLedgerCharges, COUNTED_STATUSES } from '@/lib/tuition-ledger'
import { ONLINE_PAYMENT_METHOD } from '@/lib/tuition-methods'

const REUSE_WINDOW_MS = 10 * 60 * 1000

// POST /api/admin/enrollments/[id]/tuition/payment-link  { amount? }  (admin only)
// There is no student login, so the admin generates a Paystack link for a chosen amount (default = the
// outstanding balance, never more) and shares it by hand. The pending row is created BEFORE Paystack is
// called, so any reference that can be paid already has a record (T10). The webhook settles it.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    const body = await req.json().catch(() => ({}))

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: { select: { firstName: true, lastName: true, email: true } },
        course: { select: { id: true, pricing: true } },
        tuitionCharges: true,
        tuitionPayments: { where: { status: { in: [...COUNTED_STATUSES] } } },
      },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (!enrollment.applicationPaid) return createErrorResponse('Assessment fee must be paid before tuition', 400)
    if (enrollment.status !== 'plan_agreed' && enrollment.status !== 'enrolled') {
      return createErrorResponse('A payment link can only be created once the plan is agreed', 400)
    }

    const balance = computeTuitionBalance(
      enrollment,
      toLedgerCharges(enrollment.tuitionCharges),
      enrollment.tuitionPayments,
      (enrollment.course.pricing ?? null) as Record<string, number> | null,
    )
    if (balance.mode !== 'ledger') {
      return createErrorResponse('Online payment needs an agreed per-class plan; record this payment manually instead', 400)
    }
    if (balance.outstanding <= 0) return createErrorResponse('There is nothing outstanding to pay', 400)

    // Never more than is owed (T8); add a charge first to take payment for more classes.
    const check = checkPaymentAmount(balance.outstanding, body.amount ?? balance.outstanding, false)
    if (!check.ok) return createErrorResponse(check.error, 400)
    const amount = check.amount

    // Lock the enrollment, then look for a reusable pending link and create the row in ONE transaction, so
    // two near-simultaneous clicks cannot both create a link. (Double click / retry: hand back the same
    // pending link for the same amount.)
    const reference = generatePaymentReference('tuition')
    const created = await prisma.$transaction(async (tx) => {
      const locked = await tx.enrollment.updateMany({
        where: { id, status: { in: ['plan_agreed', 'enrolled'] } },
        data: { updatedAt: new Date() },
      })
      if (locked.count === 0) return { kind: 'gone' as const }
      const existing = await tx.tuitionPayment.findFirst({
        where: {
          enrollmentId: id,
          status: 'pending',
          amount,
          paystackReference: { not: null },
          createdAt: { gte: new Date(Date.now() - REUSE_WINDOW_MS) },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) return { kind: 'existing' as const, existing }
      const row = await tx.tuitionPayment.create({
        data: {
          enrollmentId: id,
          amount,
          paymentMethod: ONLINE_PAYMENT_METHOD,
          description: 'Online tuition payment',
          status: 'pending',
          receiptNumber: generateReceiptNumber('TUI'),
          paystackReference: reference,
          recordedBy: admin.id,
        },
      })
      return { kind: 'created' as const, row }
    })
    if (created.kind === 'gone') return createErrorResponse('The enrollment changed (cancelled?); refresh and try again', 409)
    if (created.kind === 'existing') {
      const existing = created.existing
      // Created a moment ago and Paystack has not answered yet: do not make a second link for the same amount.
      if (!existing.paymentUrl) return createErrorResponse('A payment link for this amount is being created; try again in a moment', 409)
      return createResponse(
        { payment: { id: existing.id, amount: existing.amount, paymentUrl: existing.paymentUrl, reference: existing.paystackReference }, reused: true },
        200,
      )
    }
    const row = created.row

    let paymentUrl: string
    try {
      const init = await initializePayment(
        createTuitionPayment({
          email: enrollment.student.email,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          enrollmentId: id,
          courseId: enrollment.course.id,
          tuitionPaymentId: row.id,
          amount,
          reference,
        }),
      )
      if (!init.status || !init.data?.authorization_url) throw new Error(init.message || 'Paystack did not return a payment link')
      paymentUrl = init.data.authorization_url
    } catch (error) {
      // Nothing payable was created: drop the row so no dead pending link lingers.
      await prisma.tuitionPayment.delete({ where: { id: row.id } }).catch(() => undefined)
      console.error('Tuition link initialise failed:', error)
      return createErrorResponse('Could not create the payment link with Paystack. Try again.', 502)
    }

    await prisma.tuitionPayment.update({ where: { id: row.id }, data: { paymentUrl } })
    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.link_create',
      entityType: 'tuition_payment',
      entityId: row.id,
      metadata: { enrollmentId: id, amount, reference, outstandingBefore: balance.outstanding },
    })

    return createResponse({ payment: { id: row.id, amount, paymentUrl, reference }, reused: false }, 201)
  } catch (error) {
    console.error('Create tuition payment link error:', error)
    return createErrorResponse('Failed to create payment link', 500)
  }
})
