"use client"

/**
 * /enroll/success — the page Paystack actually returns to.
 *
 * Restyled to the redesign's tokens; the behaviour is untouched. It still calls
 * `GET /api/enrollments/verify?reference=…` and still renders all five states:
 * loading · unverifiable · failed · pending · completed. Header and footer come
 * from app/(site)/layout.tsx.
 */

import type * as React from "react"
import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { Display, PillLink } from "@/components/site/primitives"
import { formatNaira } from "@/lib/site"

interface VerifyResult {
  status: "completed" | "pending" | "failed"
  amount: number
  receiptNumber: string
  enrollment: {
    firstName: string
    email: string
    course: {
      title: string
      instructor: string | null
      sessionStartDate: string | null
    }
  }
}

function formatDate(dateInput: string | null) {
  if (!dateInput) return null
  const date = new Date(dateInput)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[720px] px-[clamp(20px,4vw,40px)] pb-[100px] pt-14">
      {children}
    </section>
  )
}

function Panel({
  glyph,
  tone,
  title,
  children,
  actions,
}: {
  glyph: string
  tone: "ok" | "note" | "error"
  title: string
  children: React.ReactNode
  actions: React.ReactNode
}) {
  const toneClass =
    tone === "ok"
      ? "bg-bfx-ok-bg text-bfx-ok-text"
      : tone === "note"
        ? "bg-bfx-note-bg text-bfx-note-text"
        : "bg-red-50 text-red-700"

  return (
    <div className="rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 text-center sm:p-[42px]">
      <span
        aria-hidden
        className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full text-[28px] leading-none ${toneClass}`}
      >
        {glyph}
      </span>
      <Display as="h1" className="mb-3 text-[clamp(28px,4vw,38px)] leading-[1.08] text-bfx-ink">
        {title}
      </Display>
      <div className="text-[15.5px] leading-[1.65] text-bfx-body">{children}</div>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</div>
    </div>
  )
}

function ReceiptRow({
  label,
  value,
  mono = false,
  divider = false,
}: {
  label: string
  value: string
  mono?: boolean
  divider?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 text-[14.5px] ${
        divider ? "border-t border-bfx-hair pt-4" : ""
      }`}
    >
      <dt className="text-bfx-muted">{label}</dt>
      <dd className={`text-right font-semibold text-bfx-ink ${mono ? "font-mono text-[13.5px]" : ""}`}>
        {value}
      </dd>
    </div>
  )
}

