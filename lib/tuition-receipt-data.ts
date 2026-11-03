import type { PrismaClient } from '@prisma/client'
import type { TuitionReceiptData } from './receipt'
import { computeTuitionBalance } from './tuition-balance'
import {
  activeCharges,
  chargeTotal,
  chargesAsOf,
  COUNTED_STATUSES,
  type LedgerCharge,
} from './tuition-ledger'

/**
 * Build the receipt payload for one stored tuition payment. POINT-IN-TIME (T13): the numbers are
 * what stood when this payment was made (charges created and not yet voided by then; payments up
 * to and including it), so a re-sent receipt never changes because of a later top-up.
 * Returns null when the payment is not a counted (recorded/settled) one.
 */
export async function loadTuitionReceiptData(db: PrismaClient, paymentId: string): Promise<TuitionReceiptData | null> {
  const payment = await db.tuitionPayment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          course: { include: { instructor: { select: { name: true } } } },
          tuitionCharges: true,
          tuitionPayments: { where: { status: { in: [...COUNTED_STATUSES] } } },
        },
      },
    },
  })
  if (!payment || !COUNTED_STATUSES.includes(payment.status)) return null

  const { enrollment } = payment
  const stamp = (p: { paidAt: Date | null; createdAt: Date }) => (p.paidAt ?? p.createdAt).getTime()
  const ordered = [...enrollment.tuitionPayments].sort(
    (a, b) => stamp(a) - stamp(b) || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
  )
  const index = ordered.findIndex((p) => p.id === payment.id)
  if (index === -1) return null
  const upToHere = ordered.slice(0, index + 1)

  const paidAt = payment.paidAt ?? payment.createdAt
  const charges: LedgerCharge[] = chargesAsOf(
    enrollment.tuitionCharges.map((c) => ({ ...c, kind: c.kind as LedgerCharge['kind'] })),
    paidAt,
  )
  const pricing = (enrollment.course.pricing ?? null) as Record<string, number> | null
  const balance = computeTuitionBalance(enrollment, charges, upToHere, pricing)

  const base: TuitionReceiptData = {
    receiptNumber: payment.receiptNumber,
    enrollment: {
      id: enrollment.id,
      firstName: enrollment.student.firstName,
      lastName: enrollment.student.lastName,
      email: enrollment.student.email,
      phone: enrollment.student.phone || undefined,
    },
    course: {
      title: enrollment.course.title,
      instrument: enrollment.course.instrument,
      level: enrollment.course.level,
      instructor: enrollment.course.instructor?.name,
    },
    payment: {
      amount: payment.amount,
      paidAt: paidAt.toISOString(),
      description: payment.description || undefined,
      paymentMethod: payment.paymentMethod,
    },
    totalPaid: balance.paid,
    remainingBalance: balance.outstanding,
    paymentType: payment.status,
  }

  if (balance.mode === 'legacy') return base

  // Ledger mode: wording follows the balance (T7), not an admin marker.
  const lines = (charges.length
    ? activeCharges(charges)
    : [{ kind: 'CLASSES' as const, quantity: enrollment.plannedClasses ?? 0, unitPrice: enrollment.ratePerClass ?? 0, description: `${enrollment.plannedClasses ?? 0} classes` }]
  ).map((c) => ({
    kind: c.kind,
    description: c.description ?? (c.kind === 'MATERIAL' ? 'Materials' : 'Classes'),
    quantity: c.quantity,
    unitPrice: c.unitPrice,
    amount: chargeTotal(c),
  }))
  return {
    ...base,
    paymentType: balance.outstanding > 0 ? 'partial' : 'completed',
    ledger: {
      lines,
      materialsTotal: balance.materials,
      totalCharged: balance.charged,
      classesPurchased: balance.classesPurchased,
      classesCovered: balance.classesCovered,
      credit: balance.credit,
    },
  }
}
