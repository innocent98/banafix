"use client"

/**
 * The enrolment wizard — the handoff's `isEnroll` screen (handoff.html:440–562)
 * reconciled with the flow that actually takes money.
 *
 * Money: the ONLY amount charged is the assessment fee, `Location.assessmentFee` of the
 * chosen offering's location. The server recomputes it from the offering and returns it as
 * `applicationFee.amount`; the figure shown here is the same value from the course payload.
 * No tuition is shown or charged: it is agreed after the assessment.
 *
 * Steps: 1 Assessment (location · format · arrangement · preferred date/time) -> 2 Your details
 * -> 3 Consents + pay. Submit POSTs `/api/enrollments` with `offeringId`, then
 * `window.location.href = result.payment.authorization_url`. The response has the same shape for
 * every applicant; for a student whose assessment fee is already covered the URL is the site's own
 * "application received" page instead of Paystack's.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

import { isArrangement } from "@/lib/assessment-vocab"
import { isCourseExpired } from "@/lib/course-utils"
import { formatNaira } from "@/lib/site"
import { Display } from "@/components/site/primitives"

import {
  CourseUnavailable,
  EnrollLoadError,
  EnrollSkeleton,
  NoCourseSelected,
} from "./enroll-states"
import { EnrollSummary } from "./enroll-summary"
import { PolicyDialog } from "./policy-dialog"
import { scheduleTimeError } from "./schedule-preferences"
import { StepDetails } from "./step-details"
import { StepAssessment, arrangementsFor, defaultArrangement } from "./step-assessment"
import { StepPayment } from "./step-payment"
import { StepProgress } from "./step-progress"
import {
  EMPTY_FORM,
  STEP_NAMES,
  type EnrollCourse,
  type EnrollFormData,
} from "./types"

/** Same rule the server applies (app/api/enrollments/route.ts:68). */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GATE_HINT_ID = "enroll-gate-hint"

/**
 * The preconditions `POST /api/enrollments` enforces that the course payload already lets us
 * check. Without this the student fills every step and meets the refusal on the Pay button.
 */
function unavailableReason(course: EnrollCourse): { headline: string; body: string } | null {
  if (isCourseExpired(course.sessionStartDate)) {
    return {
      headline: "Enrolment has closed",
      body: "This session has already started, so we are no longer taking enrolments for it. Browse the other courses, or ask us when the next session opens.",
    }
  }
  if (course.offerings.length === 0) {
    return {
      headline: "Enrolment opening soon",
      body: "This course is not open for enrolment yet. Ask us and we will tell you as soon as it opens.",
    }
  }
  return null
}

/**
 * The server answers with a bare sentence in `{ error }`. These are the ones a
 * student can act on, so they get an action rather than a "Try again" that would
 * fail identically.
 */
function describeServerError(message: string): { text: string; retryable: boolean } {
  const known: Record<string, string> = {
    "You are already enrolled in this course":
      "You already have a place on this course. Check the confirmation email we sent you, or contact us if you cannot find it.",
    "You already have an application for this course in progress":
      "You already have an application for this course in progress. Check the email we sent you, or contact us if you cannot find it.",
    "Course enrollment has expired":
      "Enrolment for this session closed while you were filling this in. Ask us when the next session opens.",
    "Course is not available for enrollment":
      "This course is no longer open for enrolment. Browse the other courses, or ask us about it.",
    "This format is not currently open for enrolment at that location":
      "That format is no longer open at that location. Go back to the first step and pick another one.",
    "Home assessments need an address":
      "Home assessments need an address. Go back to the first step and add it.",
    "Invalid email format": "Check your email address, then try again.",
  }
  const text = known[message]
  return text ? { text, retryable: false } : { text: message, retryable: true }
}

