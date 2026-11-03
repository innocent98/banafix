"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MODE_LABELS } from "@/lib/scheduling/mode"
import { describePreferences } from "@/lib/scheduling/preferences"
import {
  adminFetch,
  fmtDay,
  fmtInstantTime,
  nextMondayAfter,
  todayKey,
  type PreferenceFields,
  type SchedulePlanResponse,
} from "./shared"
import { lagosParts } from "@/lib/scheduling/time"

interface EnrollmentSchedule {
  enrollment: PreferenceFields & {
    id: string
    status: string
    plannedClasses: number | null
    durationMins: number | null
    classesPerWeek: number | null
  }
  sessions: { id: string; status: string }[]
  instructors: { id: string; name: string }[]
}

interface Props {
  enrollmentId: string | null
  onClose: () => void
  /** Called after classes were really created, with the instructor and the first class's instant so the page can jump there. */
  onScheduled: (instructorId: string, firstStartsAt: string) => void
}

const SLOT_STATUSES = ["scheduled", "held", "missed"]

export function AssignDialog({ enrollmentId, onClose, onScheduled }: Props) {
  const [data, setData] = useState<EnrollmentSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [instructorId, setInstructorId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [count, setCount] = useState("")
  const [override, setOverride] = useState(false)
  const [reason, setReason] = useState("")
  const [allowPartial, setAllowPartial] = useState(false)
  const [plan, setPlan] = useState<SchedulePlanResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!enrollmentId) return
    let cancelled = false
    setData(null)
    setPlan(null)
    setError("")
    setInstructorId("")
    setCount("")
    setOverride(false)
    setReason("")
    setAllowPartial(false)
    setStartDate(nextMondayAfter(todayKey()))
    setLoading(true)
    adminFetch<Partial<EnrollmentSchedule>>(`/api/admin/enrollments/${enrollmentId}/schedule`).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok || !res.data.enrollment) {
        setError(res.data.error || "Failed to load this enrollment")
        return
      }
      const d = res.data as EnrollmentSchedule
      setData(d)
      if (d.instructors.length === 1) setInstructorId(d.instructors[0].id)
    })
    return () => {
      cancelled = true
    }
  }, [enrollmentId])

  if (!enrollmentId) return null

  // Any change to the inputs makes the previewed plan stale.
  const edit = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setPlan(null)
    setError("")
  }

  const body = (dryRun: boolean) => ({
    instructorId,
    startDate,
    ...(count.trim() ? { count: Number(count) } : {}),
    dryRun,
    ...(override ? { overrideAvailability: true, overrideReason: reason.trim() } : {}),
    ...(!dryRun && allowPartial ? { allowPartial: true } : {}),
  })

  const validate = (): string | null => {
    if (!instructorId) return "Choose an instructor"
    if (!startDate) return "Choose a start date"
    if (count.trim() && (!Number.isInteger(Number(count)) || Number(count) < 1)) return "Number of classes must be a whole number of 1 or more"
    if (override && !reason.trim()) return "Say why the instructor is being booked outside their availability"
    return null
  }

  const preview = async () => {
    const problem = validate()
    if (problem) return setError(problem)
    setError("")
    setBusy(true)
    const res = await adminFetch<{ plan?: SchedulePlanResponse }>(`/api/admin/enrollments/${enrollmentId}/schedule`, { method: "POST", body: body(true) })
    setBusy(false)
    if (res.ok && res.data.plan) {
      setPlan(res.data.plan)
      setAllowPartial(false)
    } else {
      setPlan(null)
      setError(res.data.error || "Failed to preview the classes")
    }
  }

  const commit = async () => {
    const problem = validate()
    if (problem) return setError(problem)
    setError("")
    setBusy(true)
    const res = await adminFetch<{ plan?: SchedulePlanResponse }>(`/api/admin/enrollments/${enrollmentId}/schedule`, { method: "POST", body: body(false) })
    setBusy(false)
    if (res.ok && res.data.plan?.placed.length) {
      onScheduled(instructorId, res.data.plan.placed[0].startsAt)
      onClose()
    } else {
      setError(res.data.error || "Failed to schedule the classes")
    }
  }

  const e = data?.enrollment
  const alreadyScheduled = data?.sessions.filter((s) => SLOT_STATUSES.includes(s.status)).length ?? 0
  const canCommit = plan !== null && plan.placed.length > 0 && (plan.unplaced.length === 0 || allowPartial)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule classes</DialogTitle>
          <DialogDescription>Pick an instructor and a start date, preview the proposed classes, then schedule them.</DialogDescription>
        </DialogHeader>

        {loading && <p className="py-6 text-center text-muted-foreground">Loading…</p>}

        {e && data && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>
                <span className="font-medium">{alreadyScheduled} of {e.plannedClasses ?? "?"} classes scheduled</span>
                {e.classesPerWeek ? ` · ${e.classesPerWeek} a week` : ""}
                {e.durationMins ? ` · ${e.durationMins} minutes each` : ""}
              </p>
              <p className="mt-1 break-words text-muted-foreground">Preferences: {describePreferences(e)}</p>
            </div>

            {data.instructors.length === 0 ? (
              <Alert variant="destructive">
                <AlertDescription>No instructor teaches this course yet. Add the course to an instructor on the Instructors page first.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>Instructor</Label>
                  <Select value={instructorId} onValueChange={edit(setInstructorId)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose an instructor" /></SelectTrigger>
                    <SelectContent>
                      {data.instructors.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="as-start">Start date</Label>
                  <Input id="as-start" type="date" value={startDate} onChange={(ev) => edit(setStartDate)(ev.target.value)} />
                </div>
                <div>
                  <Label htmlFor="as-count">Classes (optional)</Label>
                  <Input id="as-count" type="number" min={1} placeholder="All remaining" value={count} onChange={(ev) => edit(setCount)(ev.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 rounded border-gray-300" checked={override} onChange={(ev) => edit(setOverride)(ev.target.checked)} />
                <span>Ignore the instructor&apos;s availability (recorded in the audit log)</span>
              </label>
              {override && (
                <div>
                  <Label htmlFor="as-reason">Reason (required)</Label>
                  <Input id="as-reason" value={reason} onChange={(ev) => edit(setReason)(ev.target.value)} placeholder="e.g. Instructor agreed to extra hours" />
                </div>
              )}
            </div>

            <Button type="button" variant="outline" onClick={preview} disabled={busy || data.instructors.length === 0}>
              {busy && !plan ? "Working…" : "Preview"}
            </Button>

            {plan && (
              <div className="space-y-3">
                <p className="text-sm">
                  {plan.instructor.name} with {plan.student.name} · {MODE_LABELS[plan.mode]} · {plan.durationMins} minutes
                </p>

                {plan.placed.length > 0 && (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class</TableHead>
                          <TableHead>Day and date</TableHead>
                          <TableHead>Time (Lagos)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan.placed.map((p) => {
                          const outside = plan.outsideAvailability.some((o) => o.sequence === p.sequence)
                          return (
                            <TableRow key={p.sequence}>
                              <TableCell>Class {p.sequence}</TableCell>
                              <TableCell>{fmtDay(lagosParts(new Date(p.startsAt)).dateKey)}</TableCell>
                              <TableCell>
                                {fmtInstantTime(p.startsAt)}–{fmtInstantTime(p.endsAt)}
                                {outside && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">outside availability</span>}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {plan.unplaced.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      <p className="font-medium">
                        {plan.placed.length === 0 ? "No classes could be placed." : `${plan.unplaced.length} class${plan.unplaced.length === 1 ? "" : "es"} could not be placed:`}
                      </p>
                      <ul className="mt-1 list-disc pl-5">
                        {plan.unplaced.map((u) => (
                          <li key={u.sequence}>Class {u.sequence}: {u.reason}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {plan.outsideAvailability.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      {plan.outsideAvailability.length} class{plan.outsideAvailability.length === 1 ? " falls" : "es fall"} outside the instructor&apos;s availability:{" "}
                      {plan.outsideAvailability.map((o) => `Class ${o.sequence} (${fmtDay(lagosParts(new Date(o.startsAt)).dateKey)} ${fmtInstantTime(o.startsAt)})`).join(", ")}.
                    </AlertDescription>
                  </Alert>
                )}

                {plan.unplaced.length > 0 && plan.placed.length > 0 && (
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-1 rounded border-gray-300" checked={allowPartial} onChange={(ev) => setAllowPartial(ev.target.checked)} />
                    <span>Schedule only the classes that fit</span>
                  </label>
                )}

                <Button type="button" onClick={commit} disabled={busy || !canCommit}>
                  {busy ? "Scheduling…" : `Schedule ${plan.placed.length} class${plan.placed.length === 1 ? "" : "es"}`}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  )
}
