import type { Metadata } from "next"

import { FaqBrowser } from "@/components/site/faqs/faq-browser"
import { FAQS } from "@/components/site/faqs/faqs"
import { Display, Eyebrow, PillAnchor, PillLink } from "@/components/site/primitives"
import {
  SITE_EMAIL,
  SITE_EMAIL_MAILTO,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_WHATSAPP,
} from "@/lib/site"

export const metadata: Metadata = {
  title: "Frequently asked questions | Banafix",
  description:
    "Answers on enrolling, lesson formats, scheduling and pricing at Banafix, the Lekki music academy.",
}

/**
 * /faqs — page header + search/filter/accordion + a real escalation block.
 *
 * The page is a Server Component; only the browser below it is interactive.
 * The header follows the handoff's `isCourses` / `isTutors` treatment (bronze
 * eyebrow, Instrument Serif h1 at clamp(38px,5vw,62px)/1, an 18px lede) and
 * the escalation block reuses its grouped-list card.
 */
export default function FaqsPage() {
  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-9">
        <div className="max-w-[640px]">
          <Eyebrow>FAQS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            Questions we get asked
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            Enrolling, lesson formats, scheduling and fees. If your question isn&apos;t here, ask us
            on WhatsApp. Someone is always teaching.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-24">
        <FaqBrowser faqs={FAQS} />

        {/* Escalation. Every channel here is a real one from lib/site.ts. */}
        <div className="mt-16 overflow-hidden rounded-[24px] border border-bfx-border-6 bg-bfx-surface">
          <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div>
              <Eyebrow>STILL STUCK?</Eyebrow>
              <Display as="h2" className="mb-3 text-[clamp(26px,3vw,34px)] leading-[1.08]">
                Ask a person instead
              </Display>
              <p className="bfx-pretty max-w-[440px] text-[16px] leading-[1.65] text-bfx-body">
                We answer WhatsApp within the hour on weekdays. Prefer email or a call? Both reach
                the same team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PillAnchor
                variant="ink"
                size="lg"
                href={SITE_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp
              </PillAnchor>
              <PillAnchor variant="outlineSoft" size="lg" href={SITE_PHONE_TEL}>
                Call {SITE_PHONE_DISPLAY}
              </PillAnchor>
            </div>
          </div>

          <div className="grid gap-px border-t border-bfx-hair bg-bfx-border-4 sm:grid-cols-2">
            <div className="bg-bfx-surface px-8 py-6 sm:px-10">
              <div className="mb-1.5 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
                EMAIL
              </div>
              <a
                href={SITE_EMAIL_MAILTO}
                className="text-[17px] font-bold text-bfx-ink transition-colors hover:text-bfx-bronze"
              >
                {SITE_EMAIL}
              </a>
            </div>
            <div className="bg-bfx-surface px-8 py-6 sm:px-10">
              <div className="mb-1.5 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
                RATHER WRITE IT OUT?
              </div>
              <PillLink variant="outlineSoft" size="sm" href="/contact">
                Use the contact form →
              </PillLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