export function EnrollWizard() {
  const searchParams = useSearchParams()
  const courseId = searchParams.get("courseId")
  const requestedOfferingId = searchParams.get("offeringId")

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
  const [paymentRetryable, setPaymentRetryable] = useState(true)
  // Set when the server found the assessment fee already paid by this student: no checkout.

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
        // `?offeringId=` comes from the course page. It is only honoured when it is still
        // offerable; otherwise the student picks a location and format themselves.
        const requested = loaded.offerings.find((offering) => offering.id === requestedOfferingId)
        setForm((previous) => ({
          ...previous,
          offeringId: requested?.id ?? "",
          arrangement: requested ? defaultArrangement(requested.location.kind) : "",
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
  }, [courseId, requestedOfferingId, reloadToken])

  /* ---------------------------------------------------------------- money */

  const offering = useMemo(
    () => course?.offerings.find((candidate) => candidate.id === form.offeringId) ?? null,
    [course, form.offeringId],
  )
  // `null` until a location is chosen: the fee is that location's, never a default.
  const applicationFee = offering ? offering.location.assessmentFee : null

  /* ------------------------------------------------------------ form state */

  const update = useCallback(
    <K extends keyof EnrollFormData>(field: K, value: EnrollFormData[K]) => {
      setForm((previous) => ({ ...previous, [field]: value }))
      setShowGateHint(false)
    },
    [],
  )

  const selectOffering = useCallback(
    (offeringId: string) => {
      const chosen = course?.offerings.find((candidate) => candidate.id === offeringId) ?? null
      setForm((previous) => {
        // Keep the arrangement when it is still valid at the new location, else re-default it.
        const allowed = chosen ? arrangementsFor(chosen.location.kind) : []
        const keep = previous.arrangement !== "" && allowed.includes(previous.arrangement)
        return {
          ...previous,
          offeringId,
          arrangement: chosen
            ? keep
              ? previous.arrangement
              : defaultArrangement(chosen.location.kind)
            : "",
        }
      })
      setShowGateHint(false)
    },
    [course],
  )

  /* ------------------------------------------------------------ validation */

  const trimmedEmail = form.email.trim()
  const emailValid = EMAIL_REGEX.test(trimmedEmail)
  const emailError = emailTouched && form.email && !emailValid ? "Enter a valid email address." : undefined

  const needsAddress = form.arrangement === "HOME"

  const blockedReason = useMemo(() => {
    if (step === 0) {
      if (!offering) return "Pick a location and a format to continue."
      if (!isArrangement(form.arrangement)) return "Choose how you would like the assessment done."
      if (needsAddress && (!form.address.trim() || !form.landmark.trim())) {
        return "A home assessment needs an address and a nearby landmark."
      }
      return ""
    }

    if (step === 1) {
      if (
        !form.firstName.trim() ||
        !form.lastName.trim() ||
        !form.email.trim() ||
        !form.phone.trim() ||
        !form.priorLevel
      ) {
        return "Fill in your name, email, phone and current level to continue."
      }
      if (scheduleTimeError(form.preferredFromTime, form.preferredToTime)) {
        return "Your earliest class time must be before your latest."
      }
      if (!emailValid) return "Enter a valid email address to continue."
      return ""
    }

    if (step === 2) {
      if (!form.agreeToTerms || !form.agreeToRefundPolicy) {
        return "Tick both agreements to continue."
      }
      return ""
    }

    return ""
  }, [step, form, emailValid, needsAddress, offering])

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
    setPaymentRetryable(true)

    try {
      // `offeringId` identifies location + format; the server derives the rest (and the fee).
      // `email` is sent trimmed because the server runs its regex on the raw string while the
      // client validates the trimmed one; a trailing space used to pass the gate here and come
      // back as an undiagnosable "Invalid email format" 400. Empty optional assessment fields
      // are omitted rather than sent as "".
      // Schedule preferences are structured: days as 'mon'.., bands, optional HH:MM range and
      // classes per week (omitted when empty).
      const payload = {
        ...form,
        email: form.email.trim(),
        courseId: course.id,
        preferredDate: form.preferredDate || undefined,
        preferredTimeBand: form.preferredTimeBand || undefined,
        preferredFromTime: form.preferredFromTime || undefined,
        preferredToTime: form.preferredToTime || undefined,
        preferredClassesPerWeek: form.preferredClassesPerWeek || undefined,
      }

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok && result?.payment?.authorization_url) {
        // Paystack (or the site's own received page) owns the rest of the flow.
        window.location.href = result.payment.authorization_url
        return
      }

      const raw = result?.error || result?.message || ""
      const described = raw
        ? describeServerError(raw)
        : { text: "We couldn't start your payment. Please try again.", retryable: true }
      setPaymentError(described.text)
      setPaymentRetryable(described.retryable)
      setSubmitting(false)
    } catch {
      setPaymentError("We couldn't reach the server. Check your connection and try again.")
      setPaymentRetryable(true)
      setSubmitting(false)
    }
  }, [course, form])

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

  // Checked after the course resolves and before the first step renders, so the
  // student never fills a form the server was always going to refuse.
  const unavailable = unavailableReason(course)
  if (unavailable) {
    return (
      <CourseUnavailable
        courseTitle={course.title}
        headline={unavailable.headline}
        body={unavailable.body}
      />
    )
  }

  const nextLabel =
    step === 2 && applicationFee !== null ? `Pay ${formatNaira(applicationFee)} →` : "Continue →"

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
          Book your assessment
        </Display>
        <p className="text-[17.5px] text-bfx-body">
          Three short steps. The assessment fee
          {applicationFee === null ? "" : ` (${formatNaira(applicationFee)})`} is the only amount
          charged on this page, and it is non-refundable.
        </p>
      </header>

      <StepProgress step={step} names={STEP_NAMES} />

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] lg:gap-[34px]">
        <div className="order-2 rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-6 sm:p-[34px] lg:order-1">
          {step === 0 ? (
            <StepAssessment
              course={course}
              form={form}
              onChange={update}
              onSelectOffering={selectOffering}
            />
          ) : null}

          {step === 1 ? (
            <StepDetails
              form={form}
              emailError={emailError}
              onChange={update}
              onEmailBlur={() => setEmailTouched(true)}
            />
          ) : null}

          {step === 2 ? (
            <StepPayment
              form={form}
              applicationFee={applicationFee ?? 0}
              paymentError={paymentError}
              paymentRetryable={paymentRetryable}
              onChange={update}
              onRetry={() => void submit()}
              onOpenPolicies={() => setPoliciesOpen(true)}
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
                // Deliberately neither `disabled` nor `aria-disabled`. Both tell
                // assistive tech the control is inoperable, which left the reason
                // it is blocked reachable only by a click the user had just been
                // told not to make. The button stays operable; `aria-describedby`
                // carries the reason, which is rendered whenever it applies.
                aria-describedby={blockedReason ? GATE_HINT_ID : undefined}
                title={blockedReason || undefined}
                className={
                  "rounded-xl border-0 px-7 py-[14px] text-[15px] font-bold transition-colors " +
                  (blocked || submitting
                    ? "bg-bfx-border-5 text-bfx-muted-2"
                    : "bg-bfx-ink text-white hover:bg-bfx-amber hover:text-bfx-ink")
                }
              >
                {submitting ? "Starting checkout…" : nextLabel}
              </button>
            </div>

            {/* Always present while the step is incomplete, so the reason is
                announced with the button rather than discovered by clicking it.
                A click that was refused promotes it to an assertive alert. */}
            {blockedReason ? (
              <p
                id={GATE_HINT_ID}
                role={showGateHint ? "alert" : "status"}
                className={
                  "mt-3 text-right text-[13.5px] " +
                  (showGateHint ? "font-semibold text-bfx-note-text" : "text-bfx-muted")
                }
              >
                {blockedReason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <EnrollSummary
            course={course}
            offering={offering}
            arrangement={form.arrangement}
            applicationFee={applicationFee}
          />
        </div>
      </div>

      <PolicyDialog open={policiesOpen} onOpenChange={setPoliciesOpen} />
    </section>
  )
}
