const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const LAGOS_OFFSET_MS = 60 * 60 * 1000 // Africa/Lagos is UTC+1 all year, no DST

/** Calendar month in Africa/Lagos. `key` (YYYY-MM) is the new-month idempotency scope. */
export function lagosMonthInfo(now: Date = new Date()): { year: number; month: number; monthName: string; key: string } {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', year: 'numeric', month: 'numeric' }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  return { year, month, monthName: MONTH_NAMES[month - 1], key: `${year}-${String(month).padStart(2, '0')}` }
}

/** Instant at which the next month begins in Lagos (00:00 on the 1st). */
export function nextMonthStart(now: Date = new Date()): Date {
  const { year, month } = lagosMonthInfo(now)
  // Date.UTC treats `month` (1-based here) as the NEXT month's 0-based index and rolls December over.
  return new Date(Date.UTC(year, month, 1) - LAGOS_OFFSET_MS)
}
