import { BANDS, isBand, parseHHMM, type Band } from './bands'

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export interface Prefs {
  preferredDays: WeekdayKey[]
  preferredTimeBands: Band[]
  preferredFromTime: string | null
  preferredToTime: string | null
  preferredClassesPerWeek: 1 | 2 | null
}

/** 'mon' | 'Monday' | 'MON' -> 1..7 (ISO). Legacy rows hold full day names; new ones the 3-letter key. */
export function normaliseDay(v: unknown): number | null {
  if (typeof v !== 'string') return null
  const s = v.trim().toLowerCase()
  const i = WEEKDAY_KEYS.findIndex((k) => s === k || s === FULL[k])
  return i === -1 ? null : i + 1
}
const FULL: Record<WeekdayKey, string> = { mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday' }

const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
const blank = (v: unknown) => v === undefined || v === null || v === ''

export function validatePreferences(input: unknown): { ok: true; value: Prefs } | { ok: false; error: string } {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>

  const days = new Set<number>()
  if (!blank(o.preferredDays)) {
    if (!Array.isArray(o.preferredDays)) return { ok: false, error: 'preferredDays must be a list' }
    for (const d of o.preferredDays) {
      const n = normaliseDay(d)
      if (n === null) return { ok: false, error: `Unknown day "${String(d)}"` }
      days.add(n)
    }
  }

  const bands = new Set<Band>()
  if (!blank(o.preferredTimeBands)) {
    if (!Array.isArray(o.preferredTimeBands)) return { ok: false, error: 'preferredTimeBands must be a list' }
    for (const b of o.preferredTimeBands) {
      if (!isBand(b)) return { ok: false, error: `Unknown time band "${String(b)}"` }
      bands.add(b)
    }
  }

  let from: number | null = null
  let to: number | null = null
  if (!blank(o.preferredFromTime)) {
    from = parseHHMM(o.preferredFromTime)
    if (from === null) return { ok: false, error: 'Earliest time must look like 09:00' }
  }
  if (!blank(o.preferredToTime)) {
    to = parseHHMM(o.preferredToTime)
    if (to === null) return { ok: false, error: 'Latest time must look like 17:00' }
  }
  if (from !== null && to !== null && from >= to) return { ok: false, error: 'The earliest time must be before the latest time' }

  let perWeek: 1 | 2 | null = null
  if (!blank(o.preferredClassesPerWeek)) {
    const n = Number(o.preferredClassesPerWeek)
    if (n !== 1 && n !== 2) return { ok: false, error: 'Classes per week must be 1 or 2' }
    perWeek = n
  }

  return {
    ok: true,
    value: {
      preferredDays: [...days].sort((a, b) => a - b).map((n) => WEEKDAY_KEYS[n - 1]),
      preferredTimeBands: BANDS.filter((b) => bands.has(b)),
      preferredFromTime: from === null ? null : hhmm(from),
      preferredToTime: to === null ? null : hhmm(to),
      preferredClassesPerWeek: perWeek,
    },
  }
}

const BAND_LABEL: Record<Band, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' }

/** One-line summary for admin screens. Reads structured fields first, the legacy `schedulePreference` as fallback. */
export function describePreferences(p: {
  preferredDays?: string[] | null
  preferredTimeBands?: string[] | null
  preferredFromTime?: string | null
  preferredToTime?: string | null
  preferredClassesPerWeek?: number | null
  schedulePreference?: string | null
}): string {
  const parts: string[] = []
  const days = [...new Set((p.preferredDays ?? []).map(normaliseDay).filter((n): n is number => n !== null))].sort((a, b) => a - b)
  if (days.length) parts.push(days.map((n) => WEEKDAY_LABELS[n - 1]).join(', '))
  const bands = (p.preferredTimeBands ?? []).filter(isBand).map((b) => BAND_LABEL[b])
  if (bands.length) parts.push(bands.join(', '))
  if (p.preferredFromTime || p.preferredToTime) parts.push(`${p.preferredFromTime ?? 'any'} to ${p.preferredToTime ?? 'any'}`)
  if (p.preferredClassesPerWeek) parts.push(`${p.preferredClassesPerWeek} ${p.preferredClassesPerWeek === 1 ? 'class' : 'classes'} a week`)
  if (p.schedulePreference) parts.push(p.schedulePreference)
  return parts.length ? parts.join(' · ') : 'No preference given'
}
