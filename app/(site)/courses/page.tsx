/**
 * Courses list — "Banafix Redesign.dc.html", `isCourses`.
 *
 * Server component throughout: the level chips and the `?instrument=` deep link
 * from the footer are URL state, so nothing here needs to hydrate.
 *
 * Data note: this reads Prisma directly instead of calling `/api/courses`.
 * That route defaults to `limit=10` and the page it replaces passed no limit,
 * so the eleventh course onwards silently disappeared. `publicCourseWhere()`
 * reproduces the route's published/active/not-expired predicate exactly.
 */
import type { Metadata } from "next"

import { CourseCard, type CourseCardData } from "@/components/site/courses/course-card"
import { CourseFilterBar, coursesHref } from "@/components/site/courses/course-filter-bar"
import { publicCourseWhere, sortLevels } from "@/components/site/courses/course-data"
import { LocationChooser } from "@/components/site/location-chooser"
import { Display, Eyebrow, PillLink } from "@/components/site/primitives"
import {
  courseFromRate,
  getActiveLocations,
  getOfferingsByCourse,
  offerableOfferingWhere,
} from "@/lib/offerings"
import { prisma } from "@/lib/prisma"
import { SITE_WHATSAPP } from "@/lib/site"

export const metadata: Metadata = {
  title: "Courses | Banafix",
  description:
    "Every Banafix course, with what you will be able to do by the end, what to bring, and the formats you can learn in.",
}

interface CoursesPageProps {
  searchParams: Promise<{ level?: string; instrument?: string; location?: string }>
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const {
    level: levelParam,
    instrument: instrumentParam,
    location: locationParam,
  } = await searchParams
  const instrument = instrumentParam?.trim() || null
  const requestedLevel = levelParam?.trim() || null

  // The chosen location comes from `?location=<slug>`. A slug that is not an active location is
  // treated as "no location" so a stale link still shows the whole catalogue.
  const locations = await getActiveLocations()
  const activeLocation = locations.find((l) => l.slug === locationParam?.trim()) ?? null

  const rows = await prisma.course.findMany({
    where: {
      ...publicCourseWhere(),
      ...(instrument ? { instrument } : {}),
      // With a location: only courses that have an offerable offering there.
      ...(activeLocation
        ? { offerings: { some: offerableOfferingWhere(activeLocation.id) } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      instrument: true,
      level: true,
      duration: true,
      image: true,
    },
    orderBy: [{ sessionStartDate: "asc" }, { updatedAt: "desc" }],
  })

  // Card captions come from offerable offerings only (scoped to the location when chosen), never
  // from the deprecated `Course.pricing`.
  const offeringsByCourse = await getOfferingsByCourse(
    rows.map((course) => course.id),
    activeLocation?.id,
  )

  // Chip set = the distinct levels actually present, not a hardcoded trio. It
  // is derived after the instrument filter so no chip can lead to nothing.
  const levels = sortLevels([...new Set(rows.map((course) => course.level))])

  // A level from a stale URL that no longer exists is treated as "no filter"
  // for the chips but still filters the grid, so the empty state explains it.
  const activeLevel = requestedLevel && levels.includes(requestedLevel) ? requestedLevel : null
  const visible = requestedLevel
    ? rows.filter((course) => course.level === requestedLevel)
    : rows

  const cards: CourseCardData[] = visible.map((course) => {
    const offerings = offeringsByCourse.get(course.id) ?? []
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      duration: course.duration,
      image: course.image,
      instrument: course.instrument,
      formatCount: new Set(offerings.map((offering) => offering.format)).size,
      fromRatePerClass: courseFromRate(offerings),
      locationSlug: activeLocation?.slug ?? null,
    }
  })

  const isFiltered = Boolean(requestedLevel || instrument || activeLocation)

  return (
    <div className="bfx-rise">
      <section className="bfx-shell pb-[34px] pt-16">
        <div className="max-w-[640px]">
          <Eyebrow>COURSES</Eyebrow>
          {/* The handoff heading read "Twelve-week programmes". A course is a set
              of modules (normally twelve) with no fixed length in weeks, so
              the heading states the shape of a programme without a duration. */}
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none text-bfx-ink">
            Structured programmes
          </Display>
          <p className="bfx-pretty text-[18px] leading-relaxed text-bfx-body">
            Every course sets out what you will be able to do by the end, what to bring, and the
            formats you can take it in.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-6">
        <LocationChooser
          locations={locations}
          activeSlug={activeLocation?.slug ?? null}
          allLabel="All locations"
          hrefFor={(slug) => coursesHref({ location: slug, instrument, level: activeLevel })}
        />
      </section>

      <CourseFilterBar
        levels={levels}
        activeLevel={activeLevel}
        instrument={instrument}
        location={activeLocation?.slug ?? null}
        count={cards.length}
      />

      <section className="bfx-shell pb-[100px] pt-3">
        {cards.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6">
            {cards.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : isFiltered ? (
          <EmptyPanel
            heading="Nothing matches that filter"
            body={
              activeLocation
                ? `No course matches that filter at ${activeLocation.name} right now. Try another location or clear the filter to see everything.`
                : instrument
                  ? `We have no published ${instrument.toLowerCase()} course${requestedLevel ? ` at ${requestedLevel.toLowerCase()} level` : ""} right now. Clear the filter to see everything currently running.`
                  : "No course is running at that level right now. Clear the filter to see everything currently running."
            }
            action={
              <PillLink href="/courses" variant="ink" size="md">
                Show all courses
              </PillLink>
            }
          />
        ) : (
          <EmptyPanel
            heading="No courses published yet"
            body="New terms are added as they open. Tell us the instrument you want to learn and we will let you know as soon as the next one is announced."
            action={
              <>
                <PillLink href="/contact" variant="amber" size="md">
                  Talk to us
                </PillLink>
                <a
                  href={SITE_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14.5px] font-semibold text-bfx-bronze underline-offset-4 hover:underline"
                >
                  Message us on WhatsApp
                </a>
              </>
            }
          />
        )}
      </section>
    </div>
  )
}

/** Designed empty state — the two variants share the panel, not the copy. */
function EmptyPanel({
  heading,
  body,
  action,
}: {
  heading: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-bfx-border-2 bg-bfx-surface px-6 py-16 text-center">
      <span aria-hidden className="block font-display text-[56px] leading-none text-bfx-ink/10">
        ♪
      </span>
      <h2 className="mt-4 text-[22px] font-bold tracking-[-0.015em] text-bfx-ink">{heading}</h2>
      <p className="bfx-pretty mx-auto mt-3 max-w-[420px] text-[15.5px] leading-relaxed text-bfx-body-2">
        {body}
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-4">{action}</div>
    </div>
  )
}
