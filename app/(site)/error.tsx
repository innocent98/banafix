"use client"

/**
 * Error boundary for the public site.
 *
 * The redesigned pages read Prisma directly from server components, so a DB
 * blip throws rather than returning an empty list. That distinction matters:
 * catching it and rendering "no courses" would present a transient outage as
 * fact. This says what actually happened and offers a retry.
 *
 * Not in the handoff — extended from its language (cream ground, Instrument
 * Serif display heading, pill buttons).
 */

import { useEffect } from "react"

import { Display, PillAnchor, PillButton, PillLink } from "@/components/site/primitives"
import { SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "@/lib/site"

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[site] render error", error)
  }, [error])

  return (
    <section className="bfx-shell flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span aria-hidden className="font-display text-[96px] leading-none text-bfx-ink/10">
        ♪
      </span>
      <Display as="h1" className="mt-2 mb-4 text-[clamp(32px,4vw,50px)] leading-[1.08]">
        That didn&rsquo;t load.
      </Display>
      <p className="mb-9 max-w-[440px] text-[17px] leading-[1.6] text-bfx-body">
        Something went wrong on our side — not on yours. Try again, and if it keeps happening give
        us a call and we&rsquo;ll sort it out.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <PillButton variant="amber" size="lg" onClick={reset}>
          Try again
        </PillButton>
        <PillLink href="/" variant="outline" size="lg">
          Back home
        </PillLink>
        <PillAnchor href={SITE_PHONE_TEL} variant="outlineSoft" size="lg">
          {SITE_PHONE_DISPLAY}
        </PillAnchor>
      </div>
      {error.digest ? (
        <p className="mt-8 text-[13px] font-semibold text-bfx-muted-2">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </section>
  )
}
