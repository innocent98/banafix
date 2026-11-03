import { formatNaira } from "@/lib/site"
import type { TuitionBalance } from "@/lib/tuition-balance"
import { COUNTED_STATUSES } from "@/lib/tuition-ledger"

/** Shapes of GET /api/admin/enrollments/[id]/tuition (dates arrive as ISO strings). */
export interface TuitionChargeRow {
  id: string
  kind: string
  origin: string
  quantity: number
  unitPrice: number
  description: string
  materialId?: string | null
  createdAt: string
  voidedAt?: string | null
  voidReason?: string | null
}

export interface TuitionPaymentRow {
  id: string
  amount: number
  status: string
  paymentMethod?: string | null
  paystackReference?: string | null
  paymentUrl?: string | null
  receiptNumber: string
  paidAt?: string | null
  createdAt: string
  description?: string | null
}

export interface TuitionData {
  mode: "ledger" | "legacy"
  enrollment: { id: string; status: string; applicationPaid: boolean }
  charges: TuitionChargeRow[]
  payments: TuitionPaymentRow[]
  summary: TuitionBalance
}

export interface MaterialOption {
  id: string
  name: string
  price: number
  required: boolean
}

export const formatMoney = formatNaira

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })

/** Thin fetch wrapper: admin bearer token, JSON in/out, never throws on a non-2xx (the API sends `{ error }`). */
export async function tuitionApi<T = Record<string, unknown>>(
  method: "GET" | "POST",
  url: string,
  body?: unknown,
): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  return { ok: res.ok, data }
}

export const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-700 border-green-200",
  partial: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-muted text-muted-foreground",
}

/** Counted toward what has been paid. */
export const isCounted = (status: string) => COUNTED_STATUSES.includes(status)

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
