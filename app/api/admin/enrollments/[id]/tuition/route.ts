import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { generateTuitionReceiptPDF, generateReceiptNumber } from '@/lib/receipt'
import { sendTuitionReceipt } from '@/lib/email'
import { logAdminAction } from '@/lib/audit'
import { transitionEnrollment } from '@/lib/enrollment-transition'
import { computeTuitionBalance } from '@/lib/tuition-balance'
import { checkPaymentAmount, toLedgerCharges, MAX_PAYMENT_NAIRA, COUNTED_STATUSES } from '@/lib/tuition-ledger'
import { MANUAL_PAYMENT_METHODS, isManualMethod } from '@/lib/tuition-methods'
import { loadTuitionReceiptData } from '@/lib/tuition-receipt-data'

const enrollmentForBalance = {
  student: {
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  },
  course: { select: { id: true, title: true, pricing: true } },
  tuitionCharges: { orderBy: { createdAt: 'asc' as const } },
  // Everything already paid toward tuition (completed + partial) for the balance.
  tuitionPayments: { where: { status: { in: [...COUNTED_STATUSES] } } },
}

// POST /api/admin/enrollments/[id]/tuition - Record a tuition payment taken in person (cash, transfer, POS, ...).
// Ledger enrollments (an agreed per-class plan): balance = charges - counted payments, status derived (T7).
// Legacy enrollments (no plan, no charges): the old Course.pricing balance and Full/Part marker, untouched.
export const POST = withAuth(async (req: NextRequest, admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const enrollmentId = params.id
    const data = await req.json().catch(() => ({}))

    const {
      amount,
      paymentMethod,
      description,
      sendReceipt = true,
      paymentType = 'full', // legacy rows only: 'full' | 'partial' admin marker
      allowOverpayment = false,
    } = data

    if (!amount || !paymentMethod) {
      return createErrorResponse('Amount and payment method are required', 400)
    }
    if (!isManualMethod(paymentMethod)) {
      return createErrorResponse(`Payment method must be one of: ${MANUAL_PAYMENT_METHODS.join(', ')}`, 400)
    }
    if (description != null && (typeof description !== 'string' || description.length > 500)) {
      return createErrorResponse('Description must be text of at most 500 characters', 400)
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: enrollmentForBalance,
    })
    if (!enrollment) {
      return createErrorResponse('Enrollment not found', 404)
    }
    if (!enrollment.applicationPaid) {
      return createErrorResponse('Assessment fee must be paid before recording tuition payments', 400)
    }
    // Tuition is only taken once the plan is agreed (or for an enrolled student). Before that no
    // price exists, so a receipt would carry a meaningless balance; cancelled rows take no money.
    if (enrollment.status !== 'plan_agreed' && enrollment.status !== 'enrolled') {
      return createErrorResponse(
        'Tuition can only be recorded once the plan is agreed (the enrollment is ' + enrollment.status.replace(/_/g, ' ') + ')',
        400,
      )
    }

    const pricing = (enrollment.course.pricing ?? null) as Record<string, number> | null
    const before = computeTuitionBalance(enrollment, toLedgerCharges(enrollment.tuitionCharges), enrollment.tuitionPayments, pricing)

    // Ledger rows: amount must be whole naira, not above what is owed unless the admin confirmed (T8).
    // Legacy rows keep their old behaviour (any positive amount) but still must be whole naira (an Int column).
    const check = checkPaymentAmount(
      before.mode === 'ledger' ? before.outstanding : MAX_PAYMENT_NAIRA,
      amount,
      before.mode === 'ledger' ? allowOverpayment === true : true,
    )
    if (!check.ok) return createErrorResponse(check.error, 400)
    const paid = check.amount

    const receiptNumber = generateReceiptNumber('TUI')
    // Ledger: a recorded payment is `completed`; wording on the receipt follows the balance (T7).
    // Legacy: the admin's Full/Part marker.
    const status = before.mode === 'ledger' ? 'completed' : paymentType === 'partial' ? 'partial' : 'completed'

    // The payment and the plan_agreed -> enrolled move are ONE transaction (compare-and-set), so a
    // failed move cannot leave a recorded payment behind for an admin retry to duplicate.
    const { tuitionPayment, admitted } = await prisma.$transaction(async (tx) => {
      const tuitionPayment = await tx.tuitionPayment.create({
        data: {
          enrollmentId,
          amount: paid,
          paymentMethod,
          description,
          status,
          paidAt: new Date(),
          receiptNumber,
          recordedBy: admin.id,
          receiptGenerated: false,
          receiptSent: false,
        },
      })
      const admitted =
        enrollment.status === 'plan_agreed' &&
        (await transitionEnrollment(tx, enrollmentId, 'plan_agreed', 'enrolled'))
      return { tuitionPayment, admitted }
    })

    const after = computeTuitionBalance(
      enrollment,
      toLedgerCharges(enrollment.tuitionCharges),
      [...enrollment.tuitionPayments, { amount: paid, status }],
      pricing,
    )

    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.record',
      entityType: 'tuition_payment',
      entityId: tuitionPayment.id,
      metadata: {
        enrollmentId,
        amount: paid,
        paymentMethod,
        paymentType: status,
        mode: after.mode,
        totalPaid: after.paid,
        remainingBalance: after.outstanding,
        ...(after.mode === 'ledger' ? { classesCovered: after.classesCovered } : {}),
      },
    })
    if (after.mode === 'ledger' && after.credit > 0) {
      await logAdminAction({
        adminId: admin.id,
        action: 'tuition.overpayment',
        entityType: 'enrollment',
        entityId: enrollmentId,
        metadata: { tuitionPaymentId: tuitionPayment.id, credit: after.credit, charged: after.charged, paid: after.paid },
      })
    }
    if (admitted) {
      await logAdminAction({
        adminId: admin.id,
        action: 'enrollment.enrolled_by_tuition',
        entityType: 'enrollment',
        entityId: enrollmentId,
        metadata: { tuitionPaymentId: tuitionPayment.id, fromStatus: 'plan_agreed', toStatus: 'enrolled' },
      })
    }

    // Generate and send the receipt if requested (best-effort: the payment is already recorded).
    // TODO(S7): route this send through the communications outbox instead of calling lib/email.ts directly.
    if (sendReceipt) {
      try {
        const receiptData = await loadTuitionReceiptData(prisma, tuitionPayment.id)
        if (receiptData) {
          const pdfBuffer = generateTuitionReceiptPDF(receiptData)
          const emailSent = await sendTuitionReceipt(receiptData, pdfBuffer)
          await prisma.tuitionPayment.update({
            where: { id: tuitionPayment.id },
            data: { receiptGenerated: true, receiptSent: emailSent },
          })
        }
      } catch (receiptError) {
        console.error('Failed to generate/send receipt:', receiptError)
      }
    }

    const createdPayment = await prisma.tuitionPayment.findUnique({
      where: { id: tuitionPayment.id },
      include: {
        enrollment: {
          select: { student: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    })

    return createResponse({ payment: createdPayment, summary: after, message: 'Tuition payment recorded successfully' }, 201)
  } catch (error) {
    console.error('Record tuition payment error:', error)
    return createErrorResponse('Failed to record tuition payment', 500)
  }
})

// GET /api/admin/enrollments/[id]/tuition - the ledger screen: charges, payments (incl. pending links), summary.
export const GET = withAuth(async (_req: NextRequest, _admin, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id: enrollmentId } = await context.params

    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        id: true,
        status: true,
        applicationPaid: true,
        selectedMode: true,
        ratePerClass: true,
        plannedClasses: true,
        durationMins: true,
        course: { select: { pricing: true } },
        tuitionCharges: { orderBy: { createdAt: 'asc' } },
        tuitionPayments: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)

    const pricing = (enrollment.course.pricing ?? null) as Record<string, number> | null
    const charges = toLedgerCharges(enrollment.tuitionCharges)
    const summary = computeTuitionBalance(enrollment, charges, enrollment.tuitionPayments, pricing)

    const { course: _course, tuitionCharges, tuitionPayments, ...rest } = enrollment
    return createResponse({
      mode: summary.mode,
      enrollment: rest,
      charges: tuitionCharges,
      payments: tuitionPayments,
      summary,
    })
  } catch (error) {
    console.error('Get tuition error:', error)
    return createErrorResponse('Failed to fetch tuition payments', 500)
  }
})
