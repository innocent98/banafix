import { toCsv, type CsvCell } from "@/lib/tuition-csv"
import { PAYMENT_METHOD_LABELS } from "@/lib/tuition-methods"

/** Row shapes of GET /api/admin/payments (dates arrive as ISO strings). */
export interface PaymentRow {
  id: string
  enrollmentId: string
  amount: number
  status: string
  method: string | null
  channel: string | null
  reference: string | null
  receiptNumber: string
  description: string | null
  paidAt: string | null
  createdAt: string
  paymentUrl: string | null
  enrollmentStatus: string
  student: string
  email: string
  course: string
  location: string
}

export interface OutstandingRow {
  enrollmentId: string
  enrollmentStatus: string
  student: string
  email: string
  course: string
  location: string
  mode: "ledger" | "legacy"
  charged: number | null
  paid: number
  outstanding: number
  classesCovered: number | null
  classesPurchased: number | null
  lastPaymentAt: string | null
}

/** Credit on account: paid beyond what is owed, or tuition paid on a cancelled enrollment. Refund by hand or apply to a top-up. */
export interface CreditRow {
  enrollmentId: string
  enrollmentStatus: string
  student: string
  email: string
  course: string
  location: string
  reason: "overpaid" | "cancelled"
  charged: number | null
  paid: number
  credit: number
}

export interface PaymentsResponse {
  payments: PaymentRow[]
  outstanding: OutstandingRow[]
  credits: CreditRow[]
  totals: { collected: number; pendingOnline: number; outstanding: number; credit: number }
  /** One flag per list. `outstandingScan` = the enrollment scan itself was cut short, so totals are a lower bound. */
  truncated: { payments: boolean; outstanding: boolean; outstandingScan?: boolean; credits?: boolean } | boolean
}

export interface Filters {
  locationId: string
  method: string
  status: string
  q: string
  from: string
  to: string
}

export const ALL = "all"
export const EMPTY_FILTERS: Filters = { locationId: ALL, method: ALL, status: ALL, q: "", from: "", to: "" }

export const PAYMENT_STATUSES = ["completed", "partial", "pending", "failed", "cancelled"] as const

export const methodLabel = (m: string | null) => (m ? PAYMENT_METHOD_LABELS[m] ?? m : "Not recorded")

export function toQueryString(f: Filters): string {
  const sp = new URLSearchParams()
  if (f.locationId !== ALL) sp.set("locationId", f.locationId)
  if (f.method !== ALL) sp.set("method", f.method)
  if (f.status !== ALL) sp.set("status", f.status)
  if (f.q.trim()) sp.set("q", f.q.trim())
  if (f.from) sp.set("from", f.from)
  if (f.to) sp.set("to", f.to)
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

export const isTruncated = (t: PaymentsResponse["truncated"], list: "payments" | "outstanding" | "credits"): boolean =>
  typeof t === "boolean" ? t : Boolean(t?.[list])

const stamp = (iso: string | null): string => (iso ? iso.slice(0, 16).replace("T", " ") : "")

export function paymentsCsv(rows: PaymentRow[]): string {
  const header: CsvCell[] = [
    "Date", "Student", "Email", "Course", "Location", "Amount (NGN)", "Method", "Status", "Enrollment status", "Reference", "Receipt number", "Description",
  ]
  const body: CsvCell[][] = rows.map((p) => [
    stamp(p.paidAt ?? p.createdAt),
    p.student,
    p.email,
    p.course,
    p.location,
    p.amount,
    methodLabel(p.method),
    p.status,
    p.enrollmentStatus,
    p.reference,
    p.receiptNumber,
    p.description,
  ])
  return toCsv([header, ...body])
}

export function outstandingCsv(rows: OutstandingRow[]): string {
  const header: CsvCell[] = [
    "Student", "Email", "Course", "Location", "Enrollment status", "Charged (NGN)", "Paid (NGN)", "Outstanding (NGN)", "Classes covered", "Classes purchased", "Last payment",
  ]
  const body: CsvCell[][] = rows.map((r) => [
    r.student,
    r.email,
    r.course,
    r.location,
    r.enrollmentStatus,
    r.charged,
    r.paid,
    r.outstanding,
    r.classesCovered,
    r.classesPurchased,
    stamp(r.lastPaymentAt),
  ])
  return toCsv([header, ...body])
}

export function creditsCsv(rows: CreditRow[]): string {
  const header: CsvCell[] = ["Student", "Email", "Course", "Location", "Enrollment status", "Reason", "Charged (NGN)", "Paid (NGN)", "Credit (NGN)"]
  const body: CsvCell[][] = rows.map((r) => [
    r.student, r.email, r.course, r.location, r.enrollmentStatus,
    r.reason === "cancelled" ? "Paid on a cancelled enrollment" : "Paid more than owed",
    r.charged, r.paid, r.credit,
  ])
  return toCsv([header, ...body])
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel reads UTF-8 names correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
