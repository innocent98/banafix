"use client"

/**
 * Structured schedule-preference inputs for admin forms (walk-in registration).
 * Same contract as the public wizard: weekday keys, bands, optional HH:MM range, 1 or 2 classes
 * a week. See `validatePreferences` in lib/scheduling/preferences.ts.
 */

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TIME_BAND_LABELS } from "@/lib/assessment-vocab"
import { BANDS } from "@/lib/scheduling/bands"
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from "@/lib/scheduling/preferences"
import { cn } from "@/lib/utils"

export interface SchedulePrefsValue {
  preferredDays: string[]
  preferredTimeBands: string[]
  preferredFromTime: string
  preferredToTime: string
  preferredClassesPerWeek: 1 | 2 | ""
}

export const EMPTY_SCHEDULE_PREFS: SchedulePrefsValue = {
  preferredDays: [],
  preferredTimeBands: [],
  preferredFromTime: "",
  preferredToTime: "",
  preferredClassesPerWeek: "",
}

export function scheduleTimeError(from: string, to: string): string {
  return from && to && from >= to ? "Earliest must be before latest." : ""
}

/** Request-body fields for these preferences; empty optionals are omitted. */
export function schedulePrefsPayload(v: SchedulePrefsValue) {
  return {
    preferredDays: v.preferredDays,
    preferredTimeBands: v.preferredTimeBands,
    preferredFromTime: v.preferredFromTime || undefined,
    preferredToTime: v.preferredToTime || undefined,
    preferredClassesPerWeek: v.preferredClassesPerWeek || undefined,
  }
}

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function SchedulePreferencesFields({
  value,
  onChange,
}: {
  value: SchedulePrefsValue
  onChange: (next: SchedulePrefsValue) => void
}) {
  const patch = (p: Partial<SchedulePrefsValue>) => onChange({ ...value, ...p })
  const timeError = scheduleTimeError(value.preferredFromTime, value.preferredToTime)

  return (
    <div className="space-y-3">
      <div>
        <Label id="sp-days-label">Preferred days</Label>
        <div role="group" aria-labelledby="sp-days-label" className="mt-1 flex flex-wrap gap-1.5">
          {WEEKDAY_KEYS.map((key, i) => (
            <Chip key={key} pressed={value.preferredDays.includes(key)} onClick={() => patch({ preferredDays: toggle(value.preferredDays, key) })}>
              {WEEKDAY_LABELS[i]}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label id="sp-bands-label">Time of day</Label>
        <div role="group" aria-labelledby="sp-bands-label" className="mt-1 flex flex-wrap gap-1.5">
          {BANDS.map((band) => (
            <Chip key={band} pressed={value.preferredTimeBands.includes(band)} onClick={() => patch({ preferredTimeBands: toggle(value.preferredTimeBands, band) })}>
              {TIME_BAND_LABELS[band]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="sp-from">Earliest</Label>
          <Input id="sp-from" type="time" value={value.preferredFromTime} onChange={(e) => patch({ preferredFromTime: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="sp-to">Latest</Label>
          <Input
            id="sp-to"
            type="time"
            value={value.preferredToTime}
            aria-invalid={timeError ? true : undefined}
            onChange={(e) => patch({ preferredToTime: e.target.value })}
          />
          {timeError ? <p className="mt-1 text-xs text-destructive">{timeError}</p> : null}
        </div>
        <div>
          <Label id="sp-perweek-label">Classes per week</Label>
          <div role="radiogroup" aria-labelledby="sp-perweek-label" className="mt-1 flex gap-1.5">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value.preferredClassesPerWeek === n}
                onClick={() => patch({ preferredClassesPerWeek: value.preferredClassesPerWeek === n ? "" : n })}
                className={cn(
                  "inline-flex h-9 flex-1 items-center justify-center rounded-md border px-3 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  value.preferredClassesPerWeek === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        All optional; blank means flexible (Mon to Sat, 9am to 9pm). Each class is 45 minutes or 1 hour, agreed after the assessment.
      </p>
    </div>
  )
}
