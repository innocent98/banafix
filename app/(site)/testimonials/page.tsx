import type { Metadata } from "next"

import { Display, Eyebrow, PillAnchor, PillLink } from "@/components/site/primitives"
import { TestimonialWall } from "@/components/site/testimonials/testimonial-wall"
import { TESTIMONIALS } from "@/components/site/testimonials/testimonials"
import { SITE_EMAIL, SITE_EMAIL_MAILTO, SITE_WHATSAPP } from "@/lib/site"

export const metadata: Metadata = {
  title: "Student stories | Banafix",
  description:
    "What Banafix students say about learning piano, guitar, drums, vocals and violin in Lekki, Lagos.",
}

/**
 * /testimonials — page header, the filterable wall, and a real "share yours"
 * block.
 *
 * The old page ended in a <form> with no `action`, no `onSubmit` and no API
 * behind it: filling it in and pressing Submit did nothing, silently. There is
 * no Testimonial model to POST to, so rather than fake a backend the block
 * below routes people to the channels that actually reach the team.
 */
export default function TestimonialsPage() {
  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[640px]">
          <Eyebrow>STUDENTS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            In their words
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            Adults who started from nothing, parents who stopped fighting Lagos traffic, students
            preparing for grades. Filter by instrument or level to find someone like you.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-20">
        <TestimonialWall testimonials={TESTIMONIALS} />
      </section>

      {/* Share yours — replaces a submission form that had no handler and no
          endpoint. Both channels below are the real ones from lib/site.ts. */}
      <section className="bfx-shell pb-24">
        <div className="relative overflow-hidden rounded-[28px] px-[clamp(28px,4vw,60px)] py-[clamp(44px,5vw,68px)] bg-[linear-gradient(115deg,#101A28_0%,#1C2C42_55%,#4A3512_100%)]">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <Eyebrow onInk>YOUR TURN</Eyebrow>
              <Display as="h2" className="mb-3.5 text-[clamp(30px,3.4vw,44px)] leading-[1.08] text-white">
                Learned something here?
              </Display>
              <p className="bfx-pretty m-0 max-w-[480px] text-[17px] leading-[1.6] text-bfx-on-dark-2">
                Send us a line about how it went — a WhatsApp voice note is fine. We ask before we
                publish anything, and we always use the name you tell us to.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PillAnchor
                variant="amberOnInk"
                size="xl"
                href={SITE_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
              >
                Send it on WhatsApp
              </PillAnchor>
              <PillAnchor variant="outlineOnInk" size="xl" href={SITE_EMAIL_MAILTO}>
                Email {SITE_EMAIL}
              </PillAnchor>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-bfx-border bg-bfx-surface px-7 py-6">
          <p className="m-0 max-w-[520px] text-[15.5px] leading-[1.6] text-bfx-body">
            Not a student yet? Every course starts with a free thirty-minute trial lesson — no card
            needed.
          </p>
          <PillLink variant="ink" size="md" href="/courses">
            Browse courses →
          </PillLink>
        </div>
      </section>
    </div>
  )
}
