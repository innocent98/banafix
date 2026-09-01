"use client"

/**
 * The sticky ink summary aside (handoff.html:538–556).
 *
 * Money rules, unchanged from the outgoing sidebar
 * (components/enrollment/enrollment-sidebar.tsx:15–26):
 *
 *   Course fee   — `course.pricing[selectedMode]`, informational. Billed separately.
 *   VAT (7.5%)   — DISPLAY ONLY, on the course fee. Never charged, never sent.
 *   Registration — `calculateApplicationFee(course.location).amount`. The ONLY
 *                  amount Paystack is asked to collect. Never hardcoded.
 *   Due today    — the registration fee.
 *   Remaining    — course fee + display VAT.
 */

import { formatNaira } from "@/lib/site"
import type { EnrollCourse } from "./types"

export function EnrollSummary({
  course,
  selectedMode,
  courseFee,
  vat,
  applicationFee,
}: {
  course: EnrollCourse
  selectedMode: string
  courseFee: number
  vat: number
  applicationFee: number
}) {
  const remaining = courseFee + vat

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
          <dt className="text-bfx-on-dark-3">Course fee</dt>
          <dd className="font-semibold">{formatNaira(courseFee)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-[14.5px]">
          <dt className="text-bfx-on-dark-3">VAT (7.5%)</dt>
          <dd className="font-semibold">{formatNaira(vat)}</dd>
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
        Only the registration fee is charged today. The remaining {formatNaira(remaining)} is billed
        separately before classes begin.
      </p>
    </aside>
  )
}
