"use client"

/**
 * Public feedback form. Same shape as the contact form: honeypot, server-side validation echoed back per
 * field, and an honest error when the server cannot be reached. Quoting permission is an explicit,
 * unticked-by-default checkbox.
 */
import { useId, useState } from "react"

import { PillButton } from "@/components/site/primitives"
import { FEEDBACK_HONEYPOT_FIELD } from "@/lib/feedback"

const FIELD =
  "w-full rounded-xl border-[1.5px] border-bfx-border-2 bg-bfx-field px-[15px] py-[14px] text-[15px] text-bfx-ink placeholder:text-bfx-muted outline-none transition-colors focus:border-bfx-amber focus:bg-white"

type Errors = Partial<Record<"authorName" | "relationship" | "email" | "rating" | "text", string>>
type Status = "idle" | "submitting" | "success" | "error"

const EMPTY = { authorName: "", relationship: "", email: "", rating: "", text: "", allowTestimonial: false }

export function FeedbackForm() {
  const uid = useId()
  const [values, setValues] = useState(EMPTY)
  const [honeypot, setHoneypot] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [formError, setFormError] = useState("")

  const set = <K extends keyof typeof EMPTY>(field: K, value: (typeof EMPTY)[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field as keyof Errors] ? { ...prev, [field]: undefined } : prev))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "submitting") return
    setFormError("")
    setStatus("submitting")
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, [FEEDBACK_HONEYPOT_FIELD]: honeypot }),
      })
      const body = ((await res.json().catch(() => null)) ?? {}) as { error?: string; fields?: Errors }
      if (!res.ok) {
        if (body.fields) setErrors(body.fields)
        setStatus("error")
        setFormError(body.error || "We could not save your feedback. Please try again in a moment.")
        return
      }
      setValues(EMPTY)
      setStatus("success")
    } catch {
      setStatus("error")
      setFormError("We could not reach our server. Check your connection and try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-bfx-border-6 bg-bfx-surface p-8">
        <div className="rounded-2xl border border-bfx-ok-border bg-bfx-ok-bg p-6">
          <h2 className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-bfx-ok-text">Thank you</h2>
          <p className="bfx-pretty mb-6 text-[15px] leading-[1.65] text-bfx-ok-text">
            Your feedback has reached our team. We read every message.
          </p>
          <PillButton variant="ink" size="md" onClick={() => setStatus("idle")}>
            Send more feedback
          </PillButton>
        </div>
      </div>
    )
  }

  const submitting = status === "submitting"
  const invalid = (k: keyof Errors) => (errors[k] ? "border-bfx-amber" : "")

  return (
    <form noValidate onSubmit={onSubmit} className="rounded-3xl border border-bfx-border-6 bg-bfx-surface p-8">
      <h2 className="mb-[22px] text-[22px] font-bold tracking-[-0.015em] text-bfx-ink">Your feedback</h2>

      <div aria-hidden className="hidden">
        <label htmlFor={`${uid}-company`}>Company</label>
        <input
          id={`${uid}-company`}
          name={FEEDBACK_HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="mb-[14px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <Field id={`${uid}-name`} label="Your name" error={errors.authorName}>
          <input id={`${uid}-name`} name="authorName" type="text" autoComplete="name" maxLength={100} placeholder="Your name"
            value={values.authorName} onChange={(e) => set("authorName", e.target.value)}
            aria-invalid={Boolean(errors.authorName)} className={`${FIELD} ${invalid("authorName")}`} />
        </Field>
        <Field id={`${uid}-rel`} label="Your connection to Banafix (optional)" error={errors.relationship}>
          <input id={`${uid}-rel`} name="relationship" type="text" maxLength={100} placeholder="e.g. Parent of a piano student"
            value={values.relationship} onChange={(e) => set("relationship", e.target.value)}
            aria-invalid={Boolean(errors.relationship)} className={`${FIELD} ${invalid("relationship")}`} />
        </Field>
      </div>

      <div className="mb-[14px]">
        <Field id={`${uid}-email`} label="Email (optional, only if you want a reply)" error={errors.email}>
          <input id={`${uid}-email`} name="email" type="email" autoComplete="email" placeholder="Email"
            value={values.email} onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)} className={`${FIELD} ${invalid("email")}`} />
        </Field>
      </div>

      <fieldset className="mb-[14px]">
        <legend className="mb-[6px] text-[13px] font-semibold text-bfx-ink">Overall rating (optional)</legend>
        <div className="flex gap-2" role="radiogroup" aria-label="Rating from 1 to 5">
          {[1, 2, 3, 4, 5].map((n) => {
            const active = values.rating === String(n)
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set("rating", active ? "" : String(n))}
                className={`h-11 w-11 rounded-xl border-[1.5px] text-[15px] font-semibold transition-colors ${
                  active ? "border-bfx-amber bg-bfx-amber text-bfx-ink" : "border-bfx-border-2 bg-bfx-field text-bfx-ink"
                }`}
              >
                {n}
              </button>
            )
          })}
        </div>
        {errors.rating ? <p className="mt-1 text-[13px] text-bfx-ink">{errors.rating}</p> : null}
      </fieldset>

      <div className="mb-[14px]">
        <Field id={`${uid}-text`} label="Your feedback" error={errors.text}>
          <textarea id={`${uid}-text`} name="text" rows={6} maxLength={2000} placeholder="What is going well? What could be better?"
            value={values.text} onChange={(e) => set("text", e.target.value)}
            aria-invalid={Boolean(errors.text)} className={`${FIELD} resize-y ${invalid("text")}`} />
        </Field>
      </div>

      <label className="mb-5 flex items-start gap-3 text-[14px] leading-[1.5] text-bfx-body">
        <input
          type="checkbox"
          checked={values.allowTestimonial}
          onChange={(e) => set("allowTestimonial", e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0"
        />
        <span>You may quote my feedback, with my name, on the Banafix website. (Optional. We never publish without this.)</span>
      </label>

      {formError ? (
        <p role="alert" className="mb-4 rounded-xl border border-bfx-amber bg-bfx-field px-4 py-3 text-[14px] text-bfx-ink">
          {formError}
        </p>
      ) : null}

      <PillButton type="submit" variant="ink" size="md" disabled={submitting}>
        {submitting ? "Sending…" : "Send feedback"}
      </PillButton>
    </form>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-[6px] block text-[13px] font-semibold text-bfx-ink">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-[13px] text-bfx-ink">{error}</p> : null}
    </div>
  )
}
