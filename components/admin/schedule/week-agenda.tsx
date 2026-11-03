"use client"

import { Badge } from "@/components/ui/badge"
import { MODE_LABELS } from "@/lib/scheduling/mode"
import { addDays, lagosParts, type DateKey } from "@/lib/scheduling/time"
import {
  STATUS_BADGE,
  STATUS_LABEL,
  fmtDay,
  fmtInstantTime,
  fmtMinute,
  studentName,
  todayKey,
  type AvailabilityRow,
  type TimetableSession,
} from "./shared"

interface Props {
  weekStart: DateKey
  sessions: TimetableSession[]
  availability: AvailabilityRow[]
  onSelect: (s: TimetableSession) => void
}

/** Phone layout: one block per day, no grid, nothing wider than the screen. */
export function WeekAgenda({ weekStart, sessions, availability, onSelect }: Props) {
  const today = todayKey()
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: 7 }, (_, i) => {
        const key = addDays(weekStart, i)
        const windows = availability.filter((a) => a.weekday === i + 1)
        const day = sessions.filter((s) => lagosParts(new Date(s.startsAt)).dateKey === key)
        return (
          <section key={key} className="rounded-md border p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              {fmtDay(key)}
              {key === today && <Badge variant="secondary">Today</Badge>}
            </h3>
            {windows.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {windows.map((a) => (
                  <span
                    key={a.id}
                    className="max-w-full break-words rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    {fmtMinute(a.startMinute)}–{fmtMinute(a.endMinute)} · {a.location.name} · {MODE_LABELS[a.mode]}
                  </span>
                ))}
              </div>
            )}
            {day.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{windows.length ? "Free all day" : "Not available, nothing booked"}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {day.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s)}
                      className="flex w-full min-w-0 items-start justify-between gap-2 rounded-md border bg-card p-2 text-left hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className={`block text-sm font-medium ${s.status === "cancelled" || s.status === "rescheduled" ? "text-muted-foreground line-through" : ""}`}>
                          {fmtInstantTime(s.startsAt)}–{fmtInstantTime(s.endsAt)} · {studentName(s.enrollment.student)}
                        </span>
                        <span className="block break-words text-xs text-muted-foreground">
                          {s.enrollment.course.title} · Class {s.sequence}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
