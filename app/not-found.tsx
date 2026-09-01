import Link from "next/link"

import { MediaSlot } from "@/components/site/media-slot"
import { Display, PillLink } from "@/components/site/primitives"
import { Wordmark } from "@/components/site/wordmark"
import { SITE_WHATSAPP } from "@/lib/site"

/**
 * 404 — self-contained.
 *
 * This file sits OUTSIDE the (site) route group, so app/(site)/layout.tsx
 * never wraps it: no SiteHeader, no SiteFooter. It therefore carries its own
 * `bfx-site` ground (cream + Plus Jakarta Sans, the class the site shell
 * normally applies) and its own minimal chrome — the wordmark, a way home.
 *
 * The wordmark comes from components/site/wordmark.tsx, which is a
 * server-safe module precisely so this page can use it without pulling in the
 * sticky header's client bundle (drawer state, effects, lucide icons).
 */
export default function NotFound() {
  return (
    <div className="bfx-site flex min-h-screen flex-col">
      <header className="border-b border-bfx-border-3">
        <div className="bfx-shell flex h-[76px] items-center">
          <Link
            href="/"
            aria-label="Banafix — back to the homepage"
            className="text-bfx-ink"
          >
            <Wordmark />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <div className="bfx-shell grid w-full items-center gap-14 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          <div className="bfx-rise">
            <div className="mb-3 text-xs font-bold tracking-[0.12em] text-bfx-bronze">
              404 — PAGE NOT FOUND
            </div>
            <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
              That page hit
              <br />
              a wrong note
            </Display>
            <p className="bfx-pretty mb-8 max-w-[440px] text-[18px] leading-[1.65] text-bfx-body">
              The link is broken or the page has moved. Nothing you did — start again from the
              homepage, or go straight to the courses.
            </p>
            <div className="flex flex-wrap gap-3">
              <PillLink variant="amber" size="xl" href="/">
                Back to home
              </PillLink>
              <PillLink variant="outline" size="xl" href="/courses">
                Browse courses
              </PillLink>
            </div>

            <p className="mt-10 border-t border-bfx-hair pt-7 text-[14.5px] text-bfx-body-2">
              Looking for something specific?{" "}
              <a
                href={SITE_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-bfx-bronze underline-offset-4 transition-colors hover:text-bfx-ink hover:underline"
              >
                Ask us on WhatsApp
              </a>{" "}
              or use the{" "}
              <Link
                href="/contact"
                className="font-semibold text-bfx-bronze underline-offset-4 transition-colors hover:text-bfx-ink hover:underline"
              >
                contact form
              </Link>
              .
            </p>
          </div>

          <div className="bfx-rise-2 hidden h-[380px] overflow-hidden rounded-[200px_200px_24px_24px] shadow-[0_30px_70px_-30px_rgba(16,26,40,0.35)] lg:block">
            <MediaSlot src={null} alt="" glyph="notes" glyphSize={120} />
          </div>
        </div>
      </main>
    </div>
  )
}
