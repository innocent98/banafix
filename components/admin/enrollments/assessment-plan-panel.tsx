"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { canTransition } from "@/lib/enrollment-status"
import { planTotal } from "@/lib/offering-rates"
import { ARRANGEMENTS, ARRANGEMENT_LABELS, TIME_BAND_LABELS, isArrangement, isTimeBand } from "@/lib/assessment-vocab"
import { formatNaira } from "@/lib/site"
import { StatusBadge, PaymentStatusBadge } from "./status-badge"
import { RefundDialog } from "./refund-dialog"
import { formatCurrency, type ApplicationPayment } from "./types"

interface Rate { durationMins: number; pricePerClass: number }
interface OfferingSummary {
  id: string
  isActive: boolean
  classesPerWeekOptions: number[]
  location: { id: string; name: string }
  deliveryMode: { name: string }
  rates: Rate[]
}
interface AssessmentRow {
  id: string
  status: string
  arrangement: string
  preferredDate: string | null
  preferredTimeBand: string | null
  address: string | null
  landmark: string | null
  scheduledAt: string | null
  resultLevel: string | null
  resultNotes: string | null
  recommendedOfferingId: string | null
  completedAt: string | null
  assessor: { id: string; name: string } | null
}
interface MaterialRow { id: string; name: string; price: number; required: boolean }
interface Detail {
  enrollment: {
    id: string
    status: string
    applicationPaid: boolean
    offeringId: string | null
    durationMins: number | null
    classesPerWeek: number | null
    plannedClasses: number | null
    ratePerClass: number | null
    location: { id: string; name: string } | null
    offering: { id: string; deliveryMode: { name: string } } | null
    course: { id: string; title: string }
    student: { firstName: string; lastName: string; address: string | null; landmark: string | null }
    applicationPayments: ApplicationPayment[]
    feeCoveredBy: { id: string; amount: number; receiptNumber: string; paidAt: string | null } | null
  }
  assessments: AssessmentRow[]
  offerings: OfferingSummary[]
  /** Active materials of the course: required ones are always charged, optional ones are picked here. */
  materials?: MaterialRow[]
  reusableAssessment: {
    id: string
    resultLevel: string | null
    completedAt: string | null
    enrollment: { id: string; course: { title: string } }
  } | null
}

interface Props {
  enrollmentId: string | null
  onClose: () => void
  onChanged: () => void
}

const NONE = "none"
const LEVEL_SUGGESTIONS = ["Complete beginner", "Some experience", "Intermediate", "Advanced"]

const token = () => (typeof window !== "undefined" ? localStorage.getItem("admin_token") : null)

async function api(method: string, url: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, data }
}

const errorText = (data: any, fallback: string) => data?.error || data?.message || fallback

