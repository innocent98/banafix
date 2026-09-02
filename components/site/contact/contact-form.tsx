"use client"

/**
 * "Send a message" card — `isContact` in "Banafix Redesign.dc.html" (handoff
 * lines 589–602). The handoff's form is decorative; this one posts to
 * `POST /api/contact` and reports what actually happened.
 *
 * Deliberately hand-rolled rather than React Hook Form + Zod: neither is in
 * `package.json`, and adding ~14kb of client JS to the only form on the public
 * site is not worth it. Validation is shared with the API route through
 * `lib/contact-message.ts`, so the two cannot drift.
 *
 * Field treatment is the handoff's: `bg-bfx-field`, 1.5px `bfx-border-2`,
 * 12px radius, and its `style-focus` (amber border + white fill).
 */
import { useId, useState } from "react"

import { PillAnchor, PillButton } from "@/components/site/primitives"
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_LIMITS,
  CONTACT_SUBJECTS,
  CONTACT_SUBJECT_PLACEHOLDER,
  validateContactMessage,
  type ContactFieldErrors,
  type ContactMessageInput,
} from "@/lib/contact-message"
import { SITE_EMAIL, SITE_EMAIL_MAILTO, SITE_PHONE_DISPLAY, SITE_WHATSAPP } from "@/lib/site"

const FIELD =
  "w-full rounded-xl border-[1.5px] border-bfx-border-2 bg-bfx-field px-[15px] py-[14px] text-[15px] text-bfx-ink placeholder:text-bfx-muted outline-none transition-colors focus:border-bfx-amber focus:bg-white"

const FIELD_INVALID = "border-bfx-amber"

const EMPTY: ContactMessageInput = { name: "", phone: "", email: "", subject: "", message: "" }

type Status = "idle" | "submitting" | "success" | "error"

