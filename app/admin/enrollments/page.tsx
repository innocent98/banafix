"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DollarSign,
  TrendingUp,
  CalendarClock,
  ClipboardCheck,
  FileCheck,
  BadgeCheck,
  Download,
  UserPlus,
  AlertTriangle,
} from "lucide-react"
import { TuitionPaymentModal } from "@/components/admin/tuition-payment-modal"
import { StudentEditModal } from "@/components/admin/student-edit-modal"
import { StudentRegistrationModal } from "@/components/admin/student-registration-modal"
import { EnrollmentFilters } from "@/components/admin/enrollments/enrollment-filters"
import { EnrollmentTable } from "@/components/admin/enrollments/enrollment-table"
import { AssessmentPlanPanel } from "@/components/admin/enrollments/assessment-plan-panel"
import { StatusBadge, PaymentStatusBadge } from "@/components/admin/enrollments/status-badge"
import { RefundDialog } from "@/components/admin/enrollments/refund-dialog"
import {
  enrollmentLocationName,
  formatCurrency,
  needsRefund,
  type ApplicationPayment,
  type Enrollment,
} from "@/components/admin/enrollments/types"

interface EnrollmentStats {
  awaitingAssessment: number // assessment_paid + assessment_scheduled
  awaitingPlan: number // assessed
  planAgreed: number
  enrolled: number
  totalApplicationFees: number
  totalTuitionPaid: number
}

const EMPTY_STATS: EnrollmentStats = {
  awaitingAssessment: 0,
  awaitingPlan: 0,
  planAgreed: 0,
  enrolled: 0,
  totalApplicationFees: 0,
  totalTuitionPaid: 0,
}

