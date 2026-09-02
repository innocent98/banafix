/**
 * Home — "Banafix Redesign.dc.html", the `isHome` screen.
 *
 * Server component. It reads published courses straight from Prisma rather
 * than fetching its own `/api/courses` route: same filters, but no client
 * waterfall, no self-HTTP hop, and no 10-row default page size to work around.
 * The filter set mirrors `app/api/courses/route.ts` exactly (published +
 * active + inside the 30-day expiry window) so the home grid can never show a
 * course that /courses would hide.
 *
 * Header and footer come from `app/(site)/layout.tsx` — not rendered here.
 */
import type { Prisma } from "@prisma/client"

import { CtaBand } from "@/components/site/home/cta-band"
import { FeaturedCourses, type FeaturedCourse } from "@/components/site/home/featured-courses"
import { HomeHero } from "@/components/site/home/home-hero"
import { HowYouLearn, type HomeFormat } from "@/components/site/home/how-you-learn"
import { Testimonials } from "@/components/site/home/testimonials"
import { TrustedBy } from "@/components/site/home/trusted-by"
import { WhyBanafix } from "@/components/site/home/why-banafix"
import { getCourseExpirationCutoff } from "@/lib/course-utils"
import { prisma } from "@/lib/prisma"

/**
 * Courses expire on a rolling 30-day window and admins publish at will, so the
 * homepage is rendered per request rather than baked at build time (which
 * would also require a database during `next build`).
 */
export const dynamic = "force-dynamic"

/** How many cards the featured grid shows. The handoff renders four. */
const FEATURED_COUNT = 4

type CourseRow = {
  id: string
  title: string
  level: string
  image: string | null
  instrument: string
  availableModes: string[]
  pricing: Prisma.JsonValue
}

type ModeRow = { id: string; name: string }

/**
 * Turns the active `DeliveryMode` rows into the figures the ink section
 * renders, using only what the database actually holds: the canonical name,
 * how many publicly visible courses offer the mode, and the lowest real price
 * among them.
 *
 * `availableModes` is the authoritative "offers this" list —
 * `app/api/enrollments/route.ts:104` validates against it — so a stale key
 * left behind in the `pricing` JSON is ignored, and a mode no course offers
 * keeps a null price rather than borrowing one.
 */
function buildFormats(modes: readonly ModeRow[], courses: readonly CourseRow[]): HomeFormat[] {
  return modes.map((mode) => {
    let from: number | null = null
    let courseCount = 0

    for (const course of courses) {
      if (!course.availableModes.includes(mode.name)) continue
      courseCount += 1

      const pricing = course.pricing
      if (typeof pricing !== "object" || pricing === null || Array.isArray(pricing)) continue

      const value = (pricing as Record<string, unknown>)[mode.name]
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue
      if (from === null || value < from) from = value
    }

    return { id: mode.id, name: mode.name, from, courseCount }
  })
}

async function getPublishedCourses(): Promise<CourseRow[]> {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      isActive: true,
      // A course expires 30 days after its session start; one without a start
      // date never expires. Mirrors the public API's window.
      OR: [
        { sessionStartDate: null },
        { sessionStartDate: { gte: getCourseExpirationCutoff() } },
      ],
    },
    orderBy: [{ sessionStartDate: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      level: true,
      image: true,
      instrument: true,
      availableModes: true,
      pricing: true,
    },
  })
}

/** The delivery formats the ink section lists, straight off the `DeliveryMode` table. */
async function getActiveDeliveryModes(): Promise<ModeRow[]> {
  return prisma.deliveryMode.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  })
}

export default async function HomePage() {
  // Independent queries, so they run together rather than in a waterfall.
  const [courses, modes] = await Promise.all([getPublishedCourses(), getActiveDeliveryModes()])

  const featured: FeaturedCourse[] = courses.slice(0, FEATURED_COUNT).map((course) => ({
    id: course.id,
    title: course.title,
    level: course.level,
    image: course.image,
    instrument: course.instrument,
  }))

  return (
    <>
      <HomeHero />
      <TrustedBy />
      <FeaturedCourses courses={featured} total={courses.length} />
      <WhyBanafix />
      <HowYouLearn formats={buildFormats(modes, courses)} />
      <Testimonials />
      <CtaBand />
    </>
  )
}