export function ContactForm({ initialSubject = "" }: { initialSubject?: string }) {
  const uid = useId()
  const [values, setValues] = useState<ContactMessageInput>({ ...EMPTY, subject: initialSubject })
  const [honeypot, setHoneypot] = useState("")
  const [errors, setErrors] = useState<ContactFieldErrors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState("")

  const set = (field: keyof ContactMessageInput) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Clear a field's error the moment the visitor starts fixing it.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "submitting") return

    setFormError("")

    const check = validateContactMessage(values)
    if (!check.ok) {
      setErrors(check.errors)
      setStatus("error")
      setFormError("Please check the highlighted fields.")
      return
    }

    setErrors({})
    setStatus("submitting")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...check.value, [CONTACT_HONEYPOT_FIELD]: honeypot }),
      })

      const payload: unknown = await res.json().catch(() => null)
      const body = (payload ?? {}) as { error?: string; fields?: ContactFieldErrors }

      if (!res.ok) {
        if (body.fields) setErrors(body.fields)
        setStatus("error")
        setFormError(
          body.error ||
            `We could not send your message. Please WhatsApp ${SITE_PHONE_DISPLAY} or email ${SITE_EMAIL}.`,
        )
        return
      }

      setValues({ ...EMPTY })
      setStatus("success")
    } catch {
      setStatus("error")
      setFormError(
        `We could not reach our server. Check your connection, or WhatsApp ${SITE_PHONE_DISPLAY}.`,
      )
    }
  }

  if (status === "success") {
    return (
      <div className="mb-[34px] rounded-3xl border border-bfx-border-6 bg-bfx-surface p-8">
        <div className="rounded-2xl border border-bfx-ok-border bg-bfx-ok-bg p-6">
          <h2 className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-bfx-ok-text">
            Message sent
          </h2>
          <p className="bfx-pretty mb-6 text-[15px] leading-[1.65] text-bfx-ok-text">
            It has landed in our inbox. We answer within the hour on weekdays. Check your email,
            including the spam folder.
          </p>
          <div className="flex flex-wrap gap-3">
            <PillButton variant="ink" size="md" onClick={() => setStatus("idle")}>
              Send another message
            </PillButton>
            <PillAnchor
              href={SITE_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlineSoft"
              size="md"
            >
              Or WhatsApp us
            </PillAnchor>
          </div>
        </div>
      </div>
    )
  }

  const submitting = status === "submitting"

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mb-[34px] rounded-3xl border border-bfx-border-6 bg-bfx-surface p-8"
    >
      <h2 className="mb-[22px] text-[22px] font-bold tracking-[-0.015em] text-bfx-ink">
        Send a message
      </h2>

      {/* Honeypot. Hidden from sight and from assistive tech; a bot fills it. */}
      <div aria-hidden className="hidden">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input
          id={`${uid}-company`}
          name={CONTACT_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="mb-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <Field
          id={`${uid}-name`}
          label="Your name"
          error={errors.name}
          input={
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              autoComplete="name"
              maxLength={CONTACT_LIMITS.name}
              placeholder="Your name"
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${uid}-name-error` : undefined}
              className={`${FIELD} ${errors.name ? FIELD_INVALID : ""}`}
            />
          }
        />
        <Field
          id={`${uid}-phone`}
          label="Phone (optional)"
          error={errors.phone}
          input={
            <input
              id={`${uid}-phone`}
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={CONTACT_LIMITS.phone}
              placeholder="Phone"
              value={values.phone}
              onChange={(e) => set("phone")(e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
              className={`${FIELD} ${errors.phone ? FIELD_INVALID : ""}`}
            />
          }
        />
      </div>

      <div className="mb-[14px]">
        <Field
          id={`${uid}-email`}
          label="Email"
          error={errors.email}
          input={
            <input
              id={`${uid}-email`}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={CONTACT_LIMITS.email}
              placeholder="Email"
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${uid}-email-error` : undefined}
              className={`${FIELD} ${errors.email ? FIELD_INVALID : ""}`}
            />
          }
        />
      </div>

      <div className="mb-[14px]">
        <Field
          id={`${uid}-subject`}
          label="What's this about?"
          error={errors.subject}
          input={
            <select
              id={`${uid}-subject`}
              name="subject"
              value={values.subject}
              onChange={(e) => set("subject")(e.target.value)}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? `${uid}-subject-error` : undefined}
              className={`${FIELD} ${errors.subject ? FIELD_INVALID : ""} ${
                values.subject ? "" : "text-bfx-muted"
              }`}
            >
              <option value="">{CONTACT_SUBJECT_PLACEHOLDER}</option>
              {CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          }
        />
      </div>

      <div className="mb-[18px]">
        <Field
          id={`${uid}-message`}
          label="Your message"
          error={errors.message}
          input={
            <textarea
              id={`${uid}-message`}
              name="message"
              rows={4}
              maxLength={CONTACT_LIMITS.message}
              placeholder="Tell us what you'd like to learn"
              value={values.message}
              onChange={(e) => set("message")(e.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${uid}-message-error` : undefined}
              className={`${FIELD} min-h-[120px] resize-y font-body ${
                errors.message ? FIELD_INVALID : ""
              }`}
            />
          }
        />
      </div>

      {formError ? (
        // The handoff's amber note block, reused as the form-level error.
        <div
          role="alert"
          className="mb-[18px] rounded-xl border border-bfx-note-border bg-bfx-note-bg px-4 py-3 text-[14px] leading-[1.55] text-bfx-note-text"
        >
          {formError}{" "}
          <a href={SITE_EMAIL_MAILTO} className="font-bold underline underline-offset-2">
            {SITE_EMAIL}
          </a>
        </div>
      ) : null}

      <PillButton
        type="submit"
        variant="ink"
        size="block"
        className="rounded-xl"
        disabled={submitting}
      >
        {submitting ? "Sending…" : "Send message"}
      </PillButton>
    </form>
  )
}

/**
 * The handoff labels its fields with placeholders only, which leaves screen
 * readers with nothing once the field has a value — so the real label is
 * present but visually hidden, and the placeholder stays exactly as designed.
 */
function Field({
  id,
  label,
  error,
  input,
}: {
  id: string
  label: string
  error?: string
  input: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {input}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[13px] font-semibold text-bfx-note-text">
          {error}
        </p>
      ) : null}
    </div>
  )
}
