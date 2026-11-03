/**
 * "STUDENTS · In their words" — handoff `isHome`, sixth <section>.
 *
 * Renders only testimonials an admin has published with the person's
 * permission. With none, the whole section is omitted rather than filled.
 */
import { Display, Eyebrow, PillLink } from "@/components/site/primitives"
import { TestimonialCard } from "@/components/site/testimonials/testimonial-card"
import type { PublicTestimonial } from "@/lib/site-content-queries"

/** How many cards the home page shows; /testimonials has the rest. */
const HOME_COUNT = 6

export function Testimonials({ testimonials }: { testimonials: PublicTestimonial[] }) {
  if (testimonials.length === 0) return null
  const shown = testimonials.slice(0, HOME_COUNT)

  return (
    <section className="bfx-shell py-[92px]">
      <Eyebrow>STUDENTS</Eyebrow>
      <Display as="h2" className="mb-[46px] text-[clamp(32px,4vw,50px)] leading-[1.08]">
        In their words
      </Display>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6">
        {shown.map((item) => (
          <TestimonialCard key={item.id} item={item} />
        ))}
      </div>

      {testimonials.length > shown.length ? (
        <div className="mt-8">
          <PillLink href="/testimonials" variant="outline" size="md">
            More student stories
          </PillLink>
        </div>
      ) : null}
    </section>
  )
}
