import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, isEnrollmentStatus, type EnrollmentStatus } from "@/lib/enrollment-status"

const STYLES: Record<EnrollmentStatus, string> = {
  pending: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40",
  assessment_paid: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40",
  assessment_scheduled: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40",
  assessed: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-900/40",
  plan_agreed: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-900/40",
  enrolled: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40",
  cancelled: "bg-muted text-muted-foreground",
}

/**
 * Renders every known stage; an unknown legacy string is shown as-is (never throws).
 * `paidInFull`: the caller derives it (ledger rows: balance is 0; legacy rows: a completed tuition payment).
 */
export function StatusBadge({ status, paidInFull }: { status: string; paidInFull?: boolean }) {
  if (!isEnrollmentStatus(status)) {
    return <Badge variant="outline">{status || "Unknown"}</Badge>
  }
  const label = status === "enrolled" && paidInFull ? "Tuition paid" : STATUS_LABELS[status]
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {label}
    </Badge>
  )
}

const PAYMENT_STYLES: Record<string, { label: string; className: string }> = {
  completed: { label: "Paid", className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/40" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40" },
  superseded: { label: "Superseded", className: "bg-muted text-muted-foreground" },
  duplicate: { label: "Duplicate - refund needed", className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40" },
  refunded: { label: "Refunded", className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700" },
}

/** Assessment-fee payment status; unknown values are shown as-is. */
export function PaymentStatusBadge({ status }: { status: string }) {
  const style = PAYMENT_STYLES[status]
  return (
    <Badge variant="outline" className={style?.className}>
      {style?.label ?? status}
    </Badge>
  )
}
