"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CreditCard,
  Receipt,
  Mail,
} from "lucide-react"
import { TuitionPaymentModal } from "@/components/admin/tuition-payment-modal"

interface Enrollment {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  selectedMode: string
  status: string
  applicationPaid: boolean
  createdAt: string
  course: {
    title: string
    instrument: string
    level: string
    sessionStartDate?: string
    instructor?: {
      name: string
    }
  }
  applicationPayments: Array<{
    id: string
    amount: number
    status: string
    receiptNumber: string
    paidAt?: string
  }>
  tuitionPayments: Array<{
    id: string
    amount: number
    status: string
    receiptNumber: string
    paidAt?: string
    description?: string
  }>
}

interface EnrollmentStats {
  totalEnrollments: number
  applicationPaidEnrollments: number
  pendingApplications: number
  totalApplicationFees: number
  totalTuitionPaid: number
  averageCompletionRate: number
}

export default function EnrollmentsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [stats, setStats] = useState<EnrollmentStats>({
    totalEnrollments: 0,
    applicationPaidEnrollments: 0,
    pendingApplications: 0,
    totalApplicationFees: 0,
    totalTuitionPaid: 0,
    averageCompletionRate: 0
  })

  useEffect(() => {
    loadEnrollments()
  }, [])

  useEffect(() => {
    filterEnrollments()
  }, [enrollments, searchTerm, statusFilter, paymentFilter])

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

  const calculateStats = (enrollmentsData: Enrollment[]) => {
    const applicationPaidCount = enrollmentsData.filter(e => e.applicationPaid).length
    const pendingCount = enrollmentsData.filter(e => e.status === 'pending').length
    const totalAppFees = enrollmentsData.reduce((sum, e) =>
      sum + e.applicationPayments.filter(p => p.status === 'completed').reduce((pSum, p) => pSum + p.amount, 0), 0
    )
    const totalTuition = enrollmentsData.reduce((sum, e) =>
      sum + e.tuitionPayments.filter(p => p.status === 'completed').reduce((pSum, p) => pSum + p.amount, 0), 0
    )

    setStats({
      totalEnrollments: enrollmentsData.length,
      applicationPaidEnrollments: applicationPaidCount,
      pendingApplications: pendingCount,
      totalApplicationFees: totalAppFees,
      totalTuitionPaid: totalTuition,
      averageCompletionRate: enrollmentsData.length > 0 ? Math.round((applicationPaidCount / enrollmentsData.length) * 100) : 0
    })
  }

  const filterEnrollments = () => {
    let filtered = enrollments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(enrollment =>
        enrollment.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter)
    }

    // Payment filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter(enrollment => {
        switch (paymentFilter) {
          case "application_paid":
            return enrollment.applicationPaid
          case "application_pending":
            return !enrollment.applicationPaid
          case "tuition_paid":
            return enrollment.tuitionPayments.some(p => p.status === 'completed')
          case "tuition_pending":
            return enrollment.applicationPaid && !enrollment.tuitionPayments.some(p => p.status === 'completed')
          default:
            return true
        }
      })
    }

    setFilteredEnrollments(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (enrollment: Enrollment) => {
    if (enrollment.status === 'pending' && !enrollment.applicationPaid) {
      return <Badge variant="destructive">Payment Pending</Badge>
    }
    if (enrollment.status === 'application_paid' || enrollment.applicationPaid) {
      const hasTuitionPayment = enrollment.tuitionPayments.some(p => p.status === 'completed')
      if (hasTuitionPayment) {
        return <Badge variant="default">Tuition Paid</Badge>
      }
      return <Badge variant="secondary">Application Paid</Badge>
    }
    if (enrollment.status === 'enrolled') {
      return <Badge variant="default">Enrolled</Badge>
    }
    return <Badge variant="outline">{enrollment.status}</Badge>
  }

  const getTotalTuitionPaid = (enrollment: Enrollment) => {
    return enrollment.tuitionPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const handleViewEnrollment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
  }

  const handleAddPayment = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setShowPaymentModal(true)
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
        alert(`${type === 'application' ? 'Application fee' : 'Tuition'} receipt sent successfully!`)
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">Enrollment Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage student enrollments, track payments, and send receipts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                  <p className="text-3xl font-bold">{stats.totalEnrollments}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.applicationPaidEnrollments} application paid
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Application Fees</p>
                  <p className="text-3xl font-bold">₦{(stats.totalApplicationFees / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-green-600 mt-1">Non-refundable fees</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tuition Collected</p>
                  <p className="text-3xl font-bold">₦{(stats.totalTuitionPaid / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground mt-1">From enrolled students</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-3xl font-bold">{stats.averageCompletionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Application to payment</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students, courses, or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="application_paid">Application Paid</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="application_paid">Application Paid</SelectItem>
                  <SelectItem value="application_pending">Application Pending</SelectItem>
                  <SelectItem value="tuition_paid">Tuition Paid</SelectItem>
                  <SelectItem value="tuition_pending">Tuition Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Enrollments ({filteredEnrollments.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No enrollments found</h3>
                <p className="text-muted-foreground">
                  {enrollments.length === 0
                    ? "No student enrollments yet"
                    : "Try adjusting your search or filter criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Application Fee</TableHead>
                      <TableHead>Tuition Paid</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.firstName} {enrollment.lastName}</p>
                            <p className="text-sm text-muted-foreground">{enrollment.email}</p>
                            {enrollment.phone && (
                              <p className="text-xs text-muted-foreground">{enrollment.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.course.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {enrollment.course.instrument} • {enrollment.course.level}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.selectedMode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(enrollment)}
                        </TableCell>
                        <TableCell>
                          <div>
                            {enrollment.applicationPaid ? (
                              <div>
                                <p className="text-sm font-medium text-green-600">
                                  ₦2,000 Paid
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {enrollment.applicationPayments[0]?.paidAt &&
                                    formatDate(enrollment.applicationPayments[0].paidAt)
                                  }
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-orange-600">Pending</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {formatCurrency(getTotalTuitionPaid(enrollment))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {enrollment.tuitionPayments.length} payment(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(enrollment.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewEnrollment(enrollment)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddPayment(enrollment)}
                              title="Manage payments"
                              disabled={!enrollment.applicationPaid}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => sendReceipt(enrollment.id, 'application')}
                              title="Send receipt"
                              disabled={!enrollment.applicationPaid}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Details Modal */}
      {selectedEnrollment && !showPaymentModal && (
        <Dialog open={!!selectedEnrollment} onOpenChange={() => setSelectedEnrollment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enrollment Details</DialogTitle>
              <DialogDescription>
                {selectedEnrollment.firstName} {selectedEnrollment.lastName} - {selectedEnrollment.course.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Student Information */}
              <div>
                <h4 className="font-semibold mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p>{selectedEnrollment.firstName} {selectedEnrollment.lastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p>{selectedEnrollment.email}</p>
                  </div>
                  {selectedEnrollment.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p>{selectedEnrollment.phone}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Delivery Mode:</span>
                    <p>{selectedEnrollment.selectedMode}</p>
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
                        <p className="font-medium">Application Fee</p>
                        <p className="text-sm text-muted-foreground">
                          Receipt: {payment.receiptNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status}
                        </Badge>
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
    </AdminLayout>
  )
}