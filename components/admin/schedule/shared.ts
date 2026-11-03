// Shared types and Lagos-time helpers for the admin scheduling screens.
// Every wall-clock value shown here is Africa/Lagos, derived with lib/scheduling/time (never the browser's zone).

import { addDays, fromLagos, isoWeekdayOf, lagosParts, type DateKey } from "@/lib/scheduling/time"
import type { SessionMode } from "@/lib/scheduling/mode"
import type { SessionStatus } from "@/lib/scheduling/session-status"

/* ------------------------------------------------------------------ API shapes (JSON, so dates are ISO strings) */

export interface LocationLite {
  id: string
  name: string
  kind: "PHYSICAL" | "ONLINE"
  isActive: boolean
}

export interface InstructorLite {
  id: string
  name: string
  courses: { id: string; title: string }[]
}

export interface AvailabilityRow {
  id: string
  weekday: number
  startMinute: number
  endMinute: number
  locationId: string
  mode: SessionMode
  location: { name: string; kind: "PHYSICAL" | "ONLINE" }
}

export interface TimetableSession {
  id: string
  enrollmentId: string
  sequence: number
  startsAt: string
  endsAt: string
  durationMins: number
  status: SessionStatus
  mode: SessionMode
  notes: string | null
  instructorId: string
  locationId: string | null
  rescheduledFromId: string | null
  instructor: { name: string }
  location: { name: string } | null
  enrollment: {
    student: { id: string; firstName: string; lastName: string }
    course: { id: string; title: string }
  }
}

export interface PreferenceFields {
  preferredDays: string[]
  preferredTimeBands: string[]
  preferredFromTime: string | null
  preferredToTime: string | null
  preferredClassesPerWeek: number | null
  schedulePreference: string | null
}

export interface NeedsSchedulingItem extends PreferenceFields {
  id: string
  plannedClasses: number | null
  durationMins: number | null
  classesPerWeek: number | null
  student: { firstName: string; lastName: string }
  course: { id: string; title: string }
  location: { name: string } | null
  scheduled: number
}

export interface TimetableResponse {
  sessions: TimetableSession[]
  availability: AvailabilityRow[]
  needsScheduling: NeedsSchedulingItem[]
}

export interface PlanSlot {
  sequence: number
  startsAt: string
  endsAt: string
}

export interface SchedulePlanResponse {
  enrollmentId: string
  instructor: { id: string; name: string }
  student: { id: string; name: string }
  mode: SessionMode
  durationMins: number
  classesPerWeek: number
  plannedClasses: number
  alreadyScheduled: number
  placed: PlanSlot[]
  unplaced: { sequence: number; reason: string }[]
  outsideAvailability: PlanSlot[]
  overrideAvailability: boolean
}

/* ------------------------------------------------------------------ fetch */

export type ApiBody<T> = T & { error?: string; code?: string; details?: unknown }
export interface ApiResult<T> {
  ok: boolean
  status: number
  data: ApiBody<T>
}

/** Authenticated admin fetch. Missing token or 401 sends the admin to the login page (same as the other admin pages). */
export async function adminFetch<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  if (!token) {
    if (typeof window !== "undefined") window.location.assign("/admin/login")
    return { ok: false, status: 401, data: { error: "Please sign in again" } as ApiBody<T> }
  }
  try {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
    if (res.status === 401 && typeof window !== "undefined") window.location.assign("/admin/login")
    const data = (await res.json().catch(() => ({}))) as ApiBody<T>
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: "Network error. Please try again." } as ApiBody<T> }
  }
}

/* ------------------------------------------------------------------ Lagos time formatting */

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export const pad2 = (n: number) => String(n).padStart(2, "0")

/** Minutes after midnight to 'HH:MM' (1440 shows as 24:00). */
export const fmtMinute = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`

export const todayKey = (): DateKey => lagosParts(new Date()).dateKey

/** 'Mon 9 Nov' */
export function fmtDay(key: DateKey): string {
  const [, m, d] = key.split("-").map(Number)
  return `${DAY_SHORT[isoWeekdayOf(key) - 1]} ${d} ${MONTH_SHORT[m - 1]}`
}

/** Lagos 'HH:MM' of an instant. */
export const fmtInstantTime = (iso: string): string => fmtMinute(lagosParts(new Date(iso)).minuteOfDay)

/** 'Mon 9 Nov · 16:00–17:00' (Lagos). */
export function fmtSlot(startIso: string, endIso: string): string {
  return `${fmtDay(lagosParts(new Date(startIso)).dateKey)} · ${fmtInstantTime(startIso)}–${fmtInstantTime(endIso)}`
}

export const mondayOf = (key: DateKey): DateKey => addDays(key, 1 - isoWeekdayOf(key))

/** Monday strictly after `key`. */
export const nextMondayAfter = (key: DateKey): DateKey => addDays(key, 8 - isoWeekdayOf(key))

/** 'Mon 9 Nov – Sun 15 Nov' */
export const weekLabel = (monday: DateKey): string => `${fmtDay(monday)} – ${fmtDay(addDays(monday, 6))}`

export const studentName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`.trim()

/** The instant for a `datetime-local` value ('YYYY-MM-DDTHH:MM') read as Lagos time. Null when blank/invalid. */
export function lagosLocalToIso(value: string): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return null
  const d = fromLagos(m[1], Number(m[2]) * 60 + Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** The `datetime-local` value ('YYYY-MM-DDTHH:MM') for an instant, in Lagos time. */
export function isoToLagosLocal(iso: string): string {
  const p = lagosParts(new Date(iso))
  return `${p.dateKey}T${fmtMinute(p.minuteOfDay)}`
}

/* ------------------------------------------------------------------ status look */

export const STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  held: "Held",
  missed: "Missed",
  rescheduled: "Rescheduled",
  cancelled: "Cancelled",
}

export const STATUS_BLOCK: Record<SessionStatus, string> = {
  scheduled: "border-blue-400 bg-blue-100 text-blue-950 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100",
  held: "border-green-500 bg-green-100 text-green-950 dark:border-green-500 dark:bg-green-950 dark:text-green-100",
  missed: "border-amber-500 bg-amber-100 text-amber-950 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-100",
  rescheduled: "border-gray-300 bg-gray-100 text-gray-500 line-through dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400",
  cancelled: "border-gray-300 bg-gray-100 text-gray-500 line-through dark:border-gray-600 dark:bg-gray-900 dark:text-gray-400",
}

export const STATUS_BADGE: Record<SessionStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  held: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  missed: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  rescheduled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  cancelled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
}
