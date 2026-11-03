/** Shapes returned by GET /api/enrollments (admin list). Legacy rows have null plan/location fields. */
export interface ApplicationPayment {
  id: string
  amount: number
  /** completed | pending | failed | superseded | duplicate | refunded */
  status: string
  receiptNumber: string
  paidAt?: string
  refundedAt?: string | null
}

export interface Enrollment {
  id: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    dateOfBirth?: string
    address?: string
  }
  selectedMode: string
  status: string
  applicationPaid: boolean
  /** Set when this application's fee is covered by an earlier payment of the same student. */
  feeCoveredByPaymentId?: string | null
  createdAt: string
  locationId?: string | null
  location?: { id: string; name: string } | null
  offering?: { id: string; deliveryMode: { name: string } } | null
  durationMins?: number | null
  classesPerWeek?: number | null
  plannedClasses?: number | null
  ratePerClass?: number | null
  assessments?: Array<{
    id: string
    status: string
    arrangement: string
    preferredDate?: string | null
    preferredTimeBand?: string | null
    scheduledAt?: string | null
    resultLevel?: string | null
  }>
  course: {
    title: string
    instrument: string
    level: string
    location?: string
    sessionStartDate?: string
    pricing?: Record<string, number> | null
    instructor?: {
      name: string
    }
  }
  applicationPayments: ApplicationPayment[]
  tuitionPayments: Array<{
    id: string
    amount: number
    status: string
    paymentMethod?: string | null
    receiptNumber: string
    paidAt?: string
    description?: string
  }>
  /** Per-class ledger rows (voided ones included; the balance helpers ignore them). Absent on legacy rows. */
  tuitionCharges?: Array<{
    id: string
    kind: string
    quantity: number
    unitPrice: number
    createdAt: string
    voidedAt?: string | null
  }>
}

/** Location shown for a row: the enrollment's own location, else the course's legacy text. */
export const enrollmentLocationName = (e: Enrollment): string => e.location?.name || e.course.location || ""

/** Duplicate fee payments: money received twice, awaiting a manual refund. */
export const duplicatePayments = (e: Enrollment) => e.applicationPayments.filter((p) => p.status === "duplicate")
export const needsRefund = (e: Enrollment) => duplicatePayments(e).length > 0

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
