import { NextRequest } from 'next/server'
import { withAuth, createResponse, createErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { computeTuitionBalance } from '@/lib/tuition-balance'
import { COUNTED_STATUSES, toLedgerCharges } from '@/lib/tuition-ledger'

const CAP = 500

// GET /api/admin/payments?locationId=&method=&status=&q=&from=&to=
// The payments dashboard: tuition payments (filterable) and the outstanding view (enrollments that still
// owe tuition, ledger or legacy). Totals are over the returned rows; `truncated` says a list hit the cap.
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const sp = new URL(req.url).searchParams
    const locationId = sp.get('locationId') || undefined
    const method = sp.get('method') || undefined
    const status = sp.get('status') || undefined
    const q = (sp.get('q') || '').trim()
    const from = sp.get('from') ? new Date(sp.get('from') as string) : null
    const to = sp.get('to') ? new Date(`${sp.get('to')}T23:59:59.999Z`) : null
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      return createErrorResponse('Invalid date filter', 400)
    }

    const studentFilter = q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { email: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined

    const dateFilter =
      from || to
        ? {
            OR: [
              { paidAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
              { paidAt: null, createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } },
            ],
          }
        : {}

    const paymentRows = await prisma.tuitionPayment.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(method ? { paymentMethod: method } : {}),
        ...dateFilter,
        enrollment: {
          ...(locationId ? { locationId } : {}),
          ...(studentFilter ? { student: studentFilter } : {}),
        },
      },
      include: {
        enrollment: {
          select: {
            id: true,
            status: true,
            location: { select: { id: true, name: true } },
            course: { select: { title: true, location: true } },
            student: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: CAP + 1,
    })

    const payments = paymentRows.slice(0, CAP).map((p) => ({
      id: p.id,
      enrollmentId: p.enrollmentId,
      amount: p.amount,
      status: p.status,
      method: p.paymentMethod,
      channel: p.paystackChannel,
      reference: p.paystackReference,
      receiptNumber: p.receiptNumber,
      description: p.description,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
      paymentUrl: p.status === 'pending' ? p.paymentUrl : null,
      enrollmentStatus: p.enrollment.status,
      student: `${p.enrollment.student.firstName} ${p.enrollment.student.lastName}`,
      email: p.enrollment.student.email,
      course: p.enrollment.course.title,
      location: p.enrollment.location?.name ?? p.enrollment.course.location ?? '',
    }))

    // Outstanding: enrollments past the plan stage whose balance is above zero. Method/status/date filters
    // are about payments and do not apply here; location and search do.
    const candidates = await prisma.enrollment.findMany({
      where: {
        status: { in: ['plan_agreed', 'enrolled'] },
        applicationPaid: true,
        ...(locationId ? { locationId } : {}),
        ...(studentFilter ? { student: studentFilter } : {}),
      },
      select: {
        id: true,
        status: true,
        selectedMode: true,
        ratePerClass: true,
        plannedClasses: true,
        location: { select: { name: true } },
        course: { select: { title: true, location: true, pricing: true } },
        student: { select: { firstName: true, lastName: true, email: true } },
        tuitionCharges: true,
        tuitionPayments: { where: { status: { in: [...COUNTED_STATUSES] } }, select: { amount: true, status: true, paidAt: true, createdAt: true } },
      },
      take: 2000,
    })

    const owing = candidates
      .map((e) => {
        const balance = computeTuitionBalance(
          e,
          toLedgerCharges(e.tuitionCharges),
          e.tuitionPayments,
          (e.course.pricing ?? null) as Record<string, number> | null,
        )
        const last = e.tuitionPayments.map((p) => (p.paidAt ?? p.createdAt).getTime()).sort((a, b) => b - a)[0]
        return {
          enrollmentId: e.id,
          enrollmentStatus: e.status,
          student: `${e.student.firstName} ${e.student.lastName}`,
          email: e.student.email,
          course: e.course.title,
          location: e.location?.name ?? e.course.location ?? '',
          mode: balance.mode,
          charged: balance.mode === 'ledger' ? balance.charged : balance.expectedTotal ?? null,
          paid: balance.paid,
          outstanding: balance.outstanding ?? 0,
          classesCovered: balance.mode === 'ledger' ? balance.classesCovered : null,
          classesPurchased: balance.mode === 'ledger' ? balance.classesPurchased : null,
          lastPaymentAt: last ? new Date(last) : null,
        }
      })
      .filter((r) => r.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)

    const counted = payments.filter((p) => COUNTED_STATUSES.includes(p.status))
    return createResponse({
      payments,
      outstanding: owing.slice(0, CAP),
      totals: {
        collected: counted.reduce((s, p) => s + p.amount, 0),
        pendingOnline: payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
        outstanding: owing.reduce((s, r) => s + r.outstanding, 0),
      },
      truncated: { payments: paymentRows.length > CAP, outstanding: owing.length > CAP },
    })
  } catch (error) {
    console.error('Get payments dashboard error:', error)
    return createErrorResponse('Failed to fetch payments', 500)
  }
})
