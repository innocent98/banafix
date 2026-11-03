"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MODE_LABELS, type SessionMode } from "@/lib/scheduling/mode"
import { parseHHMM } from "@/lib/scheduling/bands"
import { WEEKDAY_LABELS } from "@/lib/scheduling/preferences"
import { adminFetch, fmtMinute, type AvailabilityRow, type LocationLite } from "@/components/admin/schedule/shared"

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

// type=time cannot hold 24:00, so a window that ends at midnight is edited as 23:59 and saved as 24:00.
const END_OF_DAY_INPUT = "23:59"

interface Row {
  key: string
  weekday: number
  start: string
  end: string
  locationId: string
  mode: SessionMode
}

interface Props {
  instructor: { id: string; name: string } | null
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

let rowCounter = 0
const nextKey = () => `row-${++rowCounter}`

const modeFor = (kind: LocationLite["kind"], current?: SessionMode): SessionMode =>
  kind === "ONLINE" ? "ONLINE" : current && current !== "ONLINE" ? current : "CENTRE"

/** Client-side mirror of lib/scheduling/availability-input.ts. Returns one message per weekday problem. */
function validateRows(rows: Row[]): string | null {
  const byDay = new Map<number, { s: number; e: number }[]>()
  for (const r of rows) {
    const day = DAY_NAMES[r.weekday - 1]
    const s = parseHHMM(r.start)
    const e = r.end === END_OF_DAY_INPUT ? 1440 : parseHHMM(r.end)
    if (s === null || e === null) return `${day}: enter a start and end time`
    if (s >= e) return `${day}: the start must be before the end`
    if (!r.locationId) return `${day}: choose a location`
    byDay.set(r.weekday, [...(byDay.get(r.weekday) ?? []), { s, e }])
  }
  for (const [weekday, list] of byDay) {
    list.sort((a, b) => a.s - b.s)
    for (let i = 1; i < list.length; i++) {
      if (list[i].s < list[i - 1].e) {
        const a = list[i - 1]
        const b = list[i]
        return `${DAY_NAMES[weekday - 1]} ${fmtMinute(a.s)} to ${fmtMinute(a.e)} overlaps ${fmtMinute(b.s)} to ${fmtMinute(b.e)}`
      }
    }
  }
  return null
}

function summarise(rows: Row[]): string {
  const parts: string[] = []
  for (let d = 1; d <= 7; d++) {
    const windows = rows
      .filter((r) => r.weekday === d && parseHHMM(r.start) !== null && parseHHMM(r.end) !== null)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((r) => `${r.start}–${r.end === END_OF_DAY_INPUT ? "24:00" : r.end}`)
    if (windows.length) parts.push(`${WEEKDAY_LABELS[d - 1]} ${windows.join(", ")}`)
  }
  return parts.length ? parts.join(" · ") : "No availability set"
}

export function AvailabilityEditor({ instructor, isOpen, onClose, onSaved }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [locations, setLocations] = useState<LocationLite[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isOpen || !instructor) return
    let cancelled = false
    setRows([])
    setError("")
    setLoading(true)
    ;(async () => {
      const [locs, avail] = await Promise.all([
        adminFetch<{ locations?: LocationLite[] }>("/api/admin/locations"),
        adminFetch<{ availability?: AvailabilityRow[] }>(`/api/admin/instructors/${instructor.id}/availability`),
      ])
      if (cancelled) return
      const active = (locs.data.locations ?? []).filter((l) => l.isActive)
      const existing = avail.data.availability ?? []
      // A saved window may point at a location that has since been deactivated: keep it selectable so it is not lost silently.
      const extra: LocationLite[] = existing
        .filter((a) => !active.some((l) => l.id === a.locationId))
        .map((a) => ({ id: a.locationId, name: `${a.location.name} (inactive)`, kind: a.location.kind, isActive: false }))
      setLocations([...active, ...extra.filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)])
      if (!avail.ok) setError(avail.data.error || "Failed to load availability")
      setRows(
        existing.map((a) => ({
          key: nextKey(),
          weekday: a.weekday,
          start: fmtMinute(a.startMinute),
          end: a.endMinute === 1440 ? END_OF_DAY_INPUT : fmtMinute(a.endMinute),
          locationId: a.locationId,
          mode: a.mode,
        })),
      )
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, instructor])

  const kindOf = (locationId: string) => locations.find((l) => l.id === locationId)?.kind ?? "PHYSICAL"

