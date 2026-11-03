/**
 * Home hero — "Banafix Redesign.dc.html", `isHome` block, first <section>.
 *
 * Server component: nothing here is interactive. Both CTAs are navigations,
 * so they are <PillLink>s rather than buttons.
 *
 * The figures row is admin-managed (`SiteStat`) and omitted when none are
 * published. The earlier "3,200 alumni" claim and the "4.9 / 5 from 412 student
 * reviews" card were removed: no data backed either. The "SINCE 2016" pill is
 * still static copy pending John's confirmation of the founding year.
 */
import { MediaSlot } from "@/components/site/media-slot"
import { Display, PillLink } from "@/components/site/primitives"
import { ENROL_HREF, ENROL_LABEL } from "@/lib/site"
import type { PublicStat } from "@/lib/site-content-queries"

/**
 * The handoff's hero photo (`bfx-hero` slot). images.unsplash.com is already
 * allowlisted in next.config.ts; MediaSlot renders a plain <img> by design.
 */
const HERO_PHOTO =
  "https://images.unsplash.com/photo-1696522732406-065ef560da8c?auto=format&fit=crop&w=1400&q=70"

export function HomeHero({ stats }: { stats: PublicStat[] }) {
  return (
    <section className="bfx-shell grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] items-center gap-16 pt-[72px] pb-10">
      <div className="bfx-rise">
        {/* Badge pill — 7px 14px 7px 8px, #F1EAE0 on a #E4DACB hairline. */}
        <div className="mb-[26px] inline-flex items-center gap-[9px] rounded-full border border-bfx-border-2 bg-bfx-cream-3 py-[7px] pr-[14px] pl-2">
          <span className="rounded-full bg-bfx-ink px-[9px] py-1 text-[11px] font-bold tracking-[0.06em] text-bfx-amber">
            SINCE 2016
          </span>
          <span className="text-[13px] font-semibold text-[#4A5769]">
            Music academy in Lekki, Lagos
          </span>
        </div>

        <Display as="h1" className="mb-[22px] text-[clamp(44px,6vw,78px)] leading-none">
          Learn the instrument
          <br />
          you&rsquo;ve always meant
          <br />
          to <em className="italic text-bfx-bronze">play.</em>
        </Display>

        <p className="mb-[34px] max-w-[470px] text-[18.5px] leading-[1.6] text-bfx-body">
          One-on-one tuition with performing musicians, in our Lekki studio, at your home, or
          online. Choose your instrument, choose how you want to be taught, and enrol for the
          coming term.
        </p>

        <div className="mb-[46px] flex flex-wrap gap-3">
          <PillLink href={ENROL_HREF} variant="amber" size="lg">
            {ENROL_LABEL} →
          </PillLink>
          {/* Handoff pads this one to 26px, not the shared 28px. The primary CTA
              already goes to /courses, so the secondary is the other channel. */}
          <PillLink href="/contact" variant="outline" size="lg" className="px-[26px]">
            Talk to us first
          </PillLink>
        </div>

        {stats.length > 0 ? (
          <div className="flex flex-wrap gap-x-11 gap-y-6 border-t border-[#E4DBCC] pt-[30px]">
            {stats.map((stat) => (
              <div key={stat.id}>
                <div className="font-display text-[38px] leading-none">{stat.value}</div>
                <div className="text-[13px] font-semibold tracking-[0.02em] text-bfx-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="bfx-rise-2 relative">
        {/* The arch: 200px 200px 24px 24px, 560px tall. */}
        <div className="relative h-[560px] overflow-hidden rounded-[200px_200px_24px_24px] bg-[#EDE5D9] shadow-[0_30px_70px_-30px_rgba(16,26,40,0.35)]">
          <MediaSlot
            src={HERO_PHOTO}
            alt="A student at the keyboard during a lesson"
            glyph="notes"
            glyphSize={150}
            loading="eager"
          />
        </div>
      </div>
    </section>
  )
}
