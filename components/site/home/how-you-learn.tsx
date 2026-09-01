/**
 * "HOW YOU LEARN" — handoff `isHome`, the ink <section>.
 *
 * Mixed data. The three names, blurbs, bullet points and photos are STATIC
 * MARKETING COPY — no DB field describes a delivery mode's benefits. The
 * "from ₦X" price is REAL: the page computes, per canonical delivery mode, the
 * minimum `course.pricing[mode]` across every published course that lists that
 * mode in `availableModes`. If no course offers a mode, the price line is
 * omitted rather than invented.
 */
import { MediaSlot } from "@/components/site/media-slot"
import { CheckPip, Display, Eyebrow } from "@/components/site/primitives"
import { formatNaira } from "@/lib/site"

/** Minimum real price per canonical delivery-mode name, keyed as in `pricing`. */
export type FormatPrices = Readonly<Record<string, number | undefined>>

/**
 * Static marketing copy, except `mode` — that is the canonical delivery-mode
 * name (`On-site` / `Online` / `Home Training`) the price is looked up under.
 * Photos are the handoff's own Unsplash picks; images.unsplash.com is
 * allowlisted in next.config.ts.
 */
const FORMATS = [
  {
    name: "At the studio",
    mode: "On-site",
    photo:
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1400&q=70",
    alt: "Studio lesson room",
    blurb: "Weekly slot in our Lekki rooms, with instruments and practice space provided.",
    points: ["Full instrument access", "Practice rooms before class", "Termly recital"],
  },
  {
    name: "Online",
    mode: "Online",
    photo:
      "https://images.unsplash.com/photo-1593697820940-43e77b53a1e1?auto=format&fit=crop&w=1400&q=70",
    alt: "Student on a video lesson",
    blurb: "Live video lessons with your tutor, recorded so you can review the tricky parts.",
    points: ["Lessons recorded for replay", "Digital sheet music", "Reschedule up to 24h before"],
  },
  {
    name: "Home training",
    mode: "Home Training",
    photo:
      "https://images.unsplash.com/photo-1540593463874-59835505e99d?auto=format&fit=crop&w=1400&q=70",
    alt: "Tutor teaching at a home piano",
    blurb: "Your tutor travels to you anywhere on the Lekki–Ajah axis, at a time you choose.",
    points: ["Tutor comes to you", "Family and sibling discounts", "Equipment brought along"],
  },
] as const

export function HowYouLearn({ prices }: { prices: FormatPrices }) {
  return (
    <section className="bg-bfx-ink text-white">
      <div className="bfx-shell py-[88px]">
        <div className="mb-[46px] max-w-[560px]">
          <Eyebrow onInk>HOW YOU LEARN</Eyebrow>
          <Display as="h2" className="text-[clamp(32px,4vw,50px)] leading-[1.08]">
            Three ways to take a lesson
          </Display>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6">
          {FORMATS.map((format) => {
            const from = prices[format.mode]
            return (
              <div
                key={format.name}
                className="overflow-hidden rounded-[22px] border border-bfx-line-dark bg-bfx-ink-2"
              >
                <div className="relative h-[200px] bg-bfx-ink-3">
                  <MediaSlot
                    src={format.photo}
                    alt={format.alt}
                    glyph="beamed"
                    glyphSize={76}
                    tone="dark"
                  />
                </div>
                <div className="px-7 pt-[26px] pb-[30px]">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="text-[21px] font-bold tracking-[-0.01em]">{format.name}</div>
                    {/* Omitted entirely when no published course offers this mode. */}
                    {typeof from === "number" ? (
                      <div className="text-[13.5px] font-bold whitespace-nowrap text-bfx-amber">
                        from {formatNaira(from)}
                      </div>
                    ) : null}
                  </div>
                  <div className="mb-5 text-[15px] leading-[1.6] text-bfx-on-dark-4">
                    {format.blurb}
                  </div>
                  <div className="flex flex-col gap-[9px]">
                    {format.points.map((point) => (
                      <div
                        key={point}
                        className="flex items-center gap-2.5 text-sm font-medium text-bfx-on-dark"
                      >
                        <CheckPip onInk />
                        {point}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
