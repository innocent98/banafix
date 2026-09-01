/**
 * "WHY BANAFIX" — handoff `isHome`, fourth <section>.
 *
 * All three rows are static marketing copy; nothing in Prisma backs them.
 *
 * The right column is a 2px-gap grid on a #E7DECF ground with #FAF6F0 rows, so
 * the gaps read as hairline rules without any border on the rows themselves.
 */
import { Display, Eyebrow } from "@/components/site/primitives"

/** Static marketing copy. */
const REASONS = [
  {
    num: "01",
    title: "A tutor matched to you",
    body: "We pair every student with a tutor by instrument, level, and temperament — and you can switch after any lesson.",
  },
  {
    num: "02",
    title: "Progress you can hear",
    body: "Twelve-week programmes with clear milestones, a termly recital, and written feedback after every fourth lesson.",
  },
  {
    num: "03",
    title: "Instruments provided",
    body: "Rent from us for the first term, or use our studio instruments at no extra cost until you're ready to buy.",
  },
] as const

export function WhyBanafix() {
  return (
    <section className="bfx-shell grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-[70px] py-[92px]">
      <div>
        <Eyebrow>WHY BANAFIX</Eyebrow>
        <Display as="h2" className="mb-5 text-[clamp(32px,4vw,50px)] leading-[1.08]">
          Ten years of
          <br />
          patient teaching.
        </Display>
        <p className="text-[17px] leading-[1.65] text-bfx-body">
          Every tutor here performs professionally and is trained to teach. Whether your child is
          picking up a first recorder or you&rsquo;re preparing for grade exams, the plan is built
          around you.
        </p>
      </div>

      <div className="grid gap-0.5 overflow-hidden rounded-[22px] border border-bfx-border-4 bg-bfx-border-4">
        {REASONS.map((reason) => (
          <div
            key={reason.num}
            className="grid grid-cols-[52px_1fr] items-start gap-[22px] bg-bfx-cream px-[34px] py-8"
          >
            <div className="font-display text-[34px] leading-none text-bfx-bronze">
              {reason.num}
            </div>
            <div>
              <div className="mb-[7px] text-[20px] font-bold tracking-[-0.01em]">
                {reason.title}
              </div>
              <div className="text-[15.5px] leading-[1.6] text-bfx-body-2">{reason.body}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
