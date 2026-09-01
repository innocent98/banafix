"use client"

/**
 * Step 1 — "Who's learning?" (handoff.html:465–495).
 *
 * The handoff shows five fields. The server and the admin UI need more, so this
 * step also carries the guardian block that the outgoing
 * `components/enrollment/student-details-form.tsx` collected. The handoff's amber
 * note has been reworded accordingly: it promised the guardian ask on "the next
 * step", which is not where those fields live.
 */

import { NoteBlock, StepHeading, SubHeading, TextField, SelectField } from "./fields"
import { PRIOR_LEVEL_OPTIONS, SCHEDULE_OPTIONS, type EnrollFormData } from "./types"

export function StepDetails({
  form,
  emailError,
  onChange,
  onEmailBlur,
}: {
  form: EnrollFormData
  emailError?: string
  onChange: <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => void
  onEmailBlur: () => void
}) {
  return (
    <div>
      <StepHeading
        title="Who's learning?"
        sub="We'll only ask for what we need to schedule your first lesson."
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="First name"
          placeholder="Ada"
          autoComplete="given-name"
          value={form.firstName}
          onChange={(event) => onChange("firstName", event.target.value)}
        />
        <TextField
          id="lastName"
          label="Last name"
          placeholder="Okafor"
          autoComplete="family-name"
          value={form.lastName}
          onChange={(event) => onChange("lastName", event.target.value)}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="email"
          label="Email"
          type="email"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          error={emailError}
          onBlur={onEmailBlur}
          onChange={(event) => onChange("email", event.target.value)}
        />
        <TextField
          id="phone"
          label="Phone or WhatsApp"
          type="tel"
          inputMode="tel"
          placeholder="0903 856 3822"
          autoComplete="tel"
          value={form.phone}
          onChange={(event) => onChange("phone", event.target.value)}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          id="priorLevel"
          label="Current level"
          placeholder="Select your level"
          options={PRIOR_LEVEL_OPTIONS}
          value={form.priorLevel}
          onChange={(event) => onChange("priorLevel", event.target.value)}
        />
        <SelectField
          id="schedulePreference"
          label="Preferred day"
          placeholder="Select a preference"
          options={SCHEDULE_OPTIONS}
          value={form.schedulePreference}
          onChange={(event) => onChange("schedulePreference", event.target.value)}
        />
      </div>

      <NoteBlock>
        Student under 18? Add a guardian's contact below so we know who to reach about lessons and
        payments.
      </NoteBlock>

      <div className="mt-7 border-t border-bfx-hair pt-7">
        <SubHeading
          title="Guardian details"
          sub="Optional — required only if the student is under 18."
        />
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id="guardianName"
            label="Guardian full name"
            hint="Optional"
            placeholder="Guardian's full name"
            value={form.guardianName}
            onChange={(event) => onChange("guardianName", event.target.value)}
          />
          <TextField
            id="guardianPhone"
            label="Guardian phone"
            hint="Optional"
            type="tel"
            inputMode="tel"
            placeholder="0903 856 3822"
            value={form.guardianPhone}
            onChange={(event) => onChange("guardianPhone", event.target.value)}
          />
        </div>
        <TextField
          id="guardianEmail"
          label="Guardian email"
          hint="Optional"
          type="email"
          inputMode="email"
          placeholder="guardian@example.com"
          value={form.guardianEmail}
          onChange={(event) => onChange("guardianEmail", event.target.value)}
        />
      </div>
    </div>
  )
}
