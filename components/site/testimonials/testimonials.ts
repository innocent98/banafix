/**
 * Testimonial content for /testimonials.
 *
 * STATIC MARKETING COPY — there is no Testimonial model in Prisma and no API
 * that returns these. Every quote, name, instrument, level and course name
 * below is hardcoded page copy carried over verbatim from the previous page.
 *
 * Two fields the old page carried were dropped rather than restyled:
 *   • `image` / `thumbnail` pointed at files that do not exist in /public
 *     (/student-avatar.jpg, /guitar-course.jpg, …), so every avatar was a
 *     broken image. The portraits now render MediaSlot's designed empty state,
 *     which is what the handoff's own testimonial avatars do.
 *   • `type: "video"` + `videoUrl: "#"` drove a "Play Video" button that played
 *     nothing. There are no videos, so there is no play affordance.
 *
 * The instrument and level filters are DERIVED from this array — the old page
 * hardcoded a "Production" instrument chip that matched zero testimonials.
 */

export interface Testimonial {
  id: number
  name: string
  instrument: string
  level: string
  /** 1–5. Every entry the page shipped with is a 5. */
  rating: number
  quote: string
  course: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    instrument: "Piano",
    level: "Intermediate",
    rating: 5,
    quote:
      "Banafix transformed my piano skills completely. The structured approach and amazing instructors made learning enjoyable and effective.",
    course: "Advanced Piano Mastery",
  },
  {
    id: 2,
    name: "Michael Chen",
    instrument: "Guitar",
    level: "Beginner",
    rating: 5,
    quote: "From zero to hero in 6 months! Watch my journey.",
    course: "Guitar Fundamentals",
  },
  {
    id: 3,
    name: "Grace Adebayo",
    instrument: "Vocals",
    level: "Advanced",
    rating: 5,
    quote:
      "The vocal training program helped me discover my true voice. I'm now performing professionally thanks to Banafix!",
    course: "Professional Vocal Training",
  },
  {
    id: 4,
    name: "David Williams",
    instrument: "Drums",
    level: "Intermediate",
    rating: 5,
    quote: "My drumming performance after 3 months at Banafix",
    course: "Rhythm & Beats Mastery",
  },
  {
    id: 5,
    name: "Alex Thompson",
    instrument: "Violin",
    level: "Beginner",
    rating: 5,
    quote:
      "Never thought I could play violin at my age. Banafix proved me wrong with their patient and skilled instructors.",
    course: "Violin for Adults",
  },
  {
    id: 6,
    name: "Emma Rodriguez",
    instrument: "Piano",
    level: "Advanced",
    rating: 5,
    quote:
      "The music production course opened up a whole new world for me. Now I'm creating my own compositions!",
    course: "Music Production & Composition",
  },
]

/** Instruments that actually appear in the data, in first-seen order. */
export function testimonialInstruments(items: Testimonial[]): string[] {
  return Array.from(new Set(items.map((item) => item.instrument)))
}

/** Levels that actually appear, ordered beginner → advanced where possible. */
export function testimonialLevels(items: Testimonial[]): string[] {
  const order = ["Beginner", "Intermediate", "Advanced"]
  const present = new Set(items.map((item) => item.level))
  const known = order.filter((level) => present.has(level))
  const extra = Array.from(present).filter((level) => !order.includes(level))
  return [...known, ...extra]
}
