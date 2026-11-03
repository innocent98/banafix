"use client"

/**
 * Enrolment aside — "Banafix Redesign.dc.html", `isCourse`.
 *
 * Handoff spec: sticky at `top:104px`, white, 1px #E9E0D2, radius 24, 28px
 * padding, `0 24px 48px -30px rgba(16,26,40,0.28)` shadow; the format rows use `row()` from
 * styles.ts.
 *
 * What it shows is driven entirely by the course's offerable offerings (location-first flow):
 *   • no offerable offering anywhere  -> "Enrolment opening soon" + contact, no enrol CTA
 *   • offerings exist, no location    -> asks the visitor to pick a location (chooser is above)
 *   • a location is chosen            -> that location's formats, per-class rate per duration,
 *                                        and an enrol CTA carrying `offeringId`
 * No total tuition is shown anywhere: tuition is agreed after the assessment. The only amount
 * quoted as payable is the location's assessment fee.
 */
import * as React from "react"
import Link from "next/link"
import * as RadioGroup from "@radix-ui/react-radio-group"

import { row } from "@/components/site/courses/styles"
import { PillLink } from "@/components/site/primitives"
import { fromRate } from "@/lib/offering-rates"
import type { PublicOffering } from "@/lib/offerings"
import { formatNaira } from "@/lib/site"

export function EnrolAside({
  courseId,
  hasAnyOffering,
  location,
  offerings,
}: {
  courseId: string
  /** True when at least one offerable offering exists at any location. */
  hasAnyOffering: boolean
  /** The chosen location, or null when the visitor has not picked one. */
  location: { name: string; assessmentFee: number } | null
  /** Offerable offerings at `location` (empty when none or no location). */
  offerings: PublicOffering[]
}) {
  const [selectedId, setSelectedId] = React.useState(offerings[0]?.id ?? "")
  const selected = offerings.find((offering) => offering.id === selectedId) ?? offerings[0]

  return (
    <aside className="sticky top-[104px] rounded-3xl border border-bfx-border-6 bg-bfx-surface p-7 shadow-[0_24px_48px_-30px_rgba(16,26,40,0.28)]">
      {!hasAnyOffering ? (
        <>
          <p className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-bfx-ink">
            Enrolment opening soon
          </p>
          <p className="mb-[22px] text-[14.5px] leading-relaxed text-bfx-body-2">
            This course is not open for enrolment at any location yet. Message us and we will tell
            you as soon as it opens.
          </p>
          <PillLink href="/contact" variant="amber" size="block" className="shadow-none">
            Ask about this course
          </PillLink>
        </>
      ) : !location ? (
        <>
          <p className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-bfx-ink">
            Choose your location
          </p>
          <p className="mb-[22px] text-[14.5px] leading-relaxed text-bfx-body-2">
            Formats and per-class rates depend on where you learn. Pick a location above to see
            what is offered there.
          </p>
          <PillLink href="/contact" variant="outlineSoft" size="blockSm">
            Ask about this course
          </PillLink>
        </>
      ) : !selected ? (
        <>
          <p className="mb-2 text-[22px] font-bold tracking-[-0.015em] text-bfx-ink">
            Not offered at {location.name}
          </p>
          <p className="mb-[22px] text-[14.5px] leading-relaxed text-bfx-body-2">
            This course is not open for enrolment at {location.name} yet. Try another location
            above, or message us.
          </p>
          <PillLink href="/contact" variant="amber" size="block" className="shadow-none">
            Ask about this course
          </PillLink>
        </>
      ) : (
        <>
          <p className="mb-1 text-[13px] font-semibold text-bfx-muted">At {location.name}</p>
          <div className="mb-[22px] flex flex-wrap items-baseline gap-2">
            <span className="font-display text-[46px] font-normal leading-none tracking-[-0.02em] text-bfx-ink">
              {formatNaira(fromRate(selected.rates) ?? 0)}
            </span>
            <span className="text-sm font-semibold text-bfx-muted">per class, from</span>
          </div>

          <p className="mb-[11px] text-[12.5px] font-bold tracking-[0.06em] text-bfx-muted-2">
            CHOOSE A FORMAT
          </p>
          <RadioGroup.Root
            value={selected.id}
            onValueChange={setSelectedId}
            aria-label="Choose a format"
            className="mb-[18px] flex flex-col gap-[9px]"
          >
            {offerings.map((offering) => (
              <RadioGroup.Item
                key={offering.id}
                value={offering.id}
                className={`${row(offering.id === selected.id)} w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2`}
              >
                <span className="text-left text-[15px] font-bold text-bfx-ink">
                  {offering.format}
                </span>
                <span className="text-[13.5px] font-bold text-bfx-ink">
                  from {formatNaira(fromRate(offering.rates) ?? 0)}
                </span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>

          <ul
            aria-label={`${selected.format} rates`}
            className="mb-[22px] flex flex-col gap-2 rounded-[14px] bg-bfx-field px-4 py-3.5"
          >
            {selected.rates.map((rate) => (
              <li
                key={rate.durationMins}
                className="flex items-baseline justify-between gap-3 text-[14.5px] text-bfx-label"
              >
                <span>
                  <strong className="font-extrabold text-bfx-ink">
                    {formatNaira(rate.pricePerClass)}
                  </strong>{" "}
                  per class
                </span>
                <span className="font-semibold text-bfx-muted">{rate.durationMins} min</span>
              </li>
            ))}
          </ul>

          <PillLink
            href={`/enroll?courseId=${encodeURIComponent(courseId)}&offeringId=${encodeURIComponent(selected.id)}`}
            variant="amber"
            size="block"
            className="mb-2.5 shadow-none"
          >
            Book your assessment, {formatNaira(location.assessmentFee)}
          </PillLink>
          <PillLink href="/contact" variant="outlineSoft" size="blockSm">
            Ask about this course
          </PillLink>

          <ul className="mt-[22px] flex flex-col gap-[11px] border-t border-bfx-hair pt-5">
            <li className="text-sm font-medium text-bfx-label">
              {formatNaira(location.assessmentFee)} assessment fee is all you pay today. It is
              non-refundable.
            </li>
            <li className="text-sm font-medium text-bfx-label">
              Tuition is agreed with you after your assessment
            </li>
            <li className="text-sm font-medium text-bfx-label">
              <Link
                href="/policies"
                className="font-semibold text-bfx-bronze underline-offset-4 hover:underline"
              >
                Refunds, conduct and terms
              </Link>
            </li>
          </ul>
        </>
      )}
    </aside>
  )
}