function SuccessSkeleton() {
  return (
    <Shell>
      <div
        aria-hidden
        className="animate-pulse rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 sm:p-[42px]"
      >
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-bfx-border-5" />
        <div className="mx-auto mb-3 h-9 w-[280px] max-w-full rounded-xl bg-bfx-border-5" />
        <div className="mx-auto mb-2 h-4 w-full max-w-[420px] rounded bg-bfx-hair" />
        <div className="mx-auto h-4 w-[70%] max-w-[300px] rounded bg-bfx-hair" />
        <div className="mt-8 flex justify-center gap-3">
          <div className="h-[46px] w-[150px] rounded-full bg-bfx-hair" />
          <div className="h-[46px] w-[150px] rounded-full bg-bfx-border-5" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Confirming your payment…
      </span>
    </Shell>
  )
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference") || searchParams.get("trxref")

  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState("")
  const [reloadToken, setReloadToken] = useState(0)

  const retry = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    if (!reference) {
      setError("No payment reference found.")
      setLoading(false)
      return
    }

    let cancelled = false

    const verify = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await fetch(
          `/api/enrollments/verify?reference=${encodeURIComponent(reference)}`,
        )
        const data = await response.json()
        if (cancelled) return
        if (response.ok) {
          setResult(data)
        } else {
          setError(data.error || "We couldn't verify your payment.")
        }
      } catch {
        if (!cancelled) {
          setError("We couldn't verify your payment. Please contact support with your reference.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [reference, reloadToken])

  /* ------------------------------------------------------------- loading */

  if (loading) return <SuccessSkeleton />

  /* -------------------------------------------------- error / unverifiable */

  if (error || !result) {
    return (
      <Shell>
        <Panel
          glyph="⏱"
          tone="note"
          title="We're confirming your payment"
          actions={
            <>
              <button
                type="button"
                onClick={retry}
                className="rounded-full border-0 bg-bfx-ink px-[22px] py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-bfx-amber hover:text-bfx-ink"
              >
                Check again
              </button>
              <PillLink href="/contact" variant="outlineSoft" size="md">
                Contact support
              </PillLink>
            </>
          }
        >
          <p>
            {error || "Your payment is being processed."} If you completed payment, your enrolment
            will be confirmed shortly.
          </p>
          {reference ? (
            <p className="mt-3 text-[14px] text-bfx-muted">
              Quote reference <span className="font-mono text-bfx-ink">{reference}</span> if you
              contact us.
            </p>
          ) : null}
        </Panel>
      </Shell>
    )
  }

  const startDate = formatDate(result.enrollment.course.sessionStartDate)

  /* -------------------------------------------------------------- failed */

  if (result.status === "failed") {
    return (
      <Shell>
        <Panel
          glyph="✕"
          tone="error"
          title="Payment not completed"
          actions={
            <>
              <PillLink href="/courses" variant="ink" size="md">
                Try again
              </PillLink>
              <PillLink href="/contact" variant="outlineSoft" size="md">
                Contact support
              </PillLink>
            </>
          }
        >
          <p>
            Your registration payment for{" "}
            <strong className="font-bold text-bfx-ink">{result.enrollment.course.title}</strong>{" "}
            didn't go through, and no charge was made. You can start the enrolment again from the
            course page.
          </p>
        </Panel>
      </Shell>
    )
  }

  /* ------------------------------------------------------------- pending */

  if (result.status === "pending") {
    return (
      <Shell>
        <Panel
          glyph="⏱"
          tone="note"
          title="Payment processing"
          actions={
            <>
              <button
                type="button"
                onClick={retry}
                className="rounded-full border-0 bg-bfx-ink px-[22px] py-3 text-[14.5px] font-bold text-white transition-colors hover:bg-bfx-amber hover:text-bfx-ink"
              >
                Check again
              </button>
              <PillLink href="/courses" variant="outlineSoft" size="md">
                Browse courses
              </PillLink>
            </>
          }
        >
          <p>
            We've received your payment and are confirming it. You'll get an email once your spot in{" "}
            <strong className="font-bold text-bfx-ink">{result.enrollment.course.title}</strong> is
            secured.
          </p>
          <p className="mt-3 text-[14px] text-bfx-muted">
            Receipt <span className="font-mono text-bfx-ink">{result.receiptNumber}</span>
          </p>
        </Panel>
      </Shell>
    )
  }

  /* ----------------------------------------------------------- completed */

  return (
    <Shell>
      <div className="rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 text-center sm:p-[42px]">
        <span
          aria-hidden
          className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-bfx-ok-bg text-[28px] leading-none text-bfx-ok-text"
        >
          ✓
        </span>
        <Display as="h1" className="mb-3 text-[clamp(30px,4.4vw,42px)] leading-[1.06] text-bfx-ink">
          You're enrolled
        </Display>
        <p className="text-[15.5px] leading-[1.65] text-bfx-body">
          Thanks, {result.enrollment.firstName}. Your registration for{" "}
          <strong className="font-bold text-bfx-ink">{result.enrollment.course.title}</strong> is
          confirmed, and a receipt is on its way to {result.enrollment.email}.
        </p>

        <dl className="mt-8 flex flex-col gap-4 rounded-[18px] border border-bfx-border-5 bg-bfx-field p-6 text-left">
          <ReceiptRow label="Course" value={result.enrollment.course.title} />
          {result.enrollment.course.instructor ? (
            <ReceiptRow label="Tutor" value={result.enrollment.course.instructor} />
          ) : null}
          <ReceiptRow label="Registration fee paid" value={formatNaira(result.amount)} />
          <ReceiptRow label="Receipt no." value={result.receiptNumber} mono />
          {startDate ? <ReceiptRow label="Starts" value={startDate} divider /> : null}
        </dl>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PillLink href="/courses" variant="ink" size="md">
            Explore more courses
          </PillLink>
          <PillLink href="/" variant="outlineSoft" size="md">
            Back to home
          </PillLink>
        </div>
      </div>
    </Shell>
  )
}

export default function EnrollSuccessPage() {
  return (
    <Suspense fallback={<SuccessSkeleton />}>
      <SuccessContent />
    </Suspense>
  )
}
