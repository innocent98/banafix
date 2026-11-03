"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDays, lagosParts } from "@/lib/scheduling/time"
import { AssignDialog } from "@/components/admin/schedule/assign-dialog"
import { ScheduleLegend } from "@/components/admin/schedule/legend"
import { NeedsSchedulingPanel } from "@/components/admin/schedule/needs-scheduling-panel"
import { SessionDialog } from "@/components/admin/schedule/session-dialog"
import { WeekAgenda } from "@/components/admin/schedule/week-agenda"
import { WeekGrid } from "@/components/admin/schedule/week-grid"
import {
  adminFetch,
  mondayOf,
  todayKey,
  weekLabel,
  type InstructorLite,
  type TimetableResponse,
  type TimetableSession,
} from "@/components/admin/schedule/shared"

function SchedulePageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [instructors, setInstructors] = useState<InstructorLite[]>([])
  const [instructorId, setInstructorId] = useState("")
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayKey()))
  const [timetable, setTimetable] = useState<TimetableResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [selected, setSelected] = useState<TimetableSession | null>(null)
  const [assignFor, setAssignFor] = useState<string | null>(params.get("enrollmentId"))

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    adminFetch<{ instructors?: InstructorLite[] }>("/api/admin/instructors").then((res) => {
      if (!res.ok) return setError(res.data.error || "Failed to load instructors")
      const list = res.data.instructors ?? []
      setInstructors(list)
      setInstructorId((cur) => cur || list[0]?.id || "")
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const qs = new URLSearchParams({ from: weekStart, to: addDays(weekStart, 6) })
    if (instructorId) qs.set("instructorId", instructorId)
    adminFetch<Partial<TimetableResponse>>(`/api/admin/schedule?${qs}`).then((res) => {
      if (cancelled) return
      setLoading(false)
      if (!res.ok) {
        setError(res.data.error || "Failed to load the timetable")
        return
      }
      setError("")
      setTimetable({ sessions: res.data.sessions ?? [], availability: res.data.availability ?? [], needsScheduling: res.data.needsScheduling ?? [] })
    })
    return () => {
      cancelled = true
    }
  }, [instructorId, weekStart, refreshKey])

  const closeAssign = () => {
    setAssignFor(null)
    if (params.get("enrollmentId")) router.replace("/admin/schedule")
  }

  const onScheduled = (assignedInstructorId: string, firstStartsAt: string) => {
    setInstructorId(assignedInstructorId)
    setWeekStart(mondayOf(lagosParts(new Date(firstStartsAt)).dateKey))
    refresh()
  }

  const sessions = timetable?.sessions ?? []
  const availability = timetable?.availability ?? []

  return (
    <AdminLayout>
      <div className="min-w-0 space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="h-6 w-6" />
            Schedule
          </h1>
          <p className="text-sm text-muted-foreground">Weekly timetable per instructor. All times are Lagos time.</p>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="sm:w-64">
                <Label>Instructor</Label>
                <Select value={instructorId} onValueChange={setInstructorId}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choose an instructor" /></SelectTrigger>
                  <SelectContent>
                    {instructors.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(mondayOf(todayKey()))}>
                  This week
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm font-medium" aria-live="polite">{weekLabel(weekStart)}</p>
            <ScheduleLegend />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {instructors.length === 0 && !loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No instructors yet. Add one on the Instructors page.</p>
            ) : (
              <div className={loading ? "opacity-60" : ""}>
                {instructorId && availability.length === 0 && !loading && (
                  <p className="mb-2 text-xs text-muted-foreground">No availability set for this instructor. Set it from the Instructors page.</p>
                )}
                <WeekGrid weekStart={weekStart} sessions={sessions} availability={availability} onSelect={setSelected} />
                <WeekAgenda weekStart={weekStart} sessions={sessions} availability={availability} onSelect={setSelected} />
              </div>
            )}
          </CardContent>
        </Card>

        <NeedsSchedulingPanel items={timetable?.needsScheduling ?? []} onSchedule={setAssignFor} />
      </div>

      <SessionDialog session={selected} instructors={instructors} onClose={() => setSelected(null)} onChanged={refresh} />
      <AssignDialog enrollmentId={assignFor} onClose={closeAssign} onScheduled={onScheduled} />
    </AdminLayout>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <SchedulePageInner />
    </Suspense>
  )
}
