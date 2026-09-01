"use client"

/**
 * Enrolment aside — "Banafix Redesign.dc.html", `isCourse`.
 *
 * Handoff spec: sticky at `top:104px`, white, 1px #E9E0D2, radius 24, 28px
 * padding, `0 24px 48px -30px rgba(16,26,40,0.28)` shadow. The price is
 * Instrument Serif at 46px; the format rows use `row()` from styles.ts.
 *
 * Three substitutions against the handoff, all of them to stay honest to data:
 *   • "Total for 12 weeks" uses the course's own `duration`.
 *   • The per-lesson caption is only rendered when `duration` parses to a week
 *     count; the handoff divides by a hardcoded 12.
 *   • "pay ₦5,000 to hold a spot" is `calculateApplicationFee(course.location)`,
 *     which is ₦2,000 or ₦8,000 outside Lagos/Abuja/Online.
 */
import * as React from "react"
import * as RadioGroup from "@radix-ui/react-radio-group"

import { row } from "@/components/site/courses/styles"
import { PillLink } from "@/components/site/primitives"
import { formatNaira, TRIAL_HREF } from "@/lib/site"

export interface ModeOption {
  mode: string
  price: number
  /** Static marketing note for the four canonical modes; null when unknown. */
  note: string | null
}

export function EnrolAside({
  courseId,
  duration,
  modes,
  weeks,
  applicationFee,
}: {
  courseId: string
  duration: string
  modes: ModeOption[]
  weeks: number | null
  applicationFee: number
}) {
  const first = modes[0]
  const [selectedMode, setSelectedMode] = React.useState(first ? first.mode : "")
  const selected = modes.find((option) => option.mode === selectedMode) ?? first

  return (
    <aside className="sticky top-[104px] rounded-3xl border border-bfx-border-6 bg-bfx-surface p-7 shadow-[0_24px_48px_-30px_rgba(16,26,40,0.28)]">
      <p className="mb-1 text-[13px] font-semibold text-bfx-muted">Total for {duration}</p>

      <div className="mb-[22px] flex flex-wrap items-baseline gap-2">
        <span className="font-display text-[46px] font-normal leading-none tracking-[-0.02em] text-bfx-ink">
          {selected ? formatNaira(selected.price) : "Price on request"}
        </span>
        {/* Only shown when `duration` actually parses to a number of weeks. */}
        {selected && weeks ? (
          <span className="text-sm font-semibold text-bfx-muted">
            · {formatNaira(selected.price / weeks)} a lesson
          </span>
        ) : null}
      </div>

      {modes.length > 0 ? (
        <>
          <p className="mb-[11px] text-[12.5px] font-bold tracking-[0.06em] text-bfx-muted-2">
            CHOOSE A FORMAT
          </p>
          <RadioGroup.Root
            value={selectedMode}
            onValueChange={setSelectedMode}
            aria-label="Choose a format"
            className="mb-[22px] flex flex-col gap-[9px]"
          >
            {modes.map((option) => (
              <RadioGroup.Item
                key={option.mode}
                value={option.mode}
                className={`${row(option.mode === selectedMode)} w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2`}
              >
                <span className="block text-left">
                  <span className="block text-[15px] font-bold text-bfx-ink">{option.mode}</span>
                  {option.note ? (
                    <span className="block text-[12.5px] font-semibold text-bfx-muted">
                      {option.note}
                    </span>
                  ) : null}
                </span>
                <span className="text-[15.5px] font-extrabold text-bfx-ink">
                  {formatNaira(option.price)}
                </span>
              </RadioGroup.Item>
            ))}
          </RadioGroup.Root>
        </>
      ) : (
        <p className="mb-[22px] rounded-[14px] bg-bfx-note-bg p-4 text-[14px] leading-relaxed text-bfx-note-text">
          This course has no published price yet. Message us and we will confirm the fee for the
          format you want.
        </p>
      )}

      {selected ? (
        <PillLink
          href={`/enroll?courseId=${encodeURIComponent(courseId)}&mode=${encodeURIComponent(selected.mode)}`}
          variant="amber"
          size="block"
          className="mb-2.5 shadow-none"
        >
          Enrol — pay {formatNaira(applicationFee)} to hold a spot
        </PillLink>
      ) : (
        <PillLink href="/contact" variant="amber" size="block" className="mb-2.5 shadow-none">
          Ask about this course
        </PillLink>
      )}

      <PillLink href={TRIAL_HREF} variant="outlineSoft" size="blockSm">
        Book a free trial first
      </PillLink>

      {/* STATIC MARKETING COPY — none of these three are DB-backed. */}
      <ul className="mt-[22px] flex flex-col gap-[11px] border-t border-bfx-hair pt-5">
        <li className="text-sm font-medium text-bfx-label">
          Course fee billed before classes begin
        </li>
        <li className="text-sm font-medium text-bfx-label">Free makeup lesson each term</li>
        <li className="text-sm font-medium text-bfx-label">End-of-term recital included</li>
      </ul>
    </aside>
  )
}
