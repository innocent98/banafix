import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { logAdminAction } from '@/lib/audit'
import { initializePayment, createTuitionPayment, generatePaymentReference } from '@/lib/paystack'
import { generateReceiptNumber } from '@/lib/receipt'
import { computeTuitionBalance } from '@/lib/tuition-balance'
import { checkPaymentAmount, openLinkHeadroom, toLedgerCharges, COUNTED_STATUSES } from '@/lib/tuition-ledger'
import { ONLINE_PAYMENT_METHOD } from '@/lib/tuition-methods'

const REUSE_WINDOW_MS = 10 * 60 * 1000
// A pending row still without a URL after this long never got one (init or the URL save failed).
const STALE_NO_URL_MS = 2 * 60 * 1000

// POST /api/admin/enrollments/[id]/tuition/payment-link  { amount? }  (admin only)
// There is no student login, so the admin generates a Paystack link for a chosen amount (default = the
// outstanding balance minus links already open, never more) and shares it by hand. The pending row is created BEFORE Paystack is
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
      },
    })
    if (!enrollment) return createErrorResponse('Enrollment not found', 404)
    if (!enrollment.applicationPaid) return createErrorResponse('Assessment fee must be paid before tuition', 400)
    if (enrollment.status !== 'plan_agreed' && enrollment.status !== 'enrolled') {
      return createErrorResponse('A payment link can only be created once the plan is agreed', 400)
    }

    // ONE transaction: lock the enrollment first, then (re)read the balance and the OPEN links under the
    // lock, so two clicks cannot both pass the cap. A new link may ask for at most the outstanding balance
    // MINUS links that are already open (pending): two open links must not add up to more than is owed.
    const reference = generatePaymentReference('tuition')
    const created = await prisma.$transaction(async (tx) => {
      const locked = await tx.enrollment.updateMany({
        where: { id, status: { in: ['plan_agreed', 'enrolled'] } },
        data: { updatedAt: new Date() },
      })
      if (locked.count === 0) return { kind: 'gone' as const }

      // A pending row that never got its URL (Paystack init or the URL save failed long ago) is dead:
      // mark it failed so it neither blocks nor counts. (A late payment on it would still be recorded.)
      await tx.tuitionPayment.updateMany({
        where: { enrollmentId: id, status: 'pending', paymentUrl: null, createdAt: { lt: new Date(Date.now() - STALE_NO_URL_MS) } },
        data: { status: 'failed' },
      })

      const current = await tx.enrollment.findUnique({
        where: { id },
        include: {
          tuitionCharges: true,
          tuitionPayments: { where: { status: { in: [...COUNTED_STATUSES] } } },
        },
      })
      if (!current) return { kind: 'gone' as const }
      const balance = computeTuitionBalance(
        current,
        toLedgerCharges(current.tuitionCharges),
        current.tuitionPayments,
        (enrollment.course.pricing ?? null) as Record<string, number> | null,
      )
      if (balance.mode !== 'ledger') return { kind: 'legacy' as const }
      if (balance.outstanding <= 0) return { kind: 'settled' as const }

      const open = await tx.tuitionPayment.findMany({
        where: { enrollmentId: id, status: 'pending', paystackReference: { not: null } },
        orderBy: { createdAt: 'desc' },
      })
      const headroom = openLinkHeadroom(balance.outstanding, open.map((p) => p.amount))

      const openTotal = open.reduce((sum, p) => sum + p.amount, 0)
      const covered = {
        kind: 'covered' as const,
        message:
          headroom === 0
            ? `Open payment links already cover the whole outstanding balance (${open.length} link${open.length === 1 ? '' : 's'}, ₦${openTotal.toLocaleString()}). Cancel one, or wait for it to be paid, before creating another.`
            : `Open payment links already cover ₦${openTotal.toLocaleString()} of the ₦${balance.outstanding.toLocaleString()} outstanding, so a new link can be for at most ₦${headroom.toLocaleString()}. Cancel an open link to free up more.`,
      }

      // Double click / retry: an identical link is already open (created within the reuse window): hand it
      // back. A request without an amount means "the whole outstanding balance" for this check, so a
      // double click on the default is idempotent too.
      const probe = body.amount == null ? balance.outstanding : Number(body.amount)
      const same = open.find((p) => p.amount === probe && p.createdAt.getTime() >= Date.now() - REUSE_WINDOW_MS)
      if (same) return { kind: 'existing' as const, existing: same }

      // The default amount is whatever the open links leave uncovered; with nothing left there is no default.
      if (body.amount == null && headroom === 0) return covered
      const check = checkPaymentAmount(balance.outstanding, body.amount ?? headroom, false)
      if (!check.ok) return { kind: 'invalid' as const, message: check.error }
      const amount = check.amount

      if (amount > headroom) return covered

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
      return { kind: 'created' as const, row, outstandingBefore: balance.outstanding, amount }
    })
    if (created.kind === 'gone') return createErrorResponse('The enrollment changed (cancelled?); refresh and try again', 409)
    if (created.kind === 'legacy') {
      return createErrorResponse('Online payment needs an agreed per-class plan; record this payment manually instead', 400)
    }
    if (created.kind === 'settled') return createErrorResponse('There is nothing outstanding to pay', 400)
    if (created.kind === 'invalid') return createErrorResponse(created.message, 400)
    if (created.kind === 'covered') return createErrorResponse(created.message, 409)
    if (created.kind === 'existing') {
      const existing = created.existing
      // Created a moment ago and Paystack has not answered yet: do not make a second link for the same amount.
      if (!existing.paymentUrl) return createErrorResponse('A payment link for this amount is being created; try again in a moment', 409)
      return createResponse(
        { payment: { id: existing.id, amount: existing.amount, paymentUrl: existing.paymentUrl, reference: existing.paystackReference }, reused: true },
        200,
      )
    }
    const { row, amount, outstandingBefore } = created

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

    // Save the URL (retry once). The Paystack link IS valid and payable by its reference, so if the save
    // keeps failing the admin still gets the URL now (flagged), and the stale-row sweep above cleans the row up.
    let urlSaved = true
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await prisma.tuitionPayment.update({ where: { id: row.id }, data: { paymentUrl } })
        urlSaved = true
        break
      } catch (error) {
        urlSaved = false
        console.error('Failed to store the tuition payment URL:', row.id, error)
      }
    }
    await logAdminAction({
      adminId: admin.id,
      action: 'tuition.link_create',
      entityType: 'tuition_payment',
      entityId: row.id,
      metadata: { enrollmentId: id, amount, reference, outstandingBefore, ...(urlSaved ? {} : { urlNotSaved: true }) },
    })

    return createResponse(
      { payment: { id: row.id, amount, paymentUrl, reference }, reused: false, ...(urlSaved ? {} : { urlNotSaved: true }) },
      201,
    )
  } catch (error) {
    console.error('Create tuition payment link error:', error)
    return createErrorResponse('Failed to create payment link', 500)
  }
})
