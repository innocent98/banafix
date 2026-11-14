"use client"

/**
 * Step 2, "Who's learning?" (handoff.html:465-495).
 *
 * Stream 6: the step first asks whether the application is for the person filling it in or for a
 * child (anyone under 18). A child application makes the guardian block required (the server enforces
 * the same rule and also treats a date of birth under 18 as a child) and the student's own email
 * optional: a child with no email is registered under the guardian's mailbox, so several children of
 * one guardian can each have an application. Nothing on this step reveals whether a guardian or email
 * is already known to us.
 *
 * Round-2 audit: `dateOfBirth` feeds the birthday-email cron; optional here and on the server.
 */

import { NoteBlock, SelectableRow, StepHeading, SubHeading, TextField, SelectField } from "./fields"
import { SchedulePreferences } from "./schedule-preferences"
import { PRIOR_LEVEL_OPTIONS, type EnrollFormData } from "./types"

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
  const isChild = form.registeringFor === "child"
  const chosen = form.registeringFor !== ""

  return (
    <div>
      <StepHeading
        title="Who's learning?"
        sub="We'll only ask for what we need to arrange the assessment and first lessons."
      />

      <SubHeading title="Who is this application for?" />
      <div role="radiogroup" aria-label="Who is this application for" className="mb-6 flex flex-col gap-[11px]">
        <SelectableRow
          active={form.registeringFor === "self"}
          name="Myself"
          note="I am 18 or over"
          onSelect={() => onChange("registeringFor", "self")}
        />
        <SelectableRow
          active={isChild}
          name="My child, or someone under 18"
          note="A parent or guardian fills this in"
          onSelect={() => onChange("registeringFor", "child")}
        />
      </div>

      {chosen ? (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="firstName"
              label={isChild ? "Student's first name" : "First name"}
              placeholder="Ada"
              autoComplete={isChild ? "off" : "given-name"}
              value={form.firstName}
              onChange={(event) => onChange("firstName", event.target.value)}
            />
            <TextField
              id="lastName"
              label={isChild ? "Student's last name" : "Last name"}
              placeholder="Okafor"
              autoComplete={isChild ? "off" : "family-name"}
              value={form.lastName}
              onChange={(event) => onChange("lastName", event.target.value)}
            />
          </div>

          {isChild ? (
            <div className="mb-6 rounded-[14px] border border-bfx-hair p-5">
              <SubHeading
                title="Parent or guardian"
                sub="Required for anyone under 18. We contact them about the assessment, lessons and payments."
              />
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  id="guardianName"
                  label="Parent or guardian full name"
                  placeholder="Guardian's full name"
                  autoComplete="name"
                  value={form.guardianName}
                  onChange={(event) => onChange("guardianName", event.target.value)}
                />
                <TextField
                  id="guardianPhone"
                  label="Parent or guardian phone or WhatsApp"
                  type="tel"
                  inputMode="tel"
                  placeholder="0903 856 3822"
                  autoComplete="tel"
                  value={form.guardianPhone}
                  onChange={(event) => onChange("guardianPhone", event.target.value)}
                />
              </div>
              <TextField
                id="guardianEmail"
                label="Parent or guardian email"
                type="email"
                inputMode="email"
                placeholder="guardian@example.com"
                autoComplete="email"
                value={form.guardianEmail}
                onChange={(event) => onChange("guardianEmail", event.target.value)}
              />
              <p className="mt-[6px] text-[12.5px] text-bfx-muted">
                Applying for more than one child? Use the same guardian email for each application.
              </p>
            </div>
          ) : null}

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="email"
              label={isChild ? "Student's own email" : "Email"}
              hint={isChild ? "Optional" : undefined}
              type="email"
              inputMode="email"
              placeholder={isChild ? "Leave blank if they have none" : "you@example.com"}
              autoComplete={isChild ? "off" : "email"}
              value={form.email}
              error={emailError}
              onBlur={onEmailBlur}
              onChange={(event) => onChange("email", event.target.value)}
            />
            {isChild ? null : (
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
            )}
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              id="dateOfBirth"
              label="Date of birth"
              hint="Optional"
              type="date"
              autoComplete="bday"
              value={form.dateOfBirth}
              onChange={(event) => onChange("dateOfBirth", event.target.value)}
            />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              id="priorLevel"
              label="Current level"
              placeholder="Select the level"
              options={PRIOR_LEVEL_OPTIONS}
              value={form.priorLevel}
              onChange={(event) => onChange("priorLevel", event.target.value)}
            />
          </div>

          <SchedulePreferences form={form} onChange={onChange} />

          <NoteBlock>
            We use the date of birth to send a birthday note, and nothing else.
            {isChild
              ? " If a date of birth shows the student is 18 or over, the guardian details are simply kept as a contact."
              : " If the date of birth shows you are under 18, we will ask for a parent or guardian."}
          </NoteBlock>

          {isChild ? null : (
            <div className="mt-7 border-t border-bfx-hair pt-7">
              <SubHeading
                title="Someone else handles lessons and payments?"
                sub="Optional. Add their details if so."
              />
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField
                  id="guardianName"
                  label="Contact full name"
                  hint="Optional"
                  placeholder="Their full name"
                  value={form.guardianName}
                  onChange={(event) => onChange("guardianName", event.target.value)}
                />
                <TextField
                  id="guardianPhone"
                  label="Contact phone"
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
                label="Contact email"
                hint="Optional"
                type="email"
                inputMode="email"
                placeholder="name@example.com"
                value={form.guardianEmail}
                onChange={(event) => onChange("guardianEmail", event.target.value)}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
