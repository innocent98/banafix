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
import { CtaBand } from "@/components/site/home/cta-band"
import { FeaturedCourses, type FeaturedCourse } from "@/components/site/home/featured-courses"
import { HomeHero } from "@/components/site/home/home-hero"
import { HowYouLearn, type HomeFormat } from "@/components/site/home/how-you-learn"
import { Testimonials } from "@/components/site/home/testimonials"
import { TrustedBy } from "@/components/site/home/trusted-by"
import { WhyBanafix } from "@/components/site/home/why-banafix"
import { getCourseExpirationCutoff } from "@/lib/course-utils"
import { fromRate } from "@/lib/offering-rates"
import { offerableOfferingWhere } from "@/lib/offerings"
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
}

type ModeRow = { id: string; name: string }

/** One offerable offering, reduced to what the formats section needs. */
type OfferingRow = {
  courseId: string
  deliveryModeId: string
  rates: { durationMins: number; pricePerClass: number }[]
}

/**
 * Turns the active `DeliveryMode` rows into the figures the ink section
 * renders, using only what the database actually holds: the canonical name,
 * how many publicly visible courses are offered in the format, and the lowest
 * per-class rate among those offerings.
 *
 * Only offerable offerings count (active offering, active location, at least
 * one rate), so a format nobody can enrol in keeps a null price and a zero
 * count rather than borrowing a number from somewhere else.
 */
function buildFormats(modes: readonly ModeRow[], offerings: readonly OfferingRow[]): HomeFormat[] {
  return modes.map((mode) => {
    const mine = offerings.filter((offering) => offering.deliveryModeId === mode.id)
    const from = fromRate(mine.flatMap((offering) => offering.rates))
    const courseCount = new Set(mine.map((offering) => offering.courseId)).size
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
    },
  })
}

/** Offerable offerings of publicly visible courses. */
async function getOfferableOfferings(): Promise<OfferingRow[]> {
  return prisma.courseOffering.findMany({
    where: {
      ...offerableOfferingWhere(),
      course: {
        isPublished: true,
        isActive: true,
        OR: [
          { sessionStartDate: null },
          { sessionStartDate: { gte: getCourseExpirationCutoff() } },
        ],
      },
    },
    select: { courseId: true, deliveryModeId: true, rates: { select: { durationMins: true, pricePerClass: true } } },
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
  const [courses, modes, offerings] = await Promise.all([
    getPublishedCourses(),
    getActiveDeliveryModes(),
    getOfferableOfferings(),
  ])

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
      <HowYouLearn formats={buildFormats(modes, offerings)} />
      <Testimonials />
      <CtaBand />
    </>
  )
}
