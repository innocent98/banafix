import {
  summarizeLedger,
  totalPaid,
  type LedgerCharge,
  type LedgerPayment,
  type LedgerSummary,
} from './tuition-ledger'

/**
 * Which balance applies to an enrollment (Stream 5, T1).
 *
 *  - LEDGER: the enrollment has charge rows, or an agreed plan (ratePerClass + plannedClasses).
 *  - LEGACY: neither. The old Course.pricing[selectedMode] calculation, untouched, deprecated.
 *
 * `legacyBalance` below is the ONLY code that reads Course.pricing.
 */
export interface BalanceEnrollment {
  ratePerClass: number | null
  plannedClasses: number | null
  selectedMode: string | null
}

export type TuitionBalance =
  | ({ mode: 'ledger' } & LedgerSummary)
  | { mode: 'legacy'; expectedTotal: number | undefined; paid: number; outstanding: number | undefined }

export function isLedgerEnrollment(
  e: Pick<BalanceEnrollment, 'ratePerClass' | 'plannedClasses'>,
  chargeCount: number,
): boolean {
  return chargeCount > 0 || (e.ratePerClass != null && e.plannedClasses != null)
}

/** Legacy (pre-Stream-5) balance: the course's per-MODE price minus counted payments. */
function legacyBalance(
  e: BalanceEnrollment,
  payments: LedgerPayment[],
  legacyPricing: Record<string, number> | null,
): TuitionBalance {
  const paid = totalPaid(payments)
  const price = legacyPricing && e.selectedMode ? legacyPricing[e.selectedMode] : undefined
  const expectedTotal = typeof price === 'number' ? price : undefined
  return {
    mode: 'legacy',
    expectedTotal,
    paid,
    outstanding: expectedTotal === undefined ? undefined : Math.max(0, expectedTotal - paid),
  }
}

export function computeTuitionBalance(
  e: BalanceEnrollment,
  charges: LedgerCharge[],
  payments: LedgerPayment[],
  legacyPricing: Record<string, number> | null,
): TuitionBalance {
  if (!isLedgerEnrollment(e, charges.length)) return legacyBalance(e, payments, legacyPricing)
  // Plan fields but no rows yet (the window between deploying the code and the backfill/plan edit):
  // a synthetic, never-persisted CLASSES charge gives the same total the plan promised.
  const effective: LedgerCharge[] =
    charges.length > 0
      ? charges
      : [{ kind: 'CLASSES', quantity: e.plannedClasses as number, unitPrice: e.ratePerClass as number }]
  return { mode: 'ledger', ...summarizeLedger(effective, payments) }
}