function StatCard({ label, value, sub, icon, tone }: { label: string; value: string | number; sub: string; icon: React.ReactNode; tone: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tone}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function EnrollmentsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editStudentId, setEditStudentId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [panelEnrollmentId, setPanelEnrollmentId] = useState<string | null>(null)
  const [stats, setStats] = useState<EnrollmentStats>(EMPTY_STATS)
  const [refundPayment, setRefundPayment] = useState<ApplicationPayment | null>(null)

  useEffect(() => {
    loadEnrollments()
  }, [])

  const loadEnrollments = async () => {
    try {
      const token = localStorage.getItem("admin_token")
      if (!token) {
        router.push("/admin/login")
        return
      }

      const response = await fetch("/api/enrollments?limit=100", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setEnrollments(data.enrollments)
        calculateStats(data.enrollments)
      } else {
        console.error("Failed to load enrollments")
      }
    } catch (error) {
      console.error("Failed to load enrollments:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (rows: Enrollment[]) => {
    const count = (...statuses: string[]) => rows.filter((e) => statuses.includes(e.status)).length
    const totalAppFees = rows.reduce((sum, e) =>
      sum + e.applicationPayments.filter(p => p.status === 'completed').reduce((pSum, p) => pSum + p.amount, 0), 0
    )
    const totalTuition = rows.reduce((sum, e) =>
      sum + e.tuitionPayments.filter(p => p.status === 'completed' || p.status === 'partial').reduce((pSum, p) => pSum + p.amount, 0), 0
    )
    setStats({
      awaitingAssessment: count('assessment_paid', 'assessment_scheduled'),
      awaitingPlan: count('assessed'),
      planAgreed: count('plan_agreed'),
      enrolled: count('enrolled'),
      totalApplicationFees: totalAppFees,
      totalTuitionPaid: totalTuition,
    })
  }

  const locationOptions = useMemo(
    () => Array.from(new Set(enrollments.map(enrollmentLocationName).filter(Boolean))).sort(),
    [enrollments],
  )

  const refundCount = useMemo(() => enrollments.filter(needsRefund).length, [enrollments])

  const filteredEnrollments = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return enrollments.filter((enrollment) => {
      if (
        term &&
        !(
          enrollment.student.firstName.toLowerCase().includes(term) ||
          enrollment.student.lastName.toLowerCase().includes(term) ||
          enrollment.student.email.toLowerCase().includes(term) ||
          enrollment.course.title.toLowerCase().includes(term)
        )
      ) return false

      if (statusFilter !== "all" && enrollment.status !== statusFilter) return false

      // Location: the enrollment's own location, falling back to the course's legacy text.
      if (locationFilter !== "all" && enrollmentLocationName(enrollment) !== locationFilter) return false

      switch (paymentFilter) {
        case "application_paid":
          return enrollment.applicationPaid
        case "application_pending":
          return !enrollment.applicationPaid
        case "tuition_paid":
          return enrollment.tuitionPayments.some(p => p.status === 'completed')
        case "tuition_pending":
          return enrollment.applicationPaid && !enrollment.tuitionPayments.some(p => p.status === 'completed')
        case "refund_needed":
          return needsRefund(enrollment)
        default:
          return true
      }
    })
  }, [enrollments, searchTerm, statusFilter, paymentFilter, locationFilter])

  const handleAddPayment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setShowPaymentModal(true)
  }

  const handleMarkPaid = async (enrollment: Enrollment) => {
    const covered = Boolean(enrollment.feeCoveredByPaymentId)
    const who = `${enrollment.student.firstName} ${enrollment.student.lastName}`
    if (!confirm(covered
      ? `${who} has already paid the assessment fee. Confirm this application? No second fee is recorded and the student moves to "Assessment paid". Only confirm if you recognise this application.`
      : `Mark the assessment fee as paid (cash) for ${who}? This moves the student to "Assessment paid".`)) return
    try {
      const token = localStorage.getItem("admin_token")
      const res = await fetch(`/api/admin/enrollments/${enrollment.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: "cash" }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        // A student who had already paid is covered, never charged twice: say so plainly.
        if (d.feeCovered) alert(d.message)
        loadEnrollments()
      } else {
        alert(d.error || d.message || "Failed to mark fee paid")
      }
    } catch {
      alert("Failed to mark fee paid")
    }
  }

  const sendReceipt = async (enrollmentId: string, type: 'application' | 'tuition') => {
    try {
      const token = localStorage.getItem("admin_token")
      const endpoint = type === 'application'
        ? `/api/receipts/application-fee/${enrollmentId}?send=true`
        : `/api/receipts/tuition/${enrollmentId}?send=true`

      const response = await fetch(endpoint, {
        method: type === 'application' ? 'GET' : 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert(`${type === 'application' ? 'Assessment fee' : 'Tuition'} receipt sent successfully!`)
      } else {
        alert('Failed to send receipt')
      }
    } catch (error) {
      console.error('Error sending receipt:', error)
      alert('Error sending receipt')
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* inline-size containment: the wide table scrolls inside its card instead of stretching the layout */}
      <div className="space-y-6 [contain:inline-size]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Enrollment Management</h1>
            <p className="text-muted-foreground mt-1">
              Move students from assessment to enrolment, track payments, and send receipts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowRegisterModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register Student
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label="Awaiting assessment"
            value={stats.awaitingAssessment}
            sub="Fee paid; to schedule or scheduled"
            icon={<CalendarClock className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
            tone="bg-amber-100 dark:bg-amber-900/20"
          />
          <StatCard
            label="Assessed"
            value={stats.awaitingPlan}
            sub="Result recorded; plan to agree"
            icon={<ClipboardCheck className="h-6 w-6 text-violet-600 dark:text-violet-400" />}
            tone="bg-violet-100 dark:bg-violet-900/20"
          />
          <StatCard
            label="Plan agreed"
            value={stats.planAgreed}
            sub="Awaiting enrolment"
            icon={<FileCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />}
            tone="bg-teal-100 dark:bg-teal-900/20"
          />
          <StatCard
            label="Enrolled"
            value={stats.enrolled}
            sub="Plan confirmed or legacy enrolment"
            icon={<BadgeCheck className="h-6 w-6 text-green-600 dark:text-green-400" />}
            tone="bg-green-100 dark:bg-green-900/20"
          />
          <StatCard
            label="Assessment fees"
            value={`₦${(stats.totalApplicationFees / 1000).toFixed(0)}K`}
            sub="Non-refundable fees"
            icon={<DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />}
            tone="bg-emerald-100 dark:bg-emerald-900/20"
          />
          <StatCard
            label="Tuition collected"
            value={`₦${(stats.totalTuitionPaid / 1000000).toFixed(1)}M`}
            sub="From enrolled students"
            icon={<TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
            tone="bg-purple-100 dark:bg-purple-900/20"
          />
        </div>

        {refundCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
            <p className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {refundCount} {refundCount === 1 ? "application has" : "applications have"} a duplicate assessment-fee payment awaiting a refund.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentFilter(paymentFilter === "refund_needed" ? "all" : "refund_needed")}
            >
              {paymentFilter === "refund_needed" ? "Show all" : "Show refund needed"}
            </Button>
          </div>
        )}

        <EnrollmentFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          paymentFilter={paymentFilter}
          locationFilter={locationFilter}
          locations={locationOptions}
          refundCount={refundCount}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onPaymentChange={setPaymentFilter}
          onLocationChange={setLocationFilter}
        />

        <EnrollmentTable
          enrollments={enrollments}
          filtered={filteredEnrollments}
          onView={setSelectedEnrollment}
          onEditStudent={(studentId) => {
            setEditStudentId(studentId)
            setShowEditModal(true)
          }}
          onMarkPaid={handleMarkPaid}
          onAssessment={(e) => setPanelEnrollmentId(e.id)}
          onPayments={handleAddPayment}
          onSendReceipt={sendReceipt}
          onRefund={setRefundPayment}
        />
      </div>

      {/* Enrollment Details Modal */}
      {selectedEnrollment && !showPaymentModal && (
        <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enrollment Details</DialogTitle>
              <DialogDescription>
                {selectedEnrollment.student.firstName} {selectedEnrollment.student.lastName} - {selectedEnrollment.course.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Student Information */}
              <div>
                <h4 className="font-semibold mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p>{selectedEnrollment.student.firstName} {selectedEnrollment.student.lastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{selectedEnrollment.student.email}</p>
                  </div>
                  {selectedEnrollment.student.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p>{selectedEnrollment.student.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Stage:</span>
                    <p><StatusBadge status={selectedEnrollment.status} /></p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p>{enrollmentLocationName(selectedEnrollment) || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Delivery Mode:</span>
                    <p>{selectedEnrollment.offering?.deliveryMode.name || selectedEnrollment.selectedMode || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-semibold mb-2">Payment History</h4>
                <div className="space-y-2">
                  {selectedEnrollment.applicationPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Assessment Fee</p>
                        <p className="text-sm text-muted-foreground">
                          Receipt: {payment.receiptNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <PaymentStatusBadge status={payment.status} />
                        {payment.status === 'duplicate' && (
                          <div className="mt-1">
                            <Button variant="outline" size="sm" className="!h-7" onClick={() => setRefundPayment(payment)}>
                              Mark refunded
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedEnrollment.tuitionPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Tuition Payment</p>
                        <p className="text-sm text-muted-foreground">
                          Receipt: {payment.receiptNumber}
                        </p>
                        {payment.description && (
                          <p className="text-xs text-muted-foreground">{payment.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <RefundDialog
        payment={refundPayment}
        onClose={() => setRefundPayment(null)}
        onDone={() => {
          setSelectedEnrollment(null)
          loadEnrollments()
        }}
      />

      {/* Assessment & plan panel */}
      <AssessmentPlanPanel
        enrollmentId={panelEnrollmentId}
        onClose={() => setPanelEnrollmentId(null)}
        onChanged={() => loadEnrollments()}
      />

      {/* Tuition Payment Modal */}
      <TuitionPaymentModal
        enrollment={selectedEnrollment}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedEnrollment(null)
        }}
        onPaymentAdded={() => {
          loadEnrollments() // Refresh data
        }}
      />

      {/* Edit Student Modal */}
      <StudentEditModal
        studentId={editStudentId}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditStudentId(null)
        }}
        onSaved={() => {
          loadEnrollments() // Refresh so edited names/details show
        }}
      />

      <StudentRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegistered={() => loadEnrollments()}
      />
    </AdminLayout>
  )
}
