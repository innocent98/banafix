"use client"

/**
 * Error state for /tutors. Client-only because the retry is a re-render of the
 * server component — `router.refresh()` re-runs the page's fetch without a
 * full document load, so a transient API failure costs the visitor one click.
 */
import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { Display, PillAnchor, PillButton } from "@/components/site/primitives"
import { SITE_PHONE_DISPLAY, SITE_WHATSAPP } from "@/lib/site"

export function TutorsError() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="rounded-[22px] border border-bfx-note-border bg-bfx-note-bg px-6 py-16 text-center sm:px-10">
      <Display as="h2" className="mb-3 text-[26px] leading-[1.08] text-bfx-ink">
        We could not load the tutors
      </Display>
      <p className="bfx-pretty mx-auto mb-7 max-w-[440px] text-[15.5px] leading-[1.6] text-bfx-note-text">
        Something went wrong on our side, not yours. Try again in a moment — or message us on
        WhatsApp at {SITE_PHONE_DISPLAY} and we will tell you who teaches what.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PillButton
          variant="ink"
          size="md"
          onClick={() => startTransition(() => router.refresh())}
          disabled={isPending}
        >
          {isPending ? "Retrying…" : "Try again"}
        </PillButton>
        <PillAnchor
          href={SITE_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlineSoft"
          size="md"
        >
          WhatsApp us
        </PillAnchor>
      </div>
    </div>
  )
}
