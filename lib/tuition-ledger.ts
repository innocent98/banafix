/**
 * Pure tuition ledger maths (Stream 5, D12). Amounts are whole naira. Nothing here touches the
 * database, so S4's ClassSession.sequence can reuse `classesCovered` as is.
 *
 * Paid status is DERIVED: nothing is stored per class. A class is "covered" when the cumulative
 * counted payments, after materials, pay for it in order.
 */
export type ChargeKind = 'CLASSES' | 'MATERIAL'

export interface LedgerCharge {
  id?: string
  kind: ChargeKind
  quantity: number
  unitPrice: number
  description?: string
  createdAt?: Date | string
  voidedAt?: Date | string | null
}

export interface LedgerPayment {
  amount: number
  status: string
}

export interface LedgerSummary {
  charged: number
  paid: number
  /** What is still owed; never negative. */
  outstanding: number
  /** Paid beyond what is owed (overpayment, or a charge voided after paying); never negative. */
  credit: number
  materials: number
  classesPurchased: number
  classesCovered: number
}

/** Payment statuses that count toward what has been paid. `pending` links, `failed`, `cancelled` do not. */
export const COUNTED_STATUSES: readonly string[] = ['completed', 'partial']

/** Largest single payment we accept (whole naira); a typo guard, not a business limit. */
export const MAX_PAYMENT_NAIRA = 100_000_000

const time = (v: Date | string | null | undefined): number | null => {
  if (v == null) return null
  const t = v instanceof Date ? v.getTime() : new Date(v).getTime()
  return Number.isNaN(t) ? null : t
}

export const chargeTotal = (c: Pick<LedgerCharge, 'quantity' | 'unitPrice'>): number => c.quantity * c.unitPrice

export const activeCharges = <T extends LedgerCharge>(charges: T[]): T[] => charges.filter((c) => c.voidedAt == null)

export const totalCharged = (charges: LedgerCharge[]): number =>
  activeCharges(charges).reduce((sum, c) => sum + chargeTotal(c), 0)

export const materialsTotal = (charges: LedgerCharge[]): number =>
  activeCharges(charges)
    .filter((c) => c.kind === 'MATERIAL')
    .reduce((sum, c) => sum + chargeTotal(c), 0)

export const totalPaid = (payments: LedgerPayment[]): number =>
  payments.filter((p) => COUNTED_STATUSES.includes(p.status)).reduce((sum, p) => sum + p.amount, 0)

/**
 * How many classes the cumulative `paid` amount covers. Materials are settled first, then CLASSES
 * charges in creation order, each class at its own charge's rate. A part-paid class does not
 * count, and a later charge is never covered while an earlier one is incomplete. Free classes
 * (unitPrice 0) are always covered once reached.
 */
export function classesCovered(charges: LedgerCharge[], paid: number): number {
  let remaining = Math.max(0, paid - materialsTotal(charges))
  const ordered = activeCharges(charges)
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => c.kind === 'CLASSES')
    .sort((a, b) => (time(a.c.createdAt) ?? 0) - (time(b.c.createdAt) ?? 0) || a.index - b.index)
  let covered = 0
  for (const { c } of ordered) {
    const affordable = c.unitPrice === 0 ? c.quantity : Math.floor(remaining / c.unitPrice)
    const taken = Math.min(c.quantity, affordable)
    covered += taken
    remaining -= taken * c.unitPrice
    if (taken < c.quantity) break
  }
  return covered
}

export function summarizeLedger(charges: LedgerCharge[], payments: LedgerPayment[]): LedgerSummary {
  const charged = totalCharged(charges)
  const paid = totalPaid(payments)
  return {
    charged,
    paid,
    outstanding: Math.max(0, charged - paid),
    credit: Math.max(0, paid - charged),
    materials: materialsTotal(charges),
    classesPurchased: activeCharges(charges)
      .filter((c) => c.kind === 'CLASSES')
      .reduce((sum, c) => sum + c.quantity, 0),
    classesCovered: classesCovered(charges, paid),
  }
}

/** The charges that stood at time `t`: created by then and not yet voided. Used for point-in-time receipts. */
export function chargesAsOf<T extends LedgerCharge>(charges: T[], t: Date): T[] {
  const at = t.getTime()
  return charges.filter((c) => {
    const created = time(c.createdAt)
    const voided = time(c.voidedAt)
    return (created == null || created <= at) && (voided == null || voided > at)
  })
}

export type AmountCheck = { ok: true; amount: number } | { ok: false; error: string }

/** Validate a payment amount: positive whole naira, capped, and not above what is owed unless confirmed. */
export function checkPaymentAmount(outstanding: number, amount: unknown, allowOverpayment: boolean): AmountCheck {
  const n = typeof amount === 'string' && /^\d+$/.test(amount.trim()) ? Number(amount.trim()) : amount
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0) {
    return { ok: false, error: 'Amount must be a whole number of naira greater than 0' }
  }
  if (n > MAX_PAYMENT_NAIRA) {
    return { ok: false, error: `Amount cannot exceed ₦${MAX_PAYMENT_NAIRA.toLocaleString()}` }
  }
  if (n > outstanding && !allowOverpayment) {
    return {
      ok: false,
      error: `Amount exceeds the outstanding balance of ₦${outstanding.toLocaleString()}. Add a charge first, or confirm the overpayment.`,
    }
  }
  return { ok: true, amount: n }
}

/** Prisma rows store `kind` as a string; narrow it for the pure helpers. */
export function toLedgerCharges<T extends Omit<LedgerCharge, 'kind'> & { kind: string }>(rows: T[]): (T & { kind: ChargeKind })[] {
  return rows.map((r) => ({ ...r, kind: (r.kind === 'MATERIAL' ? 'MATERIAL' : 'CLASSES') as ChargeKind }))
}
