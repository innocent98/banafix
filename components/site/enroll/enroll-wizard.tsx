"use client"

/**
 * The enrolment wizard — the handoff's `isEnroll` screen (handoff.html:440–562)
 * reconciled with the flow that actually takes money.
 *
 * Money, unchanged: the ONLY amount charged is the registration (application)
 * fee, derived from `calculateApplicationFee(course.location)`. VAT is display
 * only, on the course fee, and is never sent to the server.
 *
 * Submit, unchanged: the same POST body shape goes to `/api/enrollments`, then
 * `window.location.href = result.payment.authorization_url`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { calculateApplicationFee } from "@/lib/application-fee"
import { formatNaira } from "@/lib/site"
import { Display } from "@/components/site/primitives"

import { EnrollLoadError, EnrollSkeleton, NoCourseSelected } from "./enroll-states"
import { EnrollSummary } from "./enroll-summary"
import { PolicyDialog } from "./policy-dialog"
import { StepDetails } from "./step-details"
import { StepFormat } from "./step-format"
import { StepPayment } from "./step-payment"
import { StepProgress } from "./step-progress"
import {
  EMPTY_FORM,
  HOME_TRAINING_MODE,
  STEP_NAMES,
  type EnrollCourse,
  type EnrollFormData,
} from "./types"

/** Same rule the server applies (app/api/enrollments/route.ts:68). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Resolve the delivery mode to start on. `?mode=` comes from the course page;
 * it is validated against the course's real `availableModes` (exposed by the API
 * as `modes`) and falls back to the first mode when absent or bogus, because the
 * server rejects a `selectedMode` outside that list.
 */
function resolveMode(requested: string | null, modes: string[]): string {
  if (requested && modes.includes(requested)) return requested
  return modes[0] ?? ""
}

