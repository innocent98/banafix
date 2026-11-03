import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Filter, Eye, CreditCard, Mail, Pencil, BadgeCheck, ClipboardList } from "lucide-react"
import { computeTuitionBalance, type TuitionBalance } from "@/lib/tuition-balance"
import { COUNTED_STATUSES, toLedgerCharges } from "@/lib/tuition-ledger"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import {
  duplicatePayments,
  enrollmentLocationName,
  formatCurrency,
  formatDate,
  needsRefund,
  type ApplicationPayment,
  type Enrollment,
} from "./types"

interface Props {
  enrollments: Enrollment[]
  filtered: Enrollment[]
  onView: (e: Enrollment) => void
  onEditStudent: (studentId: string) => void
  onMarkPaid: (e: Enrollment) => void
  onAssessment: (e: Enrollment) => void
  onPayments: (e: Enrollment) => void
  onSendReceipt: (enrollmentId: string, type: "application" | "tuition") => void
  onRefund: (payment: ApplicationPayment) => void
}

const balanceOf = (e: Enrollment): TuitionBalance =>
  computeTuitionBalance(
    { ratePerClass: e.ratePerClass ?? null, plannedClasses: e.plannedClasses ?? null, selectedMode: e.selectedMode },
    toLedgerCharges(e.tuitionCharges ?? []),
    e.tuitionPayments,
    e.course.pricing ?? null,
  )

/** The "Tuition paid" stage label: ledger rows derive it from a zero balance; legacy rows keep the old rule. */
const isPaidInFull = (e: Enrollment, balance: TuitionBalance): boolean =>
  balance.mode === "ledger"
    ? balance.charged > 0 && balance.outstanding === 0
    : e.tuitionPayments.some((p) => p.status === "completed")

const canManagePayments = (e: Enrollment) =>
  e.applicationPaid && (e.status === "plan_agreed" || e.status === "enrolled")

const paymentsDisabledReason = (e: Enrollment) =>
  !e.applicationPaid
    ? "Manage payments (the assessment fee is not paid yet)"
    : "Manage payments (available once the plan is agreed)"

export function EnrollmentTable({
  enrollments,
  filtered,
  onView,
  onEditStudent,
  onMarkPaid,
  onAssessment,
  onPayments,
  onSendReceipt,
  onRefund,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Enrollments ({filtered.length})</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No enrollments found</h3>
            <p className="text-muted-foreground">
              {enrollments.length === 0 ? "No student enrollments yet" : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Assessment Fee</TableHead>
                  <TableHead>Tuition Paid</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((enrollment) => {
                  const locationName = enrollmentLocationName(enrollment)
                  const format = enrollment.offering?.deliveryMode.name || enrollment.selectedMode
                  const balance = balanceOf(enrollment)
                  const countedPayments = enrollment.tuitionPayments.filter((p) => COUNTED_STATUSES.includes(p.status)).length
                  const latest = enrollment.assessments?.[0]
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{enrollment.student.firstName} {enrollment.student.lastName}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.student.email}</p>
                          {enrollment.student.phone && (
                            <p className="text-xs text-muted-foreground">{enrollment.student.phone}</p>
                          )}
                          <p className="text-xs text-muted-foreground">Registered {formatDate(enrollment.createdAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{enrollment.course.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {enrollment.course.instrument} • {enrollment.course.level}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[locationName, format].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={enrollment.status}
                          paidInFull={isPaidInFull(enrollment, balance)}
                        />
                        {(needsRefund(enrollment) || enrollment.feeCoveredByPaymentId) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {needsRefund(enrollment) && (
                              <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                Refund needed
                              </Badge>
                            )}
                            {enrollment.feeCoveredByPaymentId && (
                              <Badge variant="outline" className="border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-300">
                                Fee covered
                              </Badge>
                            )}
                          </div>
                        )}
                        {latest?.status === "scheduled" && latest.scheduledAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(latest.scheduledAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        )}
                        {latest?.status === "completed" && latest.resultLevel && (
                          <p className="text-xs text-muted-foreground mt-1">Level: {latest.resultLevel}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const completed = enrollment.applicationPayments.find((p) => p.status === "completed")
                          const duplicates = duplicatePayments(enrollment)
                          const refunded = enrollment.applicationPayments.filter((p) => p.status === "refunded")
                          const superseded = enrollment.applicationPayments.filter((p) => p.status === "superseded")
                          return (
                            <div className="space-y-1">
                              {enrollment.applicationPaid ? (
                                completed ? (
                                  <div>
                                    <p className="text-sm font-medium text-green-600">
                                      ₦{completed.amount.toLocaleString()} Paid
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {completed.paidAt && formatDate(completed.paidAt)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm font-medium text-green-600">
                                    {enrollment.feeCoveredByPaymentId ? "Covered" : "Paid"}
                                  </p>
                                )
                              ) : (
                                <p className="text-sm text-orange-600">Pending</p>
                              )}
                              {duplicates.map((p) => (
                                <div key={p.id} className="rounded border border-red-200 bg-red-50 p-1.5 dark:border-red-900/40 dark:bg-red-900/10">
                                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                                    {formatCurrency(p.amount)} duplicate
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-1 !h-6 !px-2 text-xs"
                                    onClick={() => onRefund(p)}
                                  >
                                    Mark refunded
                                  </Button>
                                </div>
                              ))}
                              {refunded.map((p) => (
                                <p key={p.id} className="text-xs text-muted-foreground">
                                  {formatCurrency(p.amount)} refunded{p.refundedAt ? ` ${formatDate(p.refundedAt)}` : ""}
                                </p>
                              ))}
                              {superseded.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  {superseded.length} superseded attempt{superseded.length > 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(balance.paid)}</p>
                          <p className="text-xs text-muted-foreground">{countedPayments} payment(s)</p>
                          {balance.mode === "ledger" && balance.classesPurchased > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {balance.classesCovered} of {balance.classesPurchased} classes covered
                            </p>
                          )}
                          {balance.outstanding !== undefined && balance.outstanding > 0 && (
                            <p className="text-xs text-orange-600">{formatCurrency(balance.outstanding)} balance</p>
                          )}
                          {balance.mode === "ledger" && balance.credit > 0 && (
                            <p className="text-xs text-blue-600">{formatCurrency(balance.credit)} credit</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex w-[104px] flex-wrap gap-1">
                          <Button variant="ghost" size="sm" className="!h-8 !w-8 !p-0" onClick={() => onView(enrollment)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="!h-8 !w-8 !p-0" onClick={() => onEditStudent(enrollment.student.id)} title="Edit student">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!h-8 !w-8 !p-0"
                            onClick={() => onAssessment(enrollment)}
                            title="Assessment & plan"
                            aria-label="Assessment & plan"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                          {!enrollment.applicationPaid && enrollment.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                            className="!h-8 !w-8 !p-0 text-green-600 hover:text-green-700"
                              onClick={() => onMarkPaid(enrollment)}
                              title="Mark assessment fee paid (cash)"
                              aria-label="Mark fee paid"
                            >
                              <BadgeCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!h-8 !w-8 !p-0"
                            onClick={() => onPayments(enrollment)}
                            title={canManagePayments(enrollment) ? "Manage payments" : paymentsDisabledReason(enrollment)}
                            aria-label="Manage payments"
                            disabled={!canManagePayments(enrollment)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!h-8 !w-8 !p-0"
                            onClick={() => onSendReceipt(enrollment.id, "application")}
                            title="Send receipt"
                            disabled={!enrollment.applicationPaid}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
