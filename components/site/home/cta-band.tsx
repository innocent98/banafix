/**
 * Closing CTA band — handoff `isHome`, final <section>.
 *
 * The gradient is the handoff's exactly: a #B0730C base under a 115deg ink →
 * ink-3 → bronze-brown ramp. Static marketing copy throughout.
 */
import { Display, PillLink } from "@/components/site/primitives"
import { TRIAL_HREF } from "@/lib/site"

export function CtaBand() {
  return (
    <section className="bfx-shell pb-[100px]">
      <div className="relative grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] items-center gap-12 overflow-hidden rounded-[28px] bg-bfx-bronze bg-[linear-gradient(115deg,#101A28_0%,#1C2C42_55%,#4A3512_100%)] px-[clamp(28px,4vw,60px)] py-[clamp(44px,5vw,76px)]">
        <div>
          <Display
            as="h2"
            className="mb-3.5 text-[clamp(32px,3.6vw,46px)] leading-[1.08] text-white"
          >
            Your first lesson is free.
          </Display>
          <p className="max-w-[490px] text-[17.5px] leading-[1.6] text-bfx-on-dark-2">
            Thirty minutes with a tutor, no card required. You&rsquo;ll leave knowing whether this
            is for you.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PillLink href={TRIAL_HREF} variant="amberOnInk" size="xl">
            Book a free trial
          </PillLink>
          {/* Handoff pads this one to 28px, not the shared 30px. */}
          <PillLink href="/contact" variant="outlineOnInk" size="xl" className="px-7">
            Talk to us
          </PillLink>
        </div>
      </div>
    </section>
  )
}
