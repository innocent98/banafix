import type { Metadata } from "next"

import { Display, Eyebrow, PillAnchor, PillLink } from "@/components/site/primitives"
import {
  SITE_EMAIL,
  SITE_EMAIL_MAILTO,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SITE_WHATSAPP,
} from "@/lib/site"

export const metadata: Metadata = {
  title: "Student area | Banafix",
  description:
    "Student accounts aren't live yet at Banafix — here's how lessons, schedules and payments are handled today.",
  robots: { index: false, follow: true },
}

/**
 * /dashboard — an honest holding page.
 *
 * WHAT THIS PAGE USED TO BE: a fully fabricated student dashboard. It had no
 * auth of any kind (lib/auth.ts issues admin-only JWTs; there is no Student or
 * User session anywhere in the app) and nothing in the site ever linked to it,
 * yet the route was publicly reachable and rendered, as if signed in:
 *
 *   • a named student — "Adunni Olatunji", adunni.olatunji@email.com
 *   • two enrolled courses with invented progress (75% / 40%) and tutors
 *   • three upcoming sessions dated January 2024
 *   • two "messages" attributed by name to tutors who never wrote them
 *   • a payment history showing ₦25,000 and ₦18,000 as paid
 *   • five achievement badges
 *
 * None of it came from Prisma. Re-skinning that into the new design language
 * would have made invented payment records and someone's email address look
 * more credible, not less, so the fabricated data was removed. The route now
 * says plainly that student accounts aren't live and points at the channels
 * that actually work today. Restoring a real dashboard needs student auth and
 * an enrolment read model first — both are backend work.
 */

/** Static copy — describes intent, not shipped features. Note the future tense. */
const PLANNED = [
  {
    title: "Your courses and progress",
    detail:
      "Which programme you're on, how many lessons you've taken, and what's coming in the next block.",
  },
  {
    title: "Your weekly slot",
    detail: "Your scheduled lessons, with rescheduling that doesn't need a WhatsApp thread.",
  },
  {
    title: "Receipts and balances",
    detail:
      "Every payment you've made, what's still due, and the receipt for each one in one place.",
  },
  {
    title: "Notes from your tutor",
    detail: "The written feedback you already get after every fourth lesson, kept together.",
  },
]

export default function DashboardPage() {
  return (
    <div className="bfx-rise">
      <section className="bfx-shell pt-16 pb-10">
        <div className="max-w-[660px]">
          <Eyebrow>STUDENT AREA</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            Not built yet —
            <br />
            and we won&apos;t pretend
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            There&apos;s no student login at Banafix today. Enrolments, schedules and receipts are
            handled by a person, over email and WhatsApp, and that&apos;s working. When there&apos;s
            a real dashboard, this is where it will live.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-16">
        <div className="rounded-[18px] border border-bfx-note-border bg-bfx-note-bg px-6 py-5 text-[14.5px] leading-[1.6] text-bfx-note-text sm:px-7">
          If you were expecting to sign in: you haven&apos;t missed a step and nothing is broken.
          There is no account to sign into. Your enrolment confirmation and payment receipt were
          emailed to you when you enrolled — search your inbox for {SITE_EMAIL}, and check spam.
        </div>
      </section>

      {/* What to do today — real channels only. */}
      <section className="bfx-shell pb-[92px]">
        <Eyebrow>IN THE MEANTIME</Eyebrow>
        <Display as="h2" className="mb-9 text-[clamp(28px,3.4vw,42px)] leading-[1.08]">
          Everything a dashboard
          <br />
          would do, a person does
        </Display>

        <div className="grid gap-px overflow-hidden rounded-[22px] border border-bfx-border-4 bg-bfx-border-4 md:grid-cols-2">
          <div className="bg-bfx-surface px-8 py-8">
            <div className="mb-2 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
              CHANGE OR RESCHEDULE A LESSON
            </div>
            <p className="bfx-pretty mb-5 text-[15.5px] leading-[1.6] text-bfx-body-2">
              Message us 24 hours ahead and we move it at no cost. Same thread, same day, usually
              within the hour on weekdays.
            </p>
            <PillAnchor
              variant="ink"
              size="md"
              href={SITE_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp us
            </PillAnchor>
          </div>

          <div className="bg-bfx-surface px-8 py-8">
            <div className="mb-2 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
              A RECEIPT OR BALANCE QUESTION
            </div>
            <p className="bfx-pretty mb-5 text-[15.5px] leading-[1.6] text-bfx-body-2">
              Email us the name the enrolment was under and we&apos;ll resend the receipt and
              confirm exactly what&apos;s outstanding.
            </p>
            <PillAnchor variant="outlineSoft" size="md" href={SITE_EMAIL_MAILTO}>
              {SITE_EMAIL}
            </PillAnchor>
          </div>

          <div className="bg-bfx-surface px-8 py-8">
            <div className="mb-2 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
              SOMETHING URGENT
            </div>
            <p className="bfx-pretty mb-5 text-[15.5px] leading-[1.6] text-bfx-body-2">
              Running late, tutor hasn&apos;t shown, wrong room — call the studio. Someone is always
              teaching, so someone always picks up.
            </p>
            <PillAnchor variant="outlineSoft" size="md" href={SITE_PHONE_TEL}>
              {SITE_PHONE_DISPLAY}
            </PillAnchor>
          </div>

          <div className="bg-bfx-surface px-8 py-8">
            <div className="mb-2 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
              NOT ENROLLED YET
            </div>
            <p className="bfx-pretty mb-5 text-[15.5px] leading-[1.6] text-bfx-body-2">
              Start with the free thirty-minute trial. No card, no account, no commitment on either
              side.
            </p>
            <PillLink variant="outlineSoft" size="md" href="/courses">
              Browse courses
            </PillLink>
          </div>
        </div>
      </section>

      {/* What it will hold — explicitly future tense, nothing presented as live. */}
      <section className="border-t border-[#EEE6DA] bg-white">
        <div className="bfx-shell py-[88px]">
          <div className="mb-11 max-w-[560px]">
            <Eyebrow>WHEN IT SHIPS</Eyebrow>
            <Display as="h2" className="text-[clamp(28px,3.4vw,42px)] leading-[1.08]">
              What it will hold
            </Display>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[22px] border border-bfx-border-4 bg-bfx-border-4 md:grid-cols-2">
            {PLANNED.map((item, index) => (
              <div
                key={item.title}
                className="grid grid-cols-[52px_1fr] items-start gap-[22px] bg-bfx-cream px-[34px] py-8"
              >
                <div className="font-display text-[34px] leading-none text-bfx-bronze">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="mb-[7px] text-[20px] font-bold tracking-[-0.01em]">{item.title}</h3>
                  <p className="bfx-pretty m-0 text-[15.5px] leading-[1.6] text-bfx-body-2">
                    {item.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[13.5px] font-semibold text-bfx-muted">
            No date promised. We&apos;d rather ship it late than ship a login that loses your
            receipts.
          </p>
        </div>
      </section>
    </div>
  )
}
