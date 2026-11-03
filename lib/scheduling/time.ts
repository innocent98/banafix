// Africa/Lagos is fixed UTC+1 with no DST, so local time is plain arithmetic on the UTC instant.
// Storage is always UTC timestamptz; these helpers are the only place local wall-clock is derived.

export const LAGOS_OFFSET_MIN = 60
const MS_MIN = 60_000
const MS_DAY = 86_400_000

/** 'YYYY-MM-DD' in Lagos local time. */
export type DateKey = string

export function isDateKey(s: unknown): s is DateKey {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [y, m, d] = s.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

function utcMidnight(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function lagosParts(d: Date): { dateKey: DateKey; isoWeekday: number; minuteOfDay: number } {
  const local = new Date(d.getTime() + LAGOS_OFFSET_MIN * MS_MIN)
  const dow = local.getUTCDay() // 0 = Sunday
  return {
    dateKey: local.toISOString().slice(0, 10),
    isoWeekday: dow === 0 ? 7 : dow,
    minuteOfDay: local.getUTCHours() * 60 + local.getUTCMinutes(),
  }
}

/** The instant for `minuteOfDay` minutes after local midnight on `dateKey`. */
export function fromLagos(dateKey: DateKey, minuteOfDay: number): Date {
  return new Date(utcMidnight(dateKey) + (minuteOfDay - LAGOS_OFFSET_MIN) * MS_MIN)
}

export function addDays(dateKey: DateKey, n: number): DateKey {
  return new Date(utcMidnight(dateKey) + n * MS_DAY).toISOString().slice(0, 10)
}

export function isoWeekdayOf(dateKey: DateKey): number {
  const dow = new Date(utcMidnight(dateKey)).getUTCDay()
  return dow === 0 ? 7 : dow
}
