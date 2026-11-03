"use client"

/**
 * "When would you like your classes?" — structured schedule preferences for wizard step 2.
 *
 * Replaces the old single "Preferred time" select. Everything here is optional: a student who
 * gives nothing is treated as flexible (Mon to Sat, 9am to 9pm) by the scheduler. The values are
 * the contract with `validatePreferences` in lib/scheduling/preferences.ts:
 * weekday keys ('mon'..'sun'), bands ('morning' | 'afternoon' | 'evening'), 'HH:MM' times and
 * 1 or 2 classes a week.
 */

import { TIME_BAND_LABELS } from "@/lib/assessment-vocab"
import { BANDS, type Band } from "@/lib/scheduling/bands"
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from "@/lib/scheduling/preferences"
import { cn } from "@/lib/utils"

import { SelectableRow, SubHeading, TextField } from "./fields"
import type { EnrollFormData } from "./types"

/** Inline error when both times are set and the earliest is not before the latest. */
export function scheduleTimeError(from: string, to: string): string {
  return from && to && from >= to ? "Earliest must be before latest." : ""
}

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl px-3 py-2 text-center text-[13.5px] font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-surface",
        pressed
          ? "bg-bfx-note-bg text-bfx-ink shadow-[inset_0_0_0_1.5px_var(--bfx-amber)]"
          : "bg-bfx-field text-bfx-body shadow-[inset_0_0_0_1px_var(--bfx-border)] hover:shadow-[inset_0_0_0_1px_var(--bfx-border-2)]",
      )}
    >
      {children}
    </button>
  )
}

function GroupLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mb-[7px] text-[13px] font-bold text-bfx-label">
      {children}
    </p>
  )
}

export function SchedulePreferences({
  form,
  onChange,
}: {
  form: EnrollFormData
  onChange: <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => void
}) {
  const timeError = scheduleTimeError(form.preferredFromTime, form.preferredToTime)

  return (
    <div className="mb-6">
      <SubHeading
        title="When would you like your classes?"
        sub="Optional. Tell us what suits you and we will fit your lessons around it. If you leave this blank we treat you as flexible."
      />

      <div className="mb-5">
        <GroupLabel id="pref-days-label">Days</GroupLabel>
        <div
          role="group"
          aria-labelledby="pref-days-label"
          className="grid grid-cols-4 gap-2 sm:grid-cols-7"
        >
          {WEEKDAY_KEYS.map((key, index) => (
            <Chip
              key={key}
              pressed={form.preferredDays.includes(key)}
              onClick={() => onChange("preferredDays", toggle(form.preferredDays, key))}
            >
              {WEEKDAY_LABELS[index]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <GroupLabel id="pref-bands-label">Time of day</GroupLabel>
        <div
          role="group"
          aria-labelledby="pref-bands-label"
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {BANDS.map((band: Band) => (
            <Chip
              key={band}
              pressed={form.preferredTimeBands.includes(band)}
              onClick={() => onChange("preferredTimeBands", toggle(form.preferredTimeBands, band))}
            >
              {TIME_BAND_LABELS[band]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="preferredFromTime"
          label="Earliest"
          hint="Optional"
          type="time"
          value={form.preferredFromTime}
          onChange={(event) => onChange("preferredFromTime", event.target.value)}
        />
        <TextField
          id="preferredToTime"
          label="Latest"
          hint="Optional"
          type="time"
          value={form.preferredToTime}
          error={timeError}
          onChange={(event) => onChange("preferredToTime", event.target.value)}
        />
      </div>

      <div>
        <GroupLabel id="pref-perweek-label">Classes per week</GroupLabel>
        <div
          role="radiogroup"
          aria-labelledby="pref-perweek-label"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          {([1, 2] as const).map((count) => (
            <SelectableRow
              key={count}
              active={form.preferredClassesPerWeek === count}
              name={count === 1 ? "1 class a week" : "2 classes a week"}
              onSelect={() =>
                onChange("preferredClassesPerWeek", form.preferredClassesPerWeek === count ? "" : count)
              }
            />
          ))}
        </div>
        <p className="mt-2 text-[13px] text-bfx-muted">
          Each class is 45 minutes or 1 hour; we agree this with you after your assessment.
        </p>
      </div>
    </div>
  )
}
