"use client"

import { MODE_LABELS } from "@/lib/scheduling/mode"
import { addDays, lagosParts, type DateKey } from "@/lib/scheduling/time"
import {
  STATUS_BLOCK,
  STATUS_LABEL,
  fmtDay,
  fmtInstantTime,
  fmtMinute,
  studentName,
  todayKey,
  type AvailabilityRow,
  type TimetableSession,
} from "./shared"

const HOUR_PX = 56
const DEFAULT_FIRST_HOUR = 7
const DEFAULT_LAST_HOUR = 21

interface Placed {
  session: TimetableSession
  start: number
  end: number
  lane: number
  lanes: number
}

/** Side-by-side lanes for blocks that overlap in time (cancelled/rescheduled rows can overlap an active class). */
function layoutLanes(items: { session: TimetableSession; start: number; end: number }[]): Placed[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end)
  const out: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const flush = () => {
    const lanes = cluster.reduce((m, p) => Math.max(m, p.lane + 1), 1)
    for (const p of cluster) p.lanes = lanes
    out.push(...cluster)
    cluster = []
  }
  for (const it of sorted) {
    if (cluster.length && it.start >= clusterEnd) flush()
    const taken = new Set(cluster.filter((p) => p.end > it.start).map((p) => p.lane))
    let lane = 0
    while (taken.has(lane)) lane++
    cluster.push({ ...it, lane, lanes: 1 })
    clusterEnd = Math.max(clusterEnd, it.end)
  }
  if (cluster.length) flush()
  return out
}

interface Props {
  weekStart: DateKey
  sessions: TimetableSession[]
  availability: AvailabilityRow[]
  onSelect: (s: TimetableSession) => void
}

export function WeekGrid({ weekStart, sessions, availability, onSelect }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = todayKey()

  const perDay = days.map((key) => {
    const items = sessions
      .map((s) => {
        const p = lagosParts(new Date(s.startsAt))
        return { session: s, dateKey: p.dateKey, start: p.minuteOfDay, end: p.minuteOfDay + s.durationMins }
      })
      .filter((x) => x.dateKey === key)
    return layoutLanes(items)
  })

  // Show 07:00-21:00 by default and widen only when something falls outside it.
  let first = DEFAULT_FIRST_HOUR
  let last = DEFAULT_LAST_HOUR
  for (const day of perDay) for (const p of day) {
    first = Math.min(first, Math.floor(p.start / 60))
    last = Math.max(last, Math.min(24, Math.ceil(p.end / 60)))
  }
  for (const a of availability) {
    first = Math.min(first, Math.floor(a.startMinute / 60))
    last = Math.max(last, Math.ceil(a.endMinute / 60))
  }
  const hours = Array.from({ length: last - first }, (_, i) => first + i)
  const top = (minute: number) => ((Math.min(Math.max(minute, first * 60), last * 60) - first * 60) / 60) * HOUR_PX
  const height = (last - first) * HOUR_PX

  return (
    <div className="hidden md:block">
      <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b">
        <div />
        {days.map((key) => (
          <div key={key} className={`px-1 py-2 text-center text-xs font-semibold ${key === today ? "text-primary" : ""}`}>
            {fmtDay(key)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]">
        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span key={h} className="absolute right-1 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ top: (h - first) * HOUR_PX }}>
              {h > first ? fmtMinute(h * 60) : ""}
            </span>
          ))}
        </div>
        {days.map((key, di) => {
          const weekday = di + 1
          return (
            <div key={key} className={`relative border-l ${key === today ? "bg-primary/5" : ""}`} style={{ height }}>
              {hours.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: (h - first) * HOUR_PX }} />
              ))}

              {availability
                .filter((a) => a.weekday === weekday)
                .map((a) => (
                  <div
                    key={a.id}
                    className="absolute inset-x-0 overflow-hidden border-l-2 border-emerald-400 bg-emerald-100/70 px-1 pt-0.5 text-[10px] leading-tight text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200"
                    style={{ top: top(a.startMinute), height: top(a.endMinute) - top(a.startMinute) }}
                    title={`Available ${fmtMinute(a.startMinute)}–${fmtMinute(a.endMinute)} · ${a.location.name} · ${MODE_LABELS[a.mode]}`}
                  >
                    <span className="block truncate">{a.location.name}</span>
                    <span className="block truncate opacity-80">{MODE_LABELS[a.mode]}</span>
                  </div>
                ))}

              {perDay[di].map((p) => {
                const s = p.session
                const h = Math.max(top(p.end) - top(p.start), 20)
                const widthPct = 100 / p.lanes
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s)}
                    className={`absolute z-10 overflow-hidden rounded border-l-4 px-1 py-0.5 text-left text-[10px] leading-tight shadow-sm outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring ${STATUS_BLOCK[s.status]}`}
                    style={{ top: top(p.start), height: h - 1, left: `calc(${p.lane * widthPct}% + 2px)`, width: `calc(${widthPct}% - 4px)` }}
                    title={`${studentName(s.enrollment.student)} · ${s.enrollment.course.title} · Class ${s.sequence} · ${STATUS_LABEL[s.status]}`}
                  >
                    <span className="block truncate font-semibold">
                      {fmtInstantTime(s.startsAt)}–{fmtInstantTime(s.endsAt)}
                    </span>
                    <span className="block truncate">{studentName(s.enrollment.student)}</span>
                    {h >= 44 && (
                      <span className="block truncate opacity-80">
                        {s.enrollment.course.title} · Class {s.sequence}
                      </span>
                    )}
                    {h >= 56 && <span className="block truncate opacity-80">{STATUS_LABEL[s.status]}</span>}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
