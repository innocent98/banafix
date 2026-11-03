import type { Metadata } from "next"

import { Display, Eyebrow, PillAnchor, PillLink } from "@/components/site/primitives"
import { TestimonialCard } from "@/components/site/testimonials/testimonial-card"
import { getPublishedTestimonials } from "@/lib/site-content-queries"
import { SITE_EMAIL, SITE_EMAIL_MAILTO, SITE_WHATSAPP } from "@/lib/site"

export const metadata: Metadata = {
  title: "Student stories | Banafix",
  description:
    "What Banafix students and parents say about learning at the studio in Lekki, Lagos.",
}

/**
 * /testimonials renders only testimonials an admin has published with the
 * person's permission (`Testimonial`). With none, it says so plainly. Read per
 * request so an admin publish shows up immediately and the build needs no
 * database.
 */
export const dynamic = "force-dynamic"

export default async function TestimonialsPage() {
  const testimonials = await getPublishedTestimonials()

  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[640px]">
          <Eyebrow>STUDENTS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            In their words
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            What our students and their parents say about learning at Banafix, shared with their
            permission.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-20">
        {testimonials.length > 0 ? (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
            {testimonials.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-bfx-border bg-bfx-surface px-8 py-14 text-center">
            <p className="font-display text-[26px] leading-none tracking-[-0.02em] text-bfx-ink">
              No stories here yet
            </p>
            <p className="mx-auto mt-3 max-w-[420px] text-[15px] leading-[1.6] text-bfx-body-2">
              We only publish what students and parents have agreed to share. Their words will
              appear here once they have.
            </p>
          </div>
        )}
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
                Send us a line about how it went. A WhatsApp voice note is fine. We ask before we
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
            Not a student yet? Every course lists its formats and its price, so you can see exactly
            what you are signing up for before you enrol.
          </p>
          <PillLink variant="ink" size="md" href="/courses">
            Browse courses →
          </PillLink>
        </div>
      </section>
    </div>
  )
}
