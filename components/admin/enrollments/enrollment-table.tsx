import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Filter, Eye, CreditCard, Mail, Pencil, BadgeCheck, ClipboardList, CalendarPlus } from "lucide-react"
import { planTotal } from "@/lib/offering-rates"
import { StatusBadge } from "./status-badge"
import { enrollmentLocationName, formatCurrency, formatDate, type Enrollment } from "./types"

interface Props {
  enrollments: Enrollment[]
  filtered: Enrollment[]
  onView: (e: Enrollment) => void
  onEditStudent: (studentId: string) => void
  onMarkPaid: (e: Enrollment) => void
  onAssessment: (e: Enrollment) => void
  onPayments: (e: Enrollment) => void
  onSendReceipt: (enrollmentId: string, type: "application" | "tuition") => void
}

const totalTuitionPaid = (e: Enrollment) =>
  e.tuitionPayments
    .filter((p) => p.status === "completed" || p.status === "partial")
    .reduce((sum, p) => sum + p.amount, 0)

// Remaining balance: the agreed plan total when there is one (snapshot rate), else the legacy
// course price for the selected mode; undefined when neither exists (not tracked).
const tuitionBalance = (e: Enrollment): number | undefined => {
  const expected =
    e.ratePerClass != null && e.plannedClasses != null
      ? planTotal(e.ratePerClass, e.plannedClasses)
      : e.course.pricing?.[e.selectedMode]
  if (typeof expected !== "number") return undefined
  return Math.max(0, expected - totalTuitionPaid(e))
}

export function EnrollmentTable({
  enrollments,
  filtered,
  onView,
  onEditStudent,
  onMarkPaid,
  onAssessment,
  onPayments,
  onSendReceipt,
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
                  const balance = tuitionBalance(enrollment)
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
                          tuitionPaid={enrollment.tuitionPayments?.some((p) => p.status === "completed")}
                        />
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
                        {enrollment.applicationPaid ? (
                          <div>
                            <p className="text-sm font-medium text-green-600">
                              ₦{(enrollment.applicationPayments[0]?.amount || 0).toLocaleString()} Paid
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.applicationPayments[0]?.paidAt && formatDate(enrollment.applicationPayments[0].paidAt)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-orange-600">Pending</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{formatCurrency(totalTuitionPaid(enrollment))}</p>
                          <p className="text-xs text-muted-foreground">{enrollment.tuitionPayments.length} payment(s)</p>
                          {balance !== undefined && balance > 0 && (
                            <p className="text-xs text-orange-600">{formatCurrency(balance)} balance</p>
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
                          {(enrollment.status === "plan_agreed" || enrollment.status === "enrolled") && (
                            <Link
                              href={`/admin/schedule?enrollmentId=${enrollment.id}`}
                              title="Schedule classes"
                              aria-label="Schedule classes"
                              className={`${buttonVariants({ variant: "ghost", size: "sm" })} !h-8 !w-8 !p-0`}
                            >
                              <CalendarPlus className="h-4 w-4" />
                            </Link>
                          )}
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
                            title="Manage payments"
                            disabled={!enrollment.applicationPaid}
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
