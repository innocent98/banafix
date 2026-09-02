"use client"

/**
 * The sticky ink summary aside (handoff.html:538-556).
 *
 * Money rules:
 *
 *   Course fee   `course.pricing[selectedMode]`, informational. Not charged here.
 *   Registration `calculateApplicationFee(course.location).amount`. The ONLY
 *                amount Paystack is asked to collect. Never hardcoded.
 *   Due today    the registration fee.
 *
 * The outgoing sidebar also showed a "VAT (7.5%)" line and a "remaining"
 * total. Both were dropped in the round-2 audit: nothing in the codebase
 * configures VAT, nothing charges it, and nothing schedules the course fee, so
 * the numbers asserted a bill the app cannot produce.
 */

import { formatNaira } from "@/lib/site"
import type { EnrollCourse } from "./types"

export function EnrollSummary({
  course,
  selectedMode,
  courseFee,
  applicationFee,
}: {
  course: EnrollCourse
  selectedMode: string
  courseFee: number
  applicationFee: number
}) {
  return (
    <aside className="rounded-[24px] bg-bfx-ink p-7 text-white lg:sticky lg:top-[104px]">
      <h2 className="mb-[18px] text-xs font-bold tracking-[0.1em] text-bfx-amber">YOUR ENROLMENT</h2>

      <div className="mb-6">
        <p className="mb-1 text-[21px] font-bold tracking-[-0.015em]">{course.title}</p>
        <p className="text-sm font-semibold text-bfx-on-dark-3">
          {course.duration}
          {selectedMode ? ` · ${selectedMode}` : null}
        </p>
        {/* Level, tutor and seat count are carried over from the outgoing sidebar
            and review step so nothing the student saw before paying is lost. */}
        <p className="mt-1 text-[13px] text-bfx-on-dark-5">
          {course.level}
          {course.instructor?.name ? ` · ${course.instructor.name}` : null}
        </p>
        {course.unlimitedSeats ? null : (
          <p className="mt-1 text-[13px] font-semibold text-bfx-amber">
            {course.seatsLeft} of {course.totalSeats} seats left
          </p>
        )}
      </div>

      <dl className="mb-5 flex flex-col gap-[13px] border-y border-bfx-line-dark py-5">
        <div className="flex justify-between gap-4 text-[14.5px]">
          <dt className="text-bfx-on-dark-3">Course fee (not charged today)</dt>
          <dd className="font-semibold">{formatNaira(courseFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[14.5px]">
          <dt className="text-bfx-on-dark-3">Registration</dt>
          <dd className="font-semibold">{formatNaira(applicationFee)}</dd>
        </div>
      </dl>

      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-[14.5px] font-bold">Due today</span>
        <span className="font-display text-[34px] font-normal leading-none tracking-[-0.02em] text-bfx-amber">
          {formatNaira(applicationFee)}
        </span>
      </div>

      <p className="text-[13px] leading-[1.6] text-bfx-on-dark-5">
        The registration fee is the only amount charged on this page. The {formatNaira(courseFee)}{" "}
        course fee is arranged with us separately, and we will confirm how before lessons start.
      </p>
    </aside>
  )
}
