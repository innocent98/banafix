/**
 * "STUDENTS · In their words" — handoff `isHome`, sixth <section>.
 *
 * STATIC MARKETING COPY. There is no Testimonial (or Review) model in Prisma,
 * so the handoff's three quotes ship verbatim as copy rather than being faked
 * per student. Avatars have no source, so MediaSlot renders its designed empty
 * state; the handoff's own avatar slot is a flat #EDE4D5 disc, so the glyph is
 * kept small enough to read as texture.
 */
import { MediaSlot } from "@/components/site/media-slot"
import { Display, Eyebrow } from "@/components/site/primitives"

/** Static marketing copy — not sourced from the database. */
const TESTIMONIALS = [
  {
    quote:
      "I had wanted to play violin for fifteen years. Six months in, I played at my own church.",
    name: "Adunni Okafor",
    role: "Violin, adult beginner",
  },
  {
    quote: "Home training meant my daughter never missed a lesson through Lagos traffic.",
    name: "Fatima Hassan",
    role: "Parent, piano student",
  },
  {
    quote:
      "The structure is what did it. Clear goals every four weeks, and I could hear the progress.",
    name: "James Okoro",
    role: "Guitar, grade 5",
  },
] as const

export function Testimonials() {
  return (
    <section className="bfx-shell py-[92px]">
      <Eyebrow>STUDENTS</Eyebrow>
      <Display as="h2" className="mb-[46px] text-[clamp(32px,4vw,50px)] leading-[1.08]">
        In their words
      </Display>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6">
        {TESTIMONIALS.map((item) => (
          <figure
            key={item.name}
            className="m-0 flex flex-col justify-between gap-6 rounded-[22px] border border-bfx-border bg-white px-[30px] pt-[30px] pb-[26px]"
          >
            <blockquote className="m-0 font-display text-[23px] leading-[1.35] tracking-[-0.01em] text-[#1A2534]">
              &ldquo;{item.quote}&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-[13px] border-t border-bfx-hair-2 pt-5">
              <div className="relative h-11 w-11 flex-none overflow-hidden rounded-full bg-[#EDE4D5]">
                {/* The handoff's avatar slot is a bare #EDE4D5 disc — no gradient, no
                    glyph. At 44px the glyph empty state reads as an icon. */}
                <MediaSlot src={null} alt="" bare="#EDE4D5" />
              </div>
              <div>
                <div className="text-[15px] font-bold">{item.name}</div>
                <div className="text-[13px] font-semibold text-bfx-muted">{item.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
