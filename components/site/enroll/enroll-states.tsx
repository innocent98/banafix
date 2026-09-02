"use client"

/**
 * The non-happy states of the enrolment screen, in the redesign's system.
 * The skeleton mirrors the real layout — same shell width, same progress header,
 * same 1fr/330px split — so nothing shifts when the course resolves.
 */

import type * as React from "react"

import { Display, PillLink } from "@/components/site/primitives"
import { ENROL_HREF } from "@/lib/site"

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1000px] px-[clamp(20px,4vw,40px)] pb-[100px] pt-14">
      {children}
    </section>
  )
}

export function EnrollSkeleton() {
  return (
    <Shell>
      <div className="animate-pulse" aria-hidden>
        <div className="mb-[38px]">
          <div className="mb-3 h-[46px] w-[280px] rounded-xl bg-bfx-border-5" />
          <div className="h-5 w-[420px] max-w-full rounded-lg bg-bfx-hair" />
        </div>

        <div className="mb-[34px] flex items-center gap-[14px]">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex min-w-0 flex-1 items-center gap-[14px]">
              <div className="h-[34px] w-[34px] flex-none rounded-full bg-bfx-border-5" />
              <div className="flex-1">
                <div className="h-3.5 w-20 rounded bg-bfx-hair" />
                <div className="mt-[9px] h-[3px] rounded-full bg-bfx-border-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] lg:gap-[34px]">
          <div className="order-2 rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-6 sm:p-[34px] lg:order-1">
            <div className="mb-1.5 h-7 w-56 rounded-lg bg-bfx-border-5" />
            <div className="mb-[26px] h-4 w-80 max-w-full rounded bg-bfx-hair" />
            {[0, 1, 2].map((row) => (
              <div key={row} className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-[7px] h-3 w-24 rounded bg-bfx-hair" />
                  <div className="h-[52px] rounded-xl bg-bfx-field ring-[1.5px] ring-bfx-border-2" />
                </div>
                <div>
                  <div className="mb-[7px] h-3 w-24 rounded bg-bfx-hair" />
                  <div className="h-[52px] rounded-xl bg-bfx-field ring-[1.5px] ring-bfx-border-2" />
                </div>
              </div>
            ))}
            <div className="h-[62px] rounded-[14px] bg-bfx-note-bg" />
            <div className="mt-[30px] flex justify-between border-t border-bfx-hair pt-6">
              <div className="h-[52px] w-[110px] rounded-xl bg-bfx-hair" />
              <div className="h-[52px] w-[150px] rounded-xl bg-bfx-border-5" />
            </div>
          </div>

          <div className="order-1 rounded-[24px] bg-bfx-ink p-7 lg:order-2">
            <div className="mb-[18px] h-3 w-32 rounded bg-white/20" />
            <div className="mb-1 h-6 w-44 rounded bg-white/15" />
            <div className="mb-6 h-4 w-32 rounded bg-white/10" />
            <div className="flex flex-col gap-[13px] border-y border-bfx-line-dark py-5">
              {[0, 1, 2].map((line) => (
                <div key={line} className="h-4 rounded bg-white/10" />
              ))}
            </div>
            <div className="mt-5 h-9 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading course information…
      </span>
    </Shell>
  )
}

/** No `?courseId=` in the URL — the student reached /enroll without a course. */
export function NoCourseSelected() {
  return (
    <Shell>
      <div className="mx-auto max-w-[560px] rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 text-center sm:p-[42px]">
        <span
          aria-hidden
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-bfx-tint font-display text-[30px] leading-none text-bfx-ink/40"
        >
          ♪
        </span>
        <Display as="h1" className="mb-2.5 text-[30px] leading-[1.08] text-bfx-ink">
          Pick a course first
        </Display>
        <p className="mb-7 text-[15.5px] leading-[1.6] text-bfx-body">
          Enrolment starts from a course page, so we know which lessons, tutor and format you're
          signing up for.
        </p>
        <PillLink href={ENROL_HREF} variant="ink" size="md">
          Browse courses →
        </PillLink>
      </div>
    </Shell>
  )
}

/** The course fetch failed, or the course is not enrollable. */
export function EnrollLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Shell>
      <div className="mx-auto max-w-[560px] rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 text-center sm:p-[42px]">
        <span
          aria-hidden
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-bfx-note-bg text-[26px] leading-none"
        >
          ⚠
        </span>
        <Display as="h1" className="mb-2.5 text-[30px] leading-[1.08] text-bfx-ink">
          We couldn't load this course
        </Display>
        <p className="mb-7 text-[15.5px] leading-[1.6] text-bfx-body">{message}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border-0 bg-bfx-ink px-7 py-[14px] text-[15px] font-bold text-white transition-colors hover:bg-bfx-amber hover:text-bfx-ink"
          >
            Try again
          </button>
          <PillLink href={ENROL_HREF} variant="outlineSoft" size="md">
            Browse courses
          </PillLink>
        </div>
      </div>
    </Shell>
  )
}

/**
 * The course loaded, but `POST /api/enrollments` would reject it on one of its
 * own preconditions:
 *
 *   expired      — `isCourseExpired(sessionStartDate)`  (route.ts:84)
 *   fully booked — `!unlimitedSeats && seatsLeft <= 0`  (route.ts:89)
 *   no modes     — `availableModes` empty, so no `selectedMode` can ever validate
 *
 * Before this state existed the student filled all three steps and only met the
 * refusal on the Pay button, with a raw server string and no way forward.
 */
export function CourseUnavailable({
  courseTitle,
  headline,
  body,
}: {
  courseTitle: string
  headline: string
  body: string
}) {
  return (
    <Shell>
      <div className="mx-auto max-w-[560px] rounded-[24px] border border-bfx-border-6 bg-bfx-surface p-8 text-center sm:p-[42px]">
        <span
          aria-hidden
          className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-bfx-note-bg text-[26px] leading-none"
        >
          ⏱
        </span>
        <Display as="h1" className="mb-2.5 text-[30px] leading-[1.08] text-bfx-ink">
          {headline}
        </Display>
        <p className="mb-2 text-[15.5px] font-semibold text-bfx-ink">{courseTitle}</p>
        <p className="mb-7 text-[15.5px] leading-[1.6] text-bfx-body">{body}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PillLink href={ENROL_HREF} variant="ink" size="md">
            Browse courses
          </PillLink>
          <PillLink href="/contact" variant="outlineSoft" size="md">
            Ask about this course
          </PillLink>
        </div>
      </div>
    </Shell>
  )
}