const toLocalInput = (iso?: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const offeringLabel = (o: OfferingSummary) => `${o.location.name} • ${o.deliveryMode.name}${o.isActive ? "" : " (inactive)"}`

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>Back</Button>
          <Button className={destructive ? "bg-red-600 text-white hover:bg-red-700" : undefined} onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <div>
        <h4 className="font-semibold">{title}</h4>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function AssessmentPlanPanel({ enrollmentId, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loadError, setLoadError] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([])
  const [confirming, setConfirming] = useState<null | "confirm" | "cancel" | "reuse">(null)
  const [refundPayment, setRefundPayment] = useState<ApplicationPayment | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [addingRecord, setAddingRecord] = useState(false)

  // Schedule form
  const [scheduledAt, setScheduledAt] = useState("")
  const [assessorId, setAssessorId] = useState(NONE)
  const [arrangement, setArrangement] = useState("CENTRE")
  const [address, setAddress] = useState("")
  const [landmark, setLandmark] = useState("")
  // Result form
  const [resultLevel, setResultLevel] = useState("")
  const [resultNotes, setResultNotes] = useState("")
  const [recommendedOfferingId, setRecommendedOfferingId] = useState(NONE)
  // Plan form
  const [planOfferingId, setPlanOfferingId] = useState("")
  const [planDuration, setPlanDuration] = useState("")
  const [planPerWeek, setPlanPerWeek] = useState("")
  const [plannedClasses, setPlannedClasses] = useState("")
  const [optionalMaterialIds, setOptionalMaterialIds] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!enrollmentId) return
    setLoadError("")
    try {
      const { ok, data } = await api("GET", `/api/admin/enrollments/${enrollmentId}`)
      if (!ok) {
        setLoadError(errorText(data, "Failed to load enrollment"))
        return
      }
      setDetail(data as Detail)
    } catch {
      setLoadError("Network error. Please try again.")
    }
  }, [enrollmentId])

  // Reset + load whenever a different enrollment is opened.
  useEffect(() => {
    setDetail(null)
    setError("")
    setNotice("")
    setAddingRecord(false)
    setConfirming(null)
    setRefundPayment(null)
    setCancelReason("")
    if (!enrollmentId) return
    load()
    api("GET", "/api/admin/instructors")
      .then(({ data }) => setInstructors(data.instructors ?? []))
      .catch(() => {})
  }, [enrollmentId, load])

  const latest = detail?.assessments[0]
  const latestCompleted = detail?.assessments.find((a) => a.status === "completed")
  const status = detail?.enrollment.status ?? ""
  const isLegacyEnrolled = status === "enrolled" && detail?.enrollment.ratePerClass == null

  // Prefill the forms from the loaded state (re-runs after every reload).
  useEffect(() => {
    if (!detail) return
    const l = detail.assessments[0]
    const scheduled = detail.assessments.find((a) => a.status === "scheduled")
    const done = detail.assessments.find((a) => a.status === "completed")
    setScheduledAt(toLocalInput(scheduled?.scheduledAt))
    setAssessorId((scheduled ?? l)?.assessor?.id ?? NONE)
    setArrangement(isArrangement(l?.arrangement) ? l!.arrangement : "CENTRE")
    setAddress(l?.address ?? detail.enrollment.student.address ?? "")
    setLandmark(l?.landmark ?? detail.enrollment.student.landmark ?? "")
    setResultLevel(done?.resultLevel ?? "")
    setResultNotes(done?.resultNotes ?? "")
    setRecommendedOfferingId(done?.recommendedOfferingId ?? NONE)

  }, [detail])

  // Plan inputs reset only when the enrollment or its stage changes, so saving an edited result
  // does not wipe a half-filled plan.
  const planKey = detail ? `${detail.enrollment.id}:${detail.enrollment.status}` : ""
  useEffect(() => {
    if (!detail) return
    const done = detail.assessments.find((a) => a.status === "completed")
    const priced = detail.offerings.filter((o) => o.rates.length > 0)
    const e = detail.enrollment
    const pick =
      priced.find((o) => o.id === e.offeringId) ??
      priced.find((o) => o.id === done?.recommendedOfferingId) ??
      priced[0]
    setPlanOfferingId(pick?.id ?? "")
    setPlanDuration(e.durationMins != null ? String(e.durationMins) : "")
    setPlanPerWeek(e.classesPerWeek != null ? String(e.classesPerWeek) : "")
    setPlannedClasses(e.plannedClasses != null ? String(e.plannedClasses) : "")
    setOptionalMaterialIds([])
    // Editing an agreed plan recreates its charges, so start from the optional materials already charged.
    if (e.status === "plan_agreed") {
      const forEnrollment = e.id
      api("GET", `/api/admin/enrollments/${forEnrollment}/tuition`)
        .then(({ ok, data }) => {
          if (!ok) return
          const charged = ((data.charges ?? []) as Array<{ origin: string; kind: string; materialId?: string | null; voidedAt?: string | null }>)
            .filter((c) => c.origin === "PLAN" && c.kind === "MATERIAL" && !c.voidedAt && c.materialId)
            .map((c) => c.materialId as string)
          setOptionalMaterialIds(charged)
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planKey])

  const pricedOfferings = useMemo(() => (detail?.offerings ?? []).filter((o) => o.rates.length > 0), [detail])
  const planOffering = pricedOfferings.find((o) => o.id === planOfferingId)
  const rateForPlan = planOffering?.rates.find((r) => String(r.durationMins) === planDuration)?.pricePerClass
  const plannedN = Number(plannedClasses)
  const classesTotal =
    rateForPlan != null && Number.isInteger(plannedN) && plannedN > 0 ? planTotal(rateForPlan, plannedN) : null
  const courseMaterials = detail?.materials ?? []
  const requiredMaterials = courseMaterials.filter((m) => m.required)
  const optionalMaterials = courseMaterials.filter((m) => !m.required)
  const chosenOptional = optionalMaterials.filter((m) => optionalMaterialIds.includes(m.id))
  const materialsTotal =
    requiredMaterials.reduce((sum, m) => sum + m.price, 0) + chosenOptional.reduce((sum, m) => sum + m.price, 0)
  const previewTotal = classesTotal != null ? classesTotal + materialsTotal : null

  // Keep duration / classes-per-week valid for the chosen offering.
  useEffect(() => {
    if (!planOffering) return
    if (!planOffering.rates.some((r) => String(r.durationMins) === planDuration)) {
      setPlanDuration(String(planOffering.rates[0].durationMins))
    }
    if (!planOffering.classesPerWeekOptions.map(String).includes(planPerWeek)) {
      setPlanPerWeek(String(planOffering.classesPerWeekOptions[0] ?? ""))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planOffering, planDuration, planPerWeek])

  const run = async (fn: () => Promise<{ ok: boolean; data: any }>, fallback: string, success: string) => {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const { ok, data } = await fn()
      if (!ok) {
        setError(errorText(data, fallback))
        return false
      }
      setNotice(success)
      await load()
      onChanged()
      return true
    } catch {
      setError("Network error. Please try again.")
      return false
    } finally {
      setBusy(false)
    }
  }

  const submitSchedule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduledAt) {
      setError("Pick a date and time for the assessment")
      return
    }
    run(
      () =>
        api("POST", `/api/admin/enrollments/${enrollmentId}/assessment`, {
          scheduledAt: new Date(scheduledAt).toISOString(),
          arrangement,
          assessorId: assessorId === NONE ? null : assessorId,
          ...(arrangement === "HOME" ? { address, landmark } : {}),
        }),
      "Failed to schedule assessment",
      status === "assessment_scheduled" ? "Assessment rescheduled" : "Assessment scheduled",
    )
  }

  const submitResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resultLevel.trim()) {
      setError("Enter the assessed level")
      return
    }
    // Record on the scheduled assessment, or edit the latest completed one in place.
    const target = status === "assessment_scheduled" ? latest : latestCompleted
    const ok = await run(
      () =>
        api("PATCH", `/api/admin/enrollments/${enrollmentId}/assessment`, {
          ...(target ? { assessmentId: target.id } : {}),
          resultLevel,
          resultNotes,
          recommendedOfferingId: recommendedOfferingId === NONE ? null : recommendedOfferingId,
          assessorId: assessorId === NONE ? null : assessorId,
        }),
      "Failed to save result",
      latestCompleted && status !== "assessment_scheduled" ? "Result updated" : "Result recorded",
    )
    if (ok) setAddingRecord(false)
  }

  const submitPlan = (e: React.FormEvent) => {
    e.preventDefault()
    run(
      () =>
        api("POST", `/api/admin/enrollments/${enrollmentId}/plan`, {
          offeringId: planOfferingId,
          durationMins: Number(planDuration),
          classesPerWeek: Number(planPerWeek),
          plannedClasses: Number(plannedClasses),
          materialIds: chosenOptional.map((m) => m.id),
        }),
      "Failed to save plan",
      status === "plan_agreed" ? "Plan updated" : "Plan agreed",
    )
  }

  const doConfirm = async () => {
    const ok = await run(
      () => api("POST", `/api/admin/enrollments/${enrollmentId}/confirm`, {}),
      "Failed to confirm enrolment",
      "Enrolment confirmed",
    )
    if (ok) setConfirming(null)
  }

  const doReuse = async () => {
    const ok = await run(
      () => api("POST", `/api/admin/enrollments/${enrollmentId}/assessment/reuse`, {
          // The assessment the admin was shown, so a newer result is never copied instead.
          sourceAssessmentId: detail?.reusableAssessment?.id,
        }),
      "Failed to reuse assessment",
      "Previous assessment reused; the student is now Assessed",
    )
    if (ok) setConfirming(null)
  }

  const doCancel = async () => {
    const ok = await run(
      () => api("POST", `/api/admin/enrollments/${enrollmentId}/cancel`, { reason: cancelReason.trim() || undefined }),
      "Failed to cancel enrollment",
      "Enrollment cancelled",
    )
    if (ok) {
      setConfirming(null)
      setCancelReason("")
    }
  }

  const instructorSelect = (
    <div>
      <Label>Assessor</Label>
      <Select value={assessorId} onValueChange={setAssessorId}>
        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Unassigned</SelectItem>
          {instructors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )

  const enr = detail?.enrollment
  const canSchedule = canTransition(status, "assessment_scheduled") || status === "assessment_scheduled"
  const canRecord = status === "assessment_scheduled" || (Boolean(latestCompleted) && status !== "cancelled")
  const canPlan = status === "assessed" || status === "plan_agreed"
  const canConfirm = canTransition(status, "enrolled")
  const canCancel = canTransition(status, "cancelled")
  const reusable = status === "assessment_paid" ? detail?.reusableAssessment ?? null : null
  const duplicates = enr?.applicationPayments.filter((p) => p.status === "duplicate") ?? []
  const refundedPayments = enr?.applicationPayments.filter((p) => p.status === "refunded") ?? []
  const showResultForm = canRecord || (isLegacyEnrolled && addingRecord)

  return (
    <>
      <Dialog open={Boolean(enrollmentId)} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment &amp; plan</DialogTitle>
            <DialogDescription>
              {enr ? `${enr.student.firstName} ${enr.student.lastName} - ${enr.course.title}` : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {loadError && <Alert variant="destructive"><AlertDescription>{loadError}</AlertDescription></Alert>}
          {!detail && !loadError && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}

          {detail && enr && (
            <div className="min-w-0 space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={enr.status} />
                <span className="text-sm text-muted-foreground">
                  {[enr.location?.name, enr.offering?.deliveryMode.name].filter(Boolean).join(" • ") || "No location recorded (legacy)"}
                </span>
              </div>

              {enr.feeCoveredBy && (
                <Alert>
                  <AlertDescription>
                    Fee already covered by receipt {enr.feeCoveredBy.receiptNumber}
                    {enr.feeCoveredBy.paidAt && `, paid ${new Date(enr.feeCoveredBy.paidAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}`}
                    . No second assessment fee is charged for this student.
                  </AlertDescription>
                </Alert>
              )}

              {(duplicates.length > 0 || refundedPayments.length > 0) && (
                <Section
                  title="Duplicate payments"
                  hint="A second assessment-fee payment arrived after the fee was already covered. Refund it by hand in the Paystack dashboard, then record it here."
                >
                  <div className="space-y-2">
                    {[...duplicates, ...refundedPayments].map((p) => (
                      <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-3 text-sm">
                        <div>
                          <p className="font-medium">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            Receipt {p.receiptNumber}
                            {p.status === "refunded" && p.refundedAt && `, refunded ${new Date(p.refundedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PaymentStatusBadge status={p.status} />
                          {p.status === "duplicate" && (
                            <Button size="sm" variant="outline" onClick={() => setRefundPayment(p)} disabled={busy}>
                              Mark refunded
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {latest ? (
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted p-4 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Arrangement</span>
                    <p>{isArrangement(latest.arrangement) ? ARRANGEMENT_LABELS[latest.arrangement] : latest.arrangement}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preferred date and time</span>
                    <p>
                      {latest.preferredDate ? new Date(latest.preferredDate).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "No date given"}
                      {latest.preferredTimeBand && ` • ${isTimeBand(latest.preferredTimeBand) ? TIME_BAND_LABELS[latest.preferredTimeBand] : latest.preferredTimeBand}`}
                    </p>
                  </div>
                  {(latest.address || latest.landmark) && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Home address</span>
                      <p>{[latest.address, latest.landmark && `Landmark: ${latest.landmark}`].filter(Boolean).join(" • ")}</p>
                    </div>
                  )}
                  {latest.scheduledAt && (
                    <div>
                      <span className="text-muted-foreground">Scheduled for</span>
                      <p>{new Date(latest.scheduledAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}{latest.assessor && ` • ${latest.assessor.name}`}</p>
                    </div>
                  )}
                  {latest.status === "completed" && (
                    <div>
                      <span className="text-muted-foreground">Result</span>
                      <p>{latest.resultLevel}{latest.resultNotes && ` - ${latest.resultNotes}`}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  No assessment record{isLegacyEnrolled || status === "pending" ? " (registered before assessments existed)" : ""}.
                </p>
              )}

              {detail.assessments.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {detail.assessments.length} assessments on record. Showing the most recent.
                </p>
              )}

              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}

              {/* Reuse a previous assessment */}
              {reusable && (
                <Section
                  title="Reuse latest assessment"
                  hint="This student has already been assessed. Copy that result instead of scheduling a new assessment, or schedule a new one below."
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm">
                      <span className="font-medium">{reusable.resultLevel}</span>
                      {` - ${reusable.enrollment.course.title}`}
                      {reusable.completedAt && `, ${new Date(reusable.completedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}`}
                    </p>
                    <Button onClick={() => setConfirming("reuse")} disabled={busy}>Reuse latest assessment</Button>
                  </div>
                </Section>
              )}

              {/* Schedule */}
              {canSchedule ? (
                <Section
                  title={status === "assessment_scheduled" ? "Reschedule assessment" : status === "assessed" ? "Schedule a re-assessment" : "Schedule assessment"}
                  hint="Starts from the student's preferred date and time."
                >
                  <form onSubmit={submitSchedule} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <Label htmlFor="scheduledAt">Date and time *</Label>
                        <Input id="scheduledAt" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                      </div>
                      {instructorSelect}
                      <div>
                        <Label>Arrangement</Label>
                        <Select value={arrangement} onValueChange={setArrangement}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ARRANGEMENTS.map((a) => <SelectItem key={a} value={a}>{ARRANGEMENT_LABELS[a]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {arrangement === "HOME" && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div><Label htmlFor="sAddress">Home address</Label><Input id="sAddress" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                        <div><Label htmlFor="sLandmark">Landmark</Label><Input id="sLandmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} /></div>
                      </div>
                    )}
                    <Button type="submit" disabled={busy}>{status === "assessment_scheduled" ? "Save new time" : "Schedule"}</Button>
                  </form>
                </Section>
              ) : (
                status === "pending" && (
                  <Section title="Schedule assessment" hint="Mark the assessment fee paid first (row action), then schedule." />
                )
              )}

              {/* Result */}
              {showResultForm ? (
                <Section
                  title={status === "assessment_scheduled" ? "Record result" : isLegacyEnrolled && !latestCompleted ? "Add assessment record" : "Edit result"}
                  hint={status === "assessment_scheduled" ? "Recording the result moves the student to Assessed." : "Editing a recorded result does not change the stage; the change is audited."}
                >
                  <form onSubmit={submitResult} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="resultLevel">Level *</Label>
                        <Input id="resultLevel" list="level-suggestions" value={resultLevel} onChange={(e) => setResultLevel(e.target.value)} placeholder="e.g. Beginner" />
                        <datalist id="level-suggestions">{LEVEL_SUGGESTIONS.map((l) => <option key={l} value={l} />)}</datalist>
                      </div>
                      <div>
                        <Label>Recommended offering</Label>
                        <Select value={recommendedOfferingId} onValueChange={setRecommendedOfferingId}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>No recommendation</SelectItem>
                            {detail.offerings.map((o) => <SelectItem key={o.id} value={o.id}>{offeringLabel(o)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      {instructorSelect}
                    </div>
                    <div><Label htmlFor="resultNotes">Notes</Label><Textarea id="resultNotes" rows={3} value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} /></div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={busy}>{status === "assessment_scheduled" ? "Record result" : "Save result"}</Button>
                      {addingRecord && <Button type="button" variant="outline" onClick={() => setAddingRecord(false)}>Cancel</Button>}
                    </div>
                  </form>
                </Section>
              ) : isLegacyEnrolled ? (
                <Section title="Assessment record" hint="This student enrolled before assessments existed. A record is optional.">
                  <Button variant="outline" onClick={() => setAddingRecord(true)}>Add assessment record</Button>
                </Section>
              ) : null}

              {/* Plan */}
              {canPlan ? (
                <Section
                  title={status === "plan_agreed" ? "Edit plan" : "Agree plan"}
                  hint={status === "plan_agreed" ? "Saving re-snapshots the CURRENT rate for this offering." : "The rate is read from the chosen offering and stored on this enrolment."}
                >
                  {pricedOfferings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      This course has no offering with rates yet. Add rates under Courses, Offerings, then return here.
                    </p>
                  ) : (
                    <form onSubmit={submitPlan} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Label>Offering</Label>
                          <Select value={planOfferingId} onValueChange={(v) => v && setPlanOfferingId(v)}>
                            <SelectTrigger><SelectValue placeholder="Select an offering" /></SelectTrigger>
                            <SelectContent>
                              {pricedOfferings.map((o) => <SelectItem key={o.id} value={o.id}>{offeringLabel(o)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Class length</Label>
                          <Select value={planDuration} onValueChange={(v) => v && setPlanDuration(v)} disabled={!planOffering}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {(planOffering?.rates ?? []).map((r) => (
                                <SelectItem key={r.durationMins} value={String(r.durationMins)}>
                                  {r.durationMins} min • {formatNaira(r.pricePerClass)} per class
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Classes per week</Label>
                          <Select value={planPerWeek} onValueChange={(v) => v && setPlanPerWeek(v)} disabled={!planOffering}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {(planOffering?.classesPerWeekOptions ?? []).map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="plannedClasses">Planned classes (total)</Label>
                          <Input id="plannedClasses" type="number" min={1} step={1} value={plannedClasses} onChange={(e) => setPlannedClasses(e.target.value)} />
                        </div>
                      </div>
                      {courseMaterials.length > 0 && (
                        <div className="space-y-2 rounded-lg border p-3 text-sm" data-testid="plan-materials">
                          <p className="font-medium">Books and materials</p>
                          {requiredMaterials.map((m) => (
                            <label key={m.id} className="flex items-center gap-2">
                              <input type="checkbox" checked disabled className="rounded border-gray-300" />
                              <span>{m.name} • {formatNaira(m.price)}</span>
                              <span className="text-xs text-muted-foreground">Included</span>
                            </label>
                          ))}
                          {optionalMaterials.map((m) => (
                            <label key={m.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={optionalMaterialIds.includes(m.id)}
                                onChange={(ev) =>
                                  setOptionalMaterialIds((ids) => (ev.target.checked ? [...ids, m.id] : ids.filter((id) => id !== m.id)))
                                }
                              />
                              <span>{m.name} • {formatNaira(m.price)}</span>
                              <span className="text-xs text-muted-foreground">Optional</span>
                            </label>
                          ))}
                        </div>
                      )}
                      <div className="rounded-lg bg-muted p-3 text-sm" data-testid="plan-preview">
                        {rateForPlan != null && classesTotal != null && previewTotal != null ? (
                          <>
                            <p className="font-medium">{formatNaira(rateForPlan)} × {plannedN} = {formatNaira(classesTotal)}</p>
                            {materialsTotal > 0 && <p className="font-medium">Materials: {formatNaira(materialsTotal)}</p>}
                            {materialsTotal > 0 && <p className="mt-1 font-semibold">Total: {formatNaira(previewTotal)}</p>}
                          </>
                        ) : (
                          <p className="text-muted-foreground">Choose a class length and enter the planned classes to see the total.</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          The rate and material prices are locked in when the plan is agreed.
                          {status === "plan_agreed" && " Saving voids and recreates this plan's charges (any extra charges added later stay)."}
                        </p>
                      </div>
                      <Button type="submit" disabled={busy || !planOfferingId || !planDuration || !planPerWeek || previewTotal == null}>
                        {status === "plan_agreed" ? "Update plan" : "Agree plan"}
                      </Button>
                    </form>
                  )}
                </Section>
              ) : (
                (status === "enrolled" || status === "cancelled") && (
                  <Section title="Plan">
                    {enr.ratePerClass != null ? (
                      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div><span className="text-muted-foreground">Class length</span><p>{enr.durationMins ?? "-"} min</p></div>
                        <div><span className="text-muted-foreground">Classes per week</span><p>{enr.classesPerWeek ?? "-"}</p></div>
                        <div><span className="text-muted-foreground">Planned classes</span><p>{enr.plannedClasses ?? "-"}</p></div>
                        <div><span className="text-muted-foreground">Rate per class</span><p>{formatNaira(enr.ratePerClass)}</p></div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No plan on record{isLegacyEnrolled ? " (legacy enrolment, read-only)" : ""}.</p>
                    )}
                  </Section>
                )
              )}

              {/* Confirm / cancel */}
              {(canConfirm || canCancel) && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <div>
                    {canCancel && (
                      <Button variant="outline" className="text-destructive" onClick={() => setConfirming("cancel")} disabled={busy}>
                        Cancel enrollment
                      </Button>
                    )}
                  </div>
                  {canConfirm && (
                    <Button onClick={() => setConfirming("confirm")} disabled={busy}>Confirm enrolment</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirming === "confirm"}
        title="Confirm enrolment"
        description="This moves the student to Enrolled with the agreed plan. Recording a tuition payment does the same."
        confirmLabel="Confirm enrolment"
        busy={busy}
        onConfirm={doConfirm}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "reuse"}
        title="Reuse latest assessment"
        description={
          reusable
            ? `Copy "${reusable.resultLevel}" (${reusable.enrollment.course.title}${reusable.completedAt ? `, ${new Date(reusable.completedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}` : ""}) onto this enrollment. The student moves to Assessed and no new assessment is scheduled.`
            : "No assessment available to reuse."
        }
        confirmLabel="Reuse assessment"
        busy={busy}
        onConfirm={doReuse}
        onCancel={() => setConfirming(null)}
      />
      <RefundDialog
        payment={refundPayment}
        onClose={() => setRefundPayment(null)}
        onDone={() => {
          load()
          onChanged()
        }}
      />
      <ConfirmDialog
        open={confirming === "cancel"}
        title="Cancel this enrollment?"
        description="The assessment fee is non-refundable; cancelling does not change any payment record."
        confirmLabel="Cancel enrollment"
        destructive
        busy={busy}
        onConfirm={doCancel}
        onCancel={() => setConfirming(null)}
      >
        <div>
          <Label htmlFor="cancelReason">Reason (optional)</Label>
          <Textarea id="cancelReason" rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </div>
      </ConfirmDialog>
    </>
  )
}