  const update = (key: string, patch: Partial<Row>) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const remove = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key))

  const add = (weekday: number) => {
    const dayRows = rows.filter((r) => r.weekday === weekday)
    const lastEnd = dayRows.map((r) => parseHHMM(r.end) ?? 0).sort((a, b) => b - a)[0]
    const start = dayRows.length && lastEnd < 1260 ? fmtMinute(lastEnd) : "09:00"
    const startMin = parseHHMM(start) ?? 540
    const end = fmtMinute(Math.min(startMin + 240, 1380))
    const loc = dayRows.length ? locations.find((l) => l.id === dayRows[dayRows.length - 1].locationId) : locations.find((l) => l.isActive)
    const location = loc ?? locations[0]
    setRows((prev) => [
      ...prev,
      { key: nextKey(), weekday, start, end, locationId: location?.id ?? "", mode: modeFor(location?.kind ?? "PHYSICAL") },
    ])
  }

  const problem = useMemo(() => validateRows(rows), [rows])
  const summary = useMemo(() => summarise(rows), [rows])

  const save = async () => {
    if (!instructor) return
    if (problem) {
      setError(problem)
      return
    }
    setError("")
    setSaving(true)
    const slots = rows.map((r) => ({
      weekday: r.weekday,
      start: r.start,
      end: r.end === END_OF_DAY_INPUT ? "24:00" : r.end,
      locationId: r.locationId,
      mode: r.mode,
    }))
    const res = await adminFetch<{ availability?: unknown[] }>(`/api/admin/instructors/${instructor.id}/availability`, { method: "PUT", body: { slots } })
    setSaving(false)
    if (res.ok) {
      onSaved?.()
      onClose()
    } else {
      setError(res.data.error || "Failed to save availability")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Availability{instructor ? `: ${instructor.name}` : ""}
          </DialogTitle>
          <DialogDescription>
            The weekly hours this instructor can teach, and where. Times are Lagos time. Saving replaces the whole week.
          </DialogDescription>
        </DialogHeader>

        <p className="rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
          <span className="font-medium">This week: </span>
          {summary}
        </p>

        {loading ? (
          <p className="py-6 text-center text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-3">
            {DAY_NAMES.map((name, i) => {
              const weekday = i + 1
              const dayRows = rows.filter((r) => r.weekday === weekday)
              return (
                <div key={name} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{name}</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => add(weekday)} disabled={locations.length === 0}>
                      <Plus className="mr-1 h-4 w-4" />
                      Add hours
                    </Button>
                  </div>
                  {dayRows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Not available</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {dayRows.map((r) => {
                        const kind = kindOf(r.locationId)
                        return (
                          <div key={r.key} className="flex flex-wrap items-end gap-2">
                            <div>
                              <Label className="text-xs" htmlFor={`${r.key}-s`}>From</Label>
                              <Input id={`${r.key}-s`} type="time" className="w-[120px]" value={r.start} onChange={(e) => update(r.key, { start: e.target.value })} />
                            </div>
                            <div>
                              <Label className="text-xs" htmlFor={`${r.key}-e`}>To</Label>
                              <Input id={`${r.key}-e`} type="time" className="w-[120px]" value={r.end} onChange={(e) => update(r.key, { end: e.target.value })} />
                            </div>
                            <div className="min-w-[160px] flex-1">
                              <Label className="text-xs">Location</Label>
                              <Select
                                value={r.locationId}
                                onValueChange={(v) => update(r.key, { locationId: v, mode: modeFor(kindOf(v), r.mode) })}
                              >
                                <SelectTrigger className="w-full"><SelectValue placeholder="Choose a location" /></SelectTrigger>
                                <SelectContent>
                                  {locations.map((l) => (
                                    <SelectItem key={l.id} value={l.id}>{l.name} ({l.kind === "ONLINE" ? "Online" : "Physical"})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="min-w-[140px]">
                              <Label className="text-xs">Mode</Label>
                              <Select value={r.mode} onValueChange={(v) => update(r.key, { mode: v as SessionMode })} disabled={kind === "ONLINE"}>
                                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {(kind === "ONLINE" ? (["ONLINE"] as SessionMode[]) : (["CENTRE", "HOME"] as SessionMode[])).map((m) => (
                                    <SelectItem key={m} value={m}>{MODE_LABELS[m]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => remove(r.key)} title="Remove" aria-label={`Remove ${name} hours`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {locations.length === 0 && <p className="text-xs text-muted-foreground">No active locations yet. Add one under Locations first.</p>}
          </div>
        )}

        {(error || problem) && (
          <Alert variant="destructive">
            <AlertDescription>{error || problem}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={save} disabled={saving || loading || Boolean(problem)}>
            {saving ? "Saving…" : "Save availability"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
