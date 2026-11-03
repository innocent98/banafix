"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard } from "lucide-react"
import { ChargesSection } from "./tuition/charges-section"
import { PaymentHistory } from "./tuition/payment-history"
import { PaymentLinkSection } from "./tuition/payment-link-section"
import { RecordPaymentForm } from "./tuition/record-payment-form"
import { formatMoney, tuitionApi, type MaterialOption, type TuitionData } from "./tuition/shared"

interface Enrollment {
  id: string
  student: { firstName: string; lastName: string; email: string }
  course: { title: string }
}

interface TuitionPaymentModalProps {
  enrollment: Enrollment | null
  isOpen: boolean
  onClose: () => void
  onPaymentAdded: () => void
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "warn" | "ok" | "info" }) {
  const color = tone === "warn" ? "text-orange-600" : tone === "ok" ? "text-green-700" : tone === "info" ? "text-blue-600" : ""
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  )
}

export function TuitionPaymentModal({ enrollment, isOpen, onClose, onPaymentAdded }: TuitionPaymentModalProps) {
  const [data, setData] = useState<TuitionData | null>(null)
  const [materials, setMaterials] = useState<MaterialOption[]>([])
  const [loadError, setLoadError] = useState("")
  const [notice, setNotice] = useState("")

  const enrollmentId = enrollment?.id

  const load = useCallback(async () => {
    if (!enrollmentId) return
    setLoadError("")
    try {
      const { ok, data: body } = await tuitionApi<Partial<TuitionData>>("GET", `/api/admin/enrollments/${enrollmentId}/tuition`)
      if (!ok) {
        setLoadError(body.error || "Failed to load tuition details")
        return
      }
      setData(body as TuitionData)
    } catch {
      setLoadError("Network error. Please try again.")
    }
  }, [enrollmentId])

  // Open (or switch enrollment): reset, then load the ledger and the course's materials.
  useEffect(() => {
    setData(null)
    setMaterials([])
    setNotice("")
    setLoadError("")
    if (!isOpen || !enrollmentId) return
    load()
    tuitionApi<{ materials?: MaterialOption[] }>("GET", `/api/admin/enrollments/${enrollmentId}`)
      .then(({ ok, data: body }) => ok && setMaterials(body.materials ?? []))
      .catch(() => undefined)
  }, [isOpen, enrollmentId, load])

  // Every mutation: show what happened, refetch the ledger, refresh the parent list.
  const afterChange = useCallback(
    async (message: string) => {
      setNotice(message)
      await load()
      onPaymentAdded()
    },
    [load, onPaymentAdded],
  )

  if (!enrollment) return null

  const summary = data?.summary
  const canRecord = data ? data.enrollment.applicationPaid && ["plan_agreed", "enrolled"].includes(data.enrollment.status) : false

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Tuition payments
          </DialogTitle>
          <DialogDescription>
            {enrollment.student.firstName} {enrollment.student.lastName} - {enrollment.course.title}
          </DialogDescription>
        </DialogHeader>

        {loadError && (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        )}
        {!data && !loadError && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}

        {data && summary && (
          <div className="min-w-0 space-y-4">
            {notice && (
              <Alert>
                <AlertDescription className="text-green-700">{notice}</AlertDescription>
              </Alert>
            )}

            {summary.mode === "ledger" ? (
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Tile label="Charged" value={formatMoney(summary.charged)} />
                    <Tile label="Paid" value={formatMoney(summary.paid)} tone="ok" />
                    <Tile label="Outstanding" value={formatMoney(summary.outstanding)} tone={summary.outstanding > 0 ? "warn" : undefined} />
                    {summary.credit > 0 && <Tile label="Credit" value={formatMoney(summary.credit)} tone="info" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {summary.classesCovered} of {summary.classesPurchased} classes covered
                    {summary.materials > 0 && ` • materials ${formatMoney(summary.materials)} are settled first`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                This is an older enrollment without a per-class plan, so tuition is tracked as a single course price.
              </p>
            )}

            {!canRecord && (
              <Alert>
                <AlertDescription>
                  Payments can only be recorded once the assessment fee is paid and the plan is agreed (this enrollment
                  is {data.enrollment.status.replace(/_/g, " ")}). History is shown below.
                </AlertDescription>
              </Alert>
            )}

            {summary.mode === "ledger" && (
              <ChargesSection
                enrollmentId={enrollment.id}
                charges={data.charges}
                materials={materials}
                onChanged={afterChange}
              />
            )}

            {canRecord && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {summary.mode === "ledger" ? (
                  <>
                    <RecordPaymentForm enrollmentId={enrollment.id} outstanding={summary.outstanding} onRecorded={afterChange} />
                    <PaymentLinkSection
                      enrollmentId={enrollment.id}
                      outstanding={summary.outstanding}
                      studentFirstName={enrollment.student.firstName}
                      courseTitle={enrollment.course.title}
                      onCreated={afterChange}
                    />
                  </>
                ) : (
                  <RecordPaymentForm
                    enrollmentId={enrollment.id}
                    outstanding={0}
                    legacy={{ expectedTotal: summary.expectedTotal, paid: summary.paid }}
                    onRecorded={afterChange}
                  />
                )}
              </div>
            )}

            <PaymentHistory payments={data.payments} totalPaid={summary.paid} onChanged={afterChange} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
