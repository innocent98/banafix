import type { Metadata } from "next"

import { MediaSlot } from "@/components/site/media-slot"
import {
  CheckPip,
  Display,
  Eyebrow,
  PillAnchor,
  PillLink,
} from "@/components/site/primitives"
import { ENROL_HREF, ENROL_LABEL, SITE_PHONE_DISPLAY, SITE_PHONE_TEL, SITE_WHATSAPP } from "@/lib/site"

export const metadata: Metadata = {
  title: "Admissions | Banafix",
  description:
    "How to join Banafix: the four-step application, what we ask for, intake dates and what lessons cost.",
}

/**
 * /admissions — re-skinned into the handoff's language.
 *
 * Content note: everything on this page is STATIC MARKETING COPY. There is no
 * Admission, Intake or Tuition model in Prisma, so the student count, the four
 * process steps, the requirements, the intake dates and the three tuition
 * tiers below are all hardcoded page copy carried over from the previous
 * design. Real per-course prices live on /courses and are read from
 * `course.pricing`; the tiers here are indicative only and say so.
 *
 * Two dead affordances were dropped rather than restyled: a "Download
 * Brochure" button (there is no brochure file in the repo) and a "Learn About
 * Financial Aid" button with no href.
 *
 * `revalidate` daily because `isPast()` below compares an intake date against
 * `new Date()` — a purely static render would freeze that comparison at build
 * time and could keep calling a passed deadline "open".
 */
export const revalidate = 86400

/** Static copy — no Prisma model backs these. */
const STEPS = [
  {
    title: "Choose your path",
    detail:
      "Pick your instrument and the format that fits your week: at the studio, one-on-one, online, or home training.",
  },
  {
    title: "Send your details",
    detail:
      "A short form: who's learning, their level, and the days that work. Nothing you have to dig up paperwork for.",
  },
  {
    title: "Placement chat",
    detail:
      "A brief conversation, so we place you at the right level with the right tutor.",
  },
  {
    title: "Start learning",
    detail:
      "We confirm your tutor and your weekly slot, and you play your first lesson that week.",
  },
]

/** Static copy. */
const REQUIREMENTS = [
  {
    title: "Age",
    detail: "From age five on piano, violin and vocals; from age seven on guitar, drums and saxophone.",
  },
  {
    title: "Instrument",
    detail:
      "Studio instruments are free during lessons. For home practice you can rent from us or use your own.",
  },
  {
    title: "Commitment",
    detail: "A weekly slot and regular practice between lessons. That is genuinely all it takes.",
  },
  {
    title: "For minors",
    detail: "A guardian's contact details, and their consent to the lesson and refund policy.",
  },
]

/**
 * Static copy. The three dated rows are the ones the previous page shipped —
 * they are all in the past, so the page marks them closed rather than
 * presenting a passed date as an upcoming deadline. Rolling admissions is the
 * intake that is actually open.
 */
const INTAKES = [
  { name: "Spring semester", deadline: "2025-01-15" },
  { name: "Summer intensive", deadline: "2025-04-30" },
  { name: "Fall semester", deadline: "2025-08-15" },
]

/**
 * Static copy — indicative tiers, NOT the live prices. Real prices come from
 * `course.pricing[mode]` on /courses and vary per course and per format.
 */
const TUITION = [
  {
    name: "One-on-one",
    blurb: "Private tutor, your schedule",
    from: "₦25,000",
    points: ["Four sessions a month", "Curriculum built around you", "Flexible rescheduling"],
    featured: false,
  },
  {
    name: "At the studio",
    blurb: "Weekly slot in Lekki",
    from: "₦15,000",
    points: ["Four sessions a month", "Instruments and practice rooms", "End-of-term recital"],
    featured: true,
  },
  {
    name: "Online",
    blurb: "Live video with your tutor",
    from: "₦12,000",
    points: ["Four sessions a month", "Lessons recorded for replay", "Digital sheet music"],
    featured: false,
  },
]

function isPast(isoDate: string) {
  return new Date(isoDate).getTime() < Date.now()
}

function formatIntakeDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function AdmissionsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bfx-shell grid items-center gap-14 pt-14 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="bfx-rise">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-bfx-cream-3 px-[15px] py-2 text-[13px] font-bold text-bfx-label">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-bfx-amber" />
            Now accepting students
          </span>
          <Eyebrow>ADMISSIONS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none">
            Joining takes
            <br />
            about a week
          </Display>
          <p className="bfx-pretty mb-8 max-w-[500px] text-[18px] leading-[1.65] text-bfx-body">
            No auditions and no entrance exam. Tell us what you want to play, we place you with a
            tutor at your level, and you start. Beginners are the majority of our intake.
          </p>
          <div className="flex flex-wrap gap-3">
            <PillLink variant="amber" size="xl" href="/courses">
              Browse courses
            </PillLink>
            <PillAnchor
              variant="outline"
              size="xl"
              href={SITE_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
            >
              Talk to admissions
            </PillAnchor>
          </div>
        </div>

        <div className="bfx-rise-2 relative">
          <div className="h-[460px] overflow-hidden rounded-[200px_200px_24px_24px] shadow-[0_30px_70px_-30px_rgba(16,26,40,0.35)] sm:h-[520px]">
            <MediaSlot
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=1400&fit=crop"
              alt="A group music lesson in progress"
              glyph="notes"
              glyphSize={130}
              loading="eager"
            />
          </div>
          {/* Static marketing copy — no enrolment count is read from the DB. */}
          <div className="absolute bottom-[34px] -left-2 flex items-center gap-[13px] rounded-[18px] border border-[#EDE5D9] bg-white px-[19px] py-[15px] shadow-[0_16px_36px_-14px_rgba(16,26,40,0.25)] sm:-left-7">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-xl bg-bfx-ink text-[17px] text-bfx-amber"
            >
              ♪
            </span>
            <div>
              <div className="text-[15px] font-extrabold tracking-[-0.01em]">Beginners welcome</div>
              <div className="text-[12.5px] font-semibold text-bfx-muted">
                Most students start from zero
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-[#EEE6DA] bg-white">
        <div className="bfx-shell py-[88px]">
          <div className="mb-11 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Eyebrow>HOW IT WORKS</Eyebrow>
              <Display as="h2" className="text-[clamp(32px,4vw,50px)] leading-[1.08]">
                Four steps,
                <br />
                no paperwork pile
              </Display>
            </div>
            <p className="bfx-pretty self-end text-[17px] leading-[1.65] text-bfx-body">
              We keep admissions light on purpose. The only thing we really need to get right is the
              tutor match. Everything else is scheduling.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-[22px] border border-bfx-border-4 bg-bfx-border-4 md:grid-cols-2">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="grid grid-cols-[52px_1fr] items-start gap-[22px] bg-bfx-cream px-[34px] py-8"
              >
                <div className="font-display text-[34px] leading-none text-bfx-bronze">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="mb-[7px] text-[20px] font-bold tracking-[-0.01em]">{step.title}</h3>
                  <p className="bfx-pretty m-0 text-[15.5px] leading-[1.6] text-bfx-body-2">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements + intakes */}
      <section className="bfx-shell grid items-start gap-14 py-[92px] lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div>
          <Eyebrow>WHAT WE ASK FOR</Eyebrow>
          <Display as="h2" className="mb-8 text-[clamp(32px,4vw,50px)] leading-[1.08]">
            The whole list
          </Display>
          <div className="grid gap-3.5 sm:grid-cols-2">
            {REQUIREMENTS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-[13px] rounded-2xl border border-bfx-border-5 bg-bfx-surface px-5 py-[19px]"
              >
                <CheckPip />
                <div>
                  <h3 className="mb-1.5 text-[15.5px] font-bold text-bfx-ink">{item.title}</h3>
                  <p className="m-0 text-[14.5px] leading-[1.55] text-bfx-body-2">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-bfx-border-6 bg-bfx-surface shadow-[0_24px_48px_-30px_rgba(16,26,40,0.28)]">
          <div className="border-b border-bfx-hair px-7 py-6">
            <div className="mb-1 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
              INTAKE
            </div>
            <div className="text-[19px] font-bold tracking-[-0.01em]">When you can start</div>
          </div>

          <div className="px-7 py-2">
            <div className="flex items-center justify-between gap-4 border-b border-bfx-hair py-[17px]">
              <span className="text-[15px] font-semibold text-bfx-strong">Rolling admissions</span>
              <span className="rounded-full bg-bfx-amber/[0.16] px-[11px] py-1.5 text-[12px] font-bold text-[#8A5B08]">
                Open year-round
              </span>
            </div>
            {INTAKES.map((intake, index) => {
              const past = isPast(intake.deadline)
              return (
                <div
                  key={intake.name}
                  className={`flex items-center justify-between gap-4 py-[17px] ${
                    index < INTAKES.length - 1 ? "border-b border-bfx-hair" : ""
                  }`}
                >
                  <span
                    className={`text-[15px] font-semibold ${past ? "text-bfx-muted-2" : "text-bfx-strong"}`}
                  >
                    {intake.name}
                  </span>
                  <span
                    className={`rounded-full px-[11px] py-1.5 text-[12px] font-bold ${
                      past
                        ? "bg-bfx-tint text-bfx-muted"
                        : "bg-bfx-ink/[0.06] text-bfx-label"
                    }`}
                  >
                    {past ? "Closed" : formatIntakeDate(intake.deadline)}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="border-t border-bfx-note-border bg-bfx-note-bg px-7 py-[18px] text-[14.5px] leading-[1.6] text-bfx-note-text">
            Missed a semester intake? It doesn&apos;t matter. Rolling admissions means we start you
            on the next available weekly slot.
          </div>
        </div>
      </section>

      {/* Tuition */}
      <section className="border-y border-[#EEE6DA] bg-white">
        <div className="bfx-shell py-[88px]">
          <div className="mb-11 max-w-[620px]">
            <Eyebrow>WHAT IT COSTS</Eyebrow>
            <Display as="h2" className="mb-4 text-[clamp(32px,4vw,50px)] leading-[1.08]">
              Fees, roughly
            </Display>
            <p className="bfx-pretty text-[17px] leading-[1.65] text-bfx-body">
              Every course prices its own formats, so treat these as a starting range rather than a
              quote. The course page shows the exact figure for the format you pick.
            </p>
          </div>

          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr))]">
            {TUITION.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-[22px] bg-bfx-surface px-7 py-8 ${
                  tier.featured
                    ? "border-[1.5px] border-bfx-ink shadow-[0_22px_44px_-24px_rgba(16,26,40,0.3)]"
                    : "border border-bfx-border"
                }`}
              >
                {tier.featured ? (
                  <span className="absolute -top-3 left-7 rounded-full bg-bfx-amber px-[11px] py-1.5 text-[11.5px] font-bold tracking-[0.03em] text-bfx-ink">
                    Most chosen
                  </span>
                ) : null}
                <h3 className="text-[21px] font-bold tracking-[-0.015em]">{tier.name}</h3>
                <p className="mt-1 mb-5 text-[14px] font-semibold text-bfx-muted">{tier.blurb}</p>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-bfx-muted-2">from</span>
                  <span className="font-display text-[38px] leading-none tracking-[-0.02em]">
                    {tier.from}
                  </span>
                  <span className="text-[13.5px] font-semibold text-bfx-muted">/ month</span>
                </div>
                <ul className="m-0 flex list-none flex-col gap-[11px] p-0">
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-center gap-[10px] text-[14.5px] text-bfx-strong">
                      <span
                        aria-hidden
                        className="grid h-4 w-4 flex-none place-items-center rounded-full bg-bfx-ink text-[9px] text-bfx-amber"
                      >
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[18px] border border-bfx-note-border bg-bfx-note-bg px-6 py-5">
            <p className="bfx-pretty m-0 max-w-[560px] text-[14.5px] leading-[1.6] text-bfx-note-text">
              These are indicative. Real prices are set per course and per format, and a ₦5,000
              registration fee holds your spot at enrolment. Sibling discounts and split payments
              are available. Just ask.
            </p>
            <PillLink variant="ink" size="md" href="/courses">
              See real prices →
            </PillLink>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bfx-shell pt-[92px] pb-[100px]">
        <div className="relative overflow-hidden rounded-[28px] px-[clamp(28px,4vw,60px)] py-[clamp(44px,5vw,76px)] bg-[linear-gradient(115deg,#101A28_0%,#1C2C42_55%,#4A3512_100%)]">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <Display
                as="h2"
                className="mb-3.5 text-[clamp(32px,3.6vw,46px)] leading-[1.08] text-white"
              >
                Ready when you are.
              </Display>
              <p className="bfx-pretty m-0 max-w-[490px] text-[17.5px] leading-[1.6] text-bfx-on-dark-2">
                Tell us what you want to play and we place you with a tutor at your level.
                Admissions are rolling, so you start on the next available weekly slot.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PillLink variant="amberOnInk" size="xl" href={ENROL_HREF}>
                {ENROL_LABEL}
              </PillLink>
              <PillAnchor variant="outlineOnInk" size="xl" href={SITE_PHONE_TEL}>
                Call {SITE_PHONE_DISPLAY}
              </PillAnchor>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
