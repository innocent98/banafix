/**
 * Payment methods an admin can record by hand (T9). `paystack` is reserved for the online path
 * (payment link + webhook) and is never accepted from the manual route. Old rows may hold other
 * values (e.g. `installment`); they are displayed as stored.
 */
export const MANUAL_PAYMENT_METHODS = ['cash', 'bank-transfer', 'pos', 'card', 'cheque', 'mobile-money', 'other'] as const

export const ONLINE_PAYMENT_METHOD = 'paystack'

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  'bank-transfer': 'Bank transfer',
  pos: 'POS',
  card: 'Card',
  cheque: 'Cheque',
  'mobile-money': 'Mobile money',
  other: 'Other',
  paystack: 'Online (Paystack)',
}

export function isManualMethod(v: unknown): v is (typeof MANUAL_PAYMENT_METHODS)[number] {
  return typeof v === 'string' && (MANUAL_PAYMENT_METHODS as readonly string[]).includes(v)
}
