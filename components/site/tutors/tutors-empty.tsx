/**
 * Designed empty state for /tutors. The handoff has no empty variant of this
 * screen — tutor records exist only on published, active courses, so an empty
 * catalogue means an empty grid, and a blank page would read as a bug.
 *
 * The copy is static marketing copy; nothing here claims a number.
 */
import { Display, PillLink } from "@/components/site/primitives"
import { TRIAL_HREF } from "@/lib/site"

export function TutorsEmpty() {
  return (
    <div className="rounded-[22px] border border-bfx-border bg-bfx-surface px-6 py-16 text-center sm:px-10">
      <div
        aria-hidden
        className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-bfx-tint font-display text-[34px] leading-none text-bfx-ink/25"
      >
        ♪
      </div>
      <Display as="h2" className="mb-3 text-[26px] leading-[1.08] text-bfx-ink">
        No tutor profiles are live yet
      </Display>
      <p className="bfx-pretty mx-auto mb-7 max-w-[420px] text-[15.5px] leading-[1.6] text-bfx-body">
        Tutors go up alongside the courses they teach. Tell us what you would like to learn and we
        will match you with someone by hand.
      </p>
      <PillLink href={TRIAL_HREF} variant="ink" size="md">
        Book a free trial
      </PillLink>
    </div>
  )
}
