"use client"

/**
 * The sticky ink summary aside (handoff.html:538-556).
 *
 * Money rules:
 *
 *   Assessment fee  `Location.assessmentFee` of the chosen offering's location, shown from the
 *                   course payload and confirmed by the server's `applicationFee.amount`. The
 *                   ONLY amount Paystack is asked to collect. Non-refundable.
 *   Due today       the assessment fee.
 *
 * No tuition total is shown: tuition is agreed after the assessment. The per-class rates on the
 * first step are information only. (VAT is not configured or charged anywhere, so none is shown.)
 */

import { ARRANGEMENT_LABELS, type Arrangement } from "@/lib/assessment-vocab"
import { formatNaira } from "@/lib/site"
import type { EnrollCourse, EnrollOffering } from "./types"

export function EnrollSummary({
  course,
  offering,
  arrangement,
  applicationFee,
}: {
  course: EnrollCourse
  offering: EnrollOffering | null
  arrangement: Arrangement | ""
  applicationFee: number | null
}) {
  return (
    <aside className="rounded-[24px] bg-bfx-ink p-7 text-white lg:sticky lg:top-[104px]">
      <h2 className="mb-[18px] text-xs font-bold tracking-[0.1em] text-bfx-amber">YOUR ASSESSMENT</h2>

      <div className="mb-6">
        <p className="mb-1 text-[21px] font-bold tracking-[-0.015em]">{course.title}</p>
        <p className="text-sm font-semibold text-bfx-on-dark-3">
          {offering ? `${offering.location.name} · ${offering.format}` : "Choose a location and format"}
          {arrangement ? ` · ${ARRANGEMENT_LABELS[arrangement]}` : null}
        </p>
        <p className="mt-1 text-[13px] text-bfx-on-dark-5">
          {course.level}
          {course.instructor?.name ? ` · ${course.instructor.name}` : null}
        </p>
      </div>

      <dl className="mb-5 flex flex-col gap-[13px] border-y border-bfx-line-dark py-5">
        <div className="flex justify-between gap-4 text-[14.5px]">
          <dt className="text-bfx-on-dark-3">Assessment fee</dt>
          <dd className="font-semibold">
            {applicationFee === null ? "Choose a location" : formatNaira(applicationFee)}
          </dd>
        </div>
      </dl>

      <div className="mb-2 flex items-baseline justify-between gap-4">
        <span className="text-[14.5px] font-bold">Due today</span>
        <span className="font-display text-[34px] font-normal leading-none tracking-[-0.02em] text-bfx-amber">
          {applicationFee === null ? "—" : formatNaira(applicationFee)}
        </span>
      </div>

      <p className="text-[13px] leading-[1.6] text-bfx-on-dark-5">
        The assessment fee is non-refundable and is the only amount charged on this page. Tuition is
        agreed with you after your assessment, and we will confirm it before lessons start.
      </p>
    </aside>
  )
}
