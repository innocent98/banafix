"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MODE_LABELS } from "@/lib/scheduling/mode"
import {
  STATUS_BADGE,
  STATUS_LABEL,
  adminFetch,
  fmtSlot,
  isoToLagosLocal,
  lagosLocalToIso,
  studentName,
  type InstructorLite,
  type TimetableSession,
} from "./shared"

interface Props {
  session: TimetableSession | null
  instructors: InstructorLite[]
  onClose: () => void
  onChanged: () => void
}

export function SessionDialog({ session, instructors, onClose, onChanged }: Props) {
  const [when, setWhen] = useState("")
  const [instructorId, setInstructorId] = useState("")
  const [duration, setDuration] = useState("60")
  const [showOverride, setShowOverride] = useState(false)
  const [override, setOverride] = useState(false)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session) return
    setWhen(isoToLagosLocal(session.startsAt))
    setInstructorId(session.instructorId)
    setDuration(String(session.durationMins))
    setShowOverride(false)
    setOverride(false)
    setReason("")
    setNote(session.notes ?? "")
    setError("")
    setBusy(false)
  }, [session])

  if (!session) return null

  const courseId = session.enrollment.course.id
  const teachers = instructors.filter((i) => i.id === session.instructorId || i.courses.some((c) => c.id === courseId))
  const started = new Date(session.startsAt).getTime() <= Date.now()
  const status = session.status

  const act = async (url: string, body: unknown, failure: string) => {
    setError("")
    setBusy(true)
    const res = await adminFetch<unknown>(url, { method: "POST", body })
    setBusy(false)
    if (res.ok) {
      onChanged()
      onClose()
      return
    }
    setError(res.data.error || failure)
    if (res.status === 422 && res.data.code === "OUTSIDE_AVAILABILITY") setShowOverride(true)
  }

  const reschedule = () => {
    const startsAt = lagosLocalToIso(when)
    if (!startsAt) {
      setError("Choose the new date and time")
      return
    }
    if (override && !reason.trim()) {
      setError("Say why the instructor is being booked outside their availability")
      return
    }
    void act(
      `/api/admin/sessions/${session.id}/reschedule`,
      {
        startsAt,
        instructorId: instructorId && instructorId !== session.instructorId ? instructorId : undefined,
        durationMins: Number(duration),
        ...(override ? { overrideAvailability: true, overrideReason: reason.trim() } : {}),
      },
      "Failed to reschedule the class",
    )
  }

  const setStatus = (to: "held" | "missed" | "cancelled" | "scheduled") => {
    if (to === "cancelled" && !confirm(`Cancel Class ${session.sequence}? This frees the class number so it can be scheduled again.`)) return
    void act(`/api/admin/sessions/${session.id}/status`, { status: to, note: note.trim() ? note.trim() : undefined }, "Failed to update the class")
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Class {session.sequence}
            <span className={`rounded px-2 py-0.5 text-xs font-normal ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
          </DialogTitle>
          <DialogDescription>{fmtSlot(session.startsAt, session.endsAt)} (Lagos time)</DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Student</dt>
          <dd className="break-words font-medium">{studentName(session.enrollment.student)}</dd>
          <dt className="text-muted-foreground">Course</dt>
          <dd className="break-words">{session.enrollment.course.title}</dd>
          <dt className="text-muted-foreground">Instructor</dt>
          <dd>{session.instructor.name}</dd>
          <dt className="text-muted-foreground">Where</dt>
          <dd>
            {session.location?.name ? `${session.location.name} · ` : ""}
            {MODE_LABELS[session.mode]}
          </dd>
          <dt className="text-muted-foreground">Length</dt>
          <dd>{session.durationMins} minutes</dd>
          {session.notes && (
            <>
              <dt className="text-muted-foreground">Note</dt>
              <dd className="break-words">{session.notes}</dd>
            </>
          )}
        </dl>

        {status === "scheduled" && (
          <section className="space-y-3 rounded-md border p-3">
            <h3 className="text-sm font-semibold">Reschedule</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="rs-when">New date and time (Lagos)</Label>
                <Input id="rs-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              </div>
              <div>
                <Label>Instructor</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Length</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showOverride ? (
              <div className="space-y-2 rounded-md bg-amber-50 p-2 dark:bg-amber-950/40">
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1 rounded border-gray-300" checked={override} onChange={(e) => setOverride(e.target.checked)} />
                  <span>Book outside the instructor&apos;s availability anyway (recorded in the audit log)</span>
                </label>
                {override && (
                  <div>
                    <Label htmlFor="rs-reason">Reason (required)</Label>
                    <Input id="rs-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Instructor agreed to cover on request" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">An instructor or student who already has a class at that time can never be double-booked.</p>
              </div>
            ) : (
              <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setShowOverride(true)}>
                Need a time outside their availability?
              </button>
            )}

            <Button type="button" onClick={reschedule} disabled={busy}>
              {busy ? "Saving…" : "Reschedule"}
            </Button>
          </section>
        )}

        {(status === "scheduled" || status === "held" || status === "missed") && (
          <section className="space-y-3 rounded-md border p-3">
            <h3 className="text-sm font-semibold">Outcome</h3>
            <div>
              <Label htmlFor="st-note">Note (optional)</Label>
              <Textarea id="st-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {status === "scheduled" && (
                <>
                  <Button type="button" variant="outline" disabled={busy || !started} onClick={() => setStatus("held")} title={started ? undefined : "Available once the class has started"}>
                    Mark held
                  </Button>
                  <Button type="button" variant="outline" disabled={busy || !started} onClick={() => setStatus("missed")} title={started ? undefined : "Available once the class has started"}>
                    Mark missed
                  </Button>
                  <Button type="button" variant="outline" disabled={busy} onClick={() => setStatus("cancelled")}>
                    Cancel class
                  </Button>
                </>
              )}
              {status === "held" && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => setStatus("missed")}>Change to missed</Button>
              )}
              {status === "missed" && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => setStatus("held")}>Change to held</Button>
              )}
              {(status === "held" || status === "missed") && (
                <Button type="button" variant="outline" disabled={busy} onClick={() => setStatus("scheduled")}>Revert to scheduled</Button>
              )}
            </div>
            {status === "scheduled" && (
              <p className="text-xs text-muted-foreground">
                Held and missed unlock once the class has started. Cancelling frees class number {session.sequence} so it can be scheduled again; a missed class keeps its number.
              </p>
            )}
          </section>
        )}

        {(status === "cancelled" || status === "rescheduled") && (
          <p className="text-sm text-muted-foreground">
            {status === "rescheduled" ? "This class was moved; the new time appears on the timetable." : "This class was cancelled and its number is free to schedule again."}
          </p>
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