export function EnrollWizard() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get("courseId")
  const requestedMode = searchParams.get("mode")

  const [course, setCourse] = useState<EnrollCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<EnrollFormData>(EMPTY_FORM)
  const [emailTouched, setEmailTouched] = useState(false)
  const [showGateHint, setShowGateHint] = useState(false)
  const [policiesOpen, setPoliciesOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  const topRef = useRef<HTMLDivElement | null>(null)

  /* ---------------------------------------------------------------- fetch */

  useEffect(() => {
    if (!courseId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError("")
      try {
        const response = await fetch(`/api/courses/${courseId}`)
        const data = await response.json()
        if (cancelled) return

        if (!response.ok) {
          setLoadError(
            data?.error ||
              "This course isn't available for enrolment right now. It may have closed or moved to a new session.",
          )
          setCourse(null)
          return
        }

        const loaded = data.course as EnrollCourse
        setCourse(loaded)
        setForm((previous) => ({
          ...previous,
          selectedMode: resolveMode(requestedMode, loaded.modes ?? []),
        }))
      } catch {
        if (!cancelled) {
          setLoadError("We couldn't reach the server. Check your connection and try again.")
          setCourse(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [courseId, requestedMode, reloadToken])

  /* ---------------------------------------------------------------- money */

  const applicationFee = useMemo(
    () => (course ? calculateApplicationFee(course.location).amount : 0),
    [course],
  )

  const activeMode = form.selectedMode || (course ? resolveMode(null, course.modes ?? []) : "")

  const courseFee = course ? course.pricing?.[activeMode] ?? course.price ?? 0 : 0
  // Display only. Never charged, never sent to the server.
  const vat = Math.round(courseFee * 0.075)

  /* ------------------------------------------------------------ form state */

  const update = useCallback(
    <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => {
      setForm((previous) => ({ ...previous, [field]: value }))
      setShowGateHint(false)
    },
    [],
  )

  const toggleDay = useCallback((day: string, checked: boolean) => {
    setForm((previous) => ({
      ...previous,
      preferredDays: checked
        ? [...previous.preferredDays, day]
        : previous.preferredDays.filter((existing) => existing !== day),
    }))
  }, [])

  const selectMode = useCallback((mode: string) => {
    setForm((previous) => ({ ...previous, selectedMode: mode }))
    setShowGateHint(false)
  }, [])

  /* ------------------------------------------------------------ validation */

  const emailValid = EMAIL_REGEX.test(form.email.trim())
  const emailError = emailTouched && form.email && !emailValid ? "Enter a valid email address." : undefined

  const needsAddress = activeMode === HOME_TRAINING_MODE

  const blockedReason = useMemo(() => {
    if (step === 0) {
      if (
        !form.firstName ||
        !form.lastName ||
        !form.email ||
        !form.phone ||
        !form.priorLevel ||
        !form.schedulePreference
      ) {
        return "Fill in your name, email, phone, level and preferred day to continue."
      }
      if (!emailValid) return "Enter a valid email address to continue."
      return ""
    }

    if (step === 1) {
      if (!form.selectedMode) return "Pick a format to continue."
      if (needsAddress && (!form.address || !form.landmark)) {
        return "Home training needs an address and a nearby landmark."
      }
      if (!form.agreeToTerms || !form.agreeToRefundPolicy) {
        return "Tick both agreements to continue."
      }
      return ""
    }

    return ""
  }, [step, form, emailValid, needsAddress])

  const blocked = blockedReason !== ""

  /* ------------------------------------------------------------ navigation */

  const scrollToTop = useCallback(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    topRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    })
  }, [])

  const goBack = () => {
    setShowGateHint(false)
    setStep((previous) => Math.max(0, previous - 1))
    scrollToTop()
  }

  /* ---------------------------------------------------------------- submit */

  const submit = useCallback(async () => {
    if (!course) return

    setSubmitting(true)
    setPaymentError("")

    try {
      // Identical body shape to the outgoing flow. `selectedMode` is now a real
      // user choice rather than always falling through to `modes[0]`.
      const payload = {
        ...form,
        courseId: course.id,
        selectedMode: activeMode,
      }

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result?.payment?.authorization_url) {
        // Paystack owns the rest of the flow and returns to /enroll/success.
        window.location.href = result.payment.authorization_url
        return
      }

      setPaymentError(result?.error || result?.message || "Failed to process enrolment.")
      setSubmitting(false)
    } catch {
      setPaymentError("Network error. Check your connection and try again.")
      setSubmitting(false)
    }
  }, [course, form, activeMode])

  const handleNext = () => {
    if (blocked) {
      setShowGateHint(true)
      return
    }
    if (step < 2) {
      setStep((previous) => previous + 1)
      scrollToTop()
      return
    }
    void submit()
  }

  /* ----------------------------------------------------------------- views */

  if (!courseId) return <NoCourseSelected />
  if (loading) return <EnrollSkeleton />
  if (loadError || !course) {
    return (
      <EnrollLoadError
        message={loadError || "The selected course could not be found."}
        onRetry={() => setReloadToken((token) => token + 1)}
      />
    )
  }

  const nextLabel = step === 2 ? `Pay ${formatNaira(applicationFee)} →` : "Continue →"

  return (
    <section
      ref={topRef}
      className="mx-auto w-full max-w-[1000px] scroll-mt-[92px] px-[clamp(20px,4vw,40px)] pb-[100px] pt-14"
    >
      <header className="mb-[38px]">
        <Display
          as="h1"
          className="mb-2.5 text-[clamp(34px,4.4vw,52px)] leading-[1.04] text-bfx-ink"
        >
          Hold your spot
        </Display>
        <p className="text-[17.5px] text-bfx-body">
          Three short steps. Only the {formatNaira(applicationFee)} registration fee is due today.
        </p>
      </header>

      <StepProgress step={step} names={STEP_NAMES} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] lg:gap-[34px]">
        <div className="order-2 rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-6 sm:p-[34px] lg:order-1">
          {step === 0 ? (
            <StepDetails
              form={form}
              emailError={emailError}
              onChange={update}
              onEmailBlur={() => setEmailTouched(true)}
            />
          ) : null}

          {step === 1 ? (
            <StepFormat
              course={course}
              form={form}
              onChange={update}
              onSelectMode={selectMode}
              onToggleDay={toggleDay}
              onOpenPolicies={() => setPoliciesOpen(true)}
            />
          ) : null}

          {step === 2 ? (
            <StepPayment
              form={form}
              applicationFee={applicationFee}
              paymentError={paymentError}
              onChange={update}
              onRetry={() => void submit()}
            />
          ) : null}

          <div className="mt-[30px] border-t border-bfx-hair pt-6">
            <div className="flex items-center justify-between gap-[14px]">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="rounded-xl border-[1.5px] border-[#E1D8C9] bg-transparent px-6 py-[14px] text-[15px] font-bold text-bfx-label transition-colors hover:border-bfx-ink hover:text-bfx-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#E1D8C9] disabled:hover:text-bfx-label"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                // Not `disabled` — an aria-disabled button still takes focus and a
                // click, which is how the reason below gets shown to the student.
                aria-disabled={blocked || submitting}
                title={blockedReason || undefined}
                className={
                  "rounded-xl border-0 px-7 py-[14px] text-[15px] font-bold transition-colors " +
                  (blocked || submitting
                    ? "cursor-not-allowed bg-bfx-border-5 text-bfx-muted-2"
                    : "bg-bfx-ink text-white hover:bg-bfx-amber hover:text-bfx-ink")
                }
              >
                {submitting ? "Starting checkout…" : nextLabel}
              </button>
            </div>

            {showGateHint && blockedReason ? (
              <p role="alert" className="mt-3 text-right text-[13.5px] font-semibold text-bfx-note-text">
                {blockedReason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <EnrollSummary
            course={course}
            selectedMode={activeMode}
            courseFee={courseFee}
            vat={vat}
            applicationFee={applicationFee}
          />
        </div>
      </div>

      <PolicyDialog open={policiesOpen} onOpenChange={setPoliciesOpen} />
    </section>
  )
}
