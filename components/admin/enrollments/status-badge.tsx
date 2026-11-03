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

/** Renders every known stage; an unknown legacy string is shown as-is (never throws). */
export function StatusBadge({ status, tuitionPaid }: { status: string; tuitionPaid?: boolean }) {
  if (!isEnrollmentStatus(status)) {
    return <Badge variant="outline">{status || "Unknown"}</Badge>
  }
  const label = status === "enrolled" && tuitionPaid ? "Tuition paid" : STATUS_LABELS[status]
  return (
    <Badge variant="outline" className={STYLES[status]}>
      {label}
    </Badge>
  )
}
