"use client"

/**
 * Step 2 — "Pick your format" (handoff.html:497–517).
 *
 * Three departures from the handoff, all deliberate:
 *
 * 1. Two consent rows, not one. `POST /api/enrollments` rejects the request
 *    unless BOTH `agreeToTerms` and `agreeToRefundPolicy` are true
 *    (app/api/enrollments/route.ts:63). Collapsing them would either break the
 *    submit or record a consent the student never gave.
 * 2. Real per-mode prices from `course.pricing`. The handoff's ±₦5,000 deltas are
 *    design filler.
 * 3. When "Home Training" is the selected mode, the address / landmark /
 *    preferred-days block appears here, because this is where the mode is chosen.
 *    The outgoing flow put it on the details step, where it could only ever show
 *    for a course whose FIRST mode was Home Training.
 */

import type * as React from "react"

import { formatNaira } from "@/lib/site"
import {
  ConsentRow,
  DayChip,
  SelectableRow,
  StepHeading,
  SubHeading,
  TextField,
} from "./fields"
import {
  HOME_TRAINING_MODE,
  MODE_NOTES,
  WEEKDAYS,
  type EnrollCourse,
  type EnrollFormData,
} from "./types"

export function StepFormat({
  course,
  form,
  onChange,
  onSelectMode,
  onToggleDay,
  onOpenPolicies,
}: {
  course: EnrollCourse
  form: EnrollFormData
  onChange: <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => void
  onSelectMode: (mode: string) => void
  onToggleDay: (day: string, checked: boolean) => void
  onOpenPolicies: () => void
}) {
  const isHomeTraining = form.selectedMode === HOME_TRAINING_MODE

  const openPolicies = (event: React.MouseEvent) => {
    // Inside a <label>; without this the click would also toggle the checkbox.
    event.preventDefault()
    event.stopPropagation()
    onOpenPolicies()
  }

  return (
    <div>
      <StepHeading title="Pick your format" sub="This sets the course fee and where lessons happen." />

      <div role="radiogroup" aria-label="Delivery format" className="mb-6 flex flex-col gap-[11px]">
        {course.modes.map((mode) => {
          const price = course.pricing?.[mode]
          return (
            <SelectableRow
              key={mode}
              active={form.selectedMode === mode}
              name={mode}
              note={MODE_NOTES[mode]}
              trailing={price === undefined ? undefined : formatNaira(price)}
              onSelect={() => onSelectMode(mode)}
            />
          )
        })}
      </div>

      {isHomeTraining ? (
        <div className="mb-6 rounded-[14px] border border-bfx-border-5 bg-bfx-field p-5">
          <SubHeading
            title="Where should your tutor come?"
            sub="We confirm coverage and any travel fee before your first session."
          />
          <div className="mb-4">
            <TextField
              id="address"
              label="Full address"
              placeholder="House number, street name, area"
              autoComplete="street-address"
              className="bg-white"
              value={form.address}
              onChange={(event) => onChange("address", event.target.value)}
            />
          </div>
          <div className="mb-5">
            <TextField
              id="landmark"
              label="Nearest landmark"
              placeholder="e.g. Opposite First Bank"
              className="bg-white"
              value={form.landmark}
              onChange={(event) => onChange("landmark", event.target.value)}
            />
          </div>
          <fieldset>
            <legend className="mb-[7px] text-[13px] font-bold text-bfx-label">
              Preferred days <span className="font-semibold text-bfx-muted-2">— optional</span>
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEEKDAYS.map((day) => (
                <DayChip
                  key={day}
                  day={day}
                  checked={form.preferredDays.includes(day)}
                  onChange={(checked) => onToggleDay(day, checked)}
                />
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      <div className="flex flex-col gap-[11px]">
        <ConsentRow
          id="agreeToTerms"
          checked={form.agreeToTerms}
          onChange={(next) => onChange("agreeToTerms", next)}
        >
          I agree to the{" "}
          <button
            type="button"
            onClick={openPolicies}
            className="font-semibold text-bfx-bronze underline underline-offset-2 hover:text-bfx-ink"
          >
            Terms &amp; Conditions, Privacy Policy and Code of Conduct
          </button>
          . I understand my rights and responsibilities as a student.
        </ConsentRow>

        <ConsentRow
          id="agreeToRefundPolicy"
          checked={form.agreeToRefundPolicy}
          onChange={(next) => onChange("agreeToRefundPolicy", next)}
        >
          I understand the{" "}
          <button
            type="button"
            onClick={openPolicies}
            className="font-semibold text-bfx-bronze underline underline-offset-2 hover:text-bfx-ink"
          >
            refund schedule
          </button>{" "}
          and the attendance requirements for course completion.
        </ConsentRow>

        <ConsentRow
          id="consentToEmails"
          checked={form.consentToEmails}
          onChange={(next) => onChange("consentToEmails", next)}
        >
          <span className="font-semibold text-bfx-muted">Optional — </span>
          send me course updates, practice tips and offers from Banafix.
        </ConsentRow>
      </div>
    </div>
  )
}
