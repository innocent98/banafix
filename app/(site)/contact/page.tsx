/**
 * /contact — `isContact` in "Banafix Redesign.dc.html" (handoff lines
 * 564–621). Two columns on an auto-fit `minmax(min(400px,100%),1fr)` grid with
 * a 64px gap, so it collapses to one column below ~864px on its own.
 *
 * A Server Component: it reads `?subject=` and hands it to the form as the
 * preselected option. `TRIAL_HREF` in `lib/site.ts` is `/contact?subject=trial`,
 * so every "Book a free trial" CTA on the site lands here with "Booking a free
 * trial" already chosen.
 */
import type { Metadata } from "next"

import { ContactChannels } from "@/components/site/contact/contact-channels"
import { ContactFaq } from "@/components/site/contact/contact-faq"
import { ContactForm } from "@/components/site/contact/contact-form"
import { Display, Eyebrow } from "@/components/site/primitives"
import { subjectFromParam } from "@/lib/contact-message"

export const metadata: Metadata = {
  title: "Contact | Banafix",
  description:
    "Visit the Banafix studio in Lekki, message us on WhatsApp, or send an enquiry and we will reply the same day.",
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const initialSubject = subjectFromParam(params.subject)

  return (
    <section className="bfx-shell grid grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))] items-start gap-16 pt-16 pb-[90px]">
      <div>
        <Eyebrow>CONTACT</Eyebrow>
        <Display as="h1" className="mb-4 text-[clamp(36px,4.6vw,58px)] leading-none text-bfx-ink">
          Come and see
          <br />
          the studio
        </Display>
        {/* Static marketing copy — the handoff's response-time promise. */}
        <p className="bfx-pretty mb-[34px] max-w-[440px] text-[18px] leading-[1.6] text-bfx-body">
          We answer WhatsApp within the hour on weekdays. Or just walk in — someone is always
          teaching.
        </p>
        <ContactChannels />
      </div>

      <div>
        <ContactForm initialSubject={initialSubject} />
        <ContactFaq />
      </div>
    </section>
  )
}
