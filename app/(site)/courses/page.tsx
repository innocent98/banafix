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
import Link from "next/link"

import { CourseCard, type CourseCardData } from "@/components/site/courses/course-card"
import { CourseFilterBar } from "@/components/site/courses/course-filter-bar"
import {
  fromPrice,
  publicCourseWhere,
  sortLevels,
  toPricing,
} from "@/components/site/courses/course-data"
import { Display, Eyebrow, PillLink } from "@/components/site/primitives"
import { prisma } from "@/lib/prisma"
import { TRIAL_HREF } from "@/lib/site"

export const metadata: Metadata = {
  title: "Courses | Banafix",
  description:
    "Every Banafix course, with what you will be able to do by the end, what to bring, and the formats you can learn in.",
}

interface CoursesPageProps {
  searchParams: Promise<{ level?: string; instrument?: string }>
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const { level: levelParam, instrument: instrumentParam } = await searchParams
  const instrument = instrumentParam?.trim() || null
  const requestedLevel = levelParam?.trim() || null

  const rows = await prisma.course.findMany({
    where: {
      ...publicCourseWhere(),
      ...(instrument ? { instrument } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      duration: true,
      image: true,
      availableModes: true,
      pricing: true,
    },
    orderBy: [{ sessionStartDate: "asc" }, { updatedAt: "desc" }],
  })

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
    const pricing = toPricing(course.pricing)
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      duration: course.duration,
      image: course.image,
      formatCount: course.availableModes.length,
      fromPrice: fromPrice(pricing),
    }
  })

  const isFiltered = Boolean(requestedLevel || instrument)

  return (
    <div className="bfx-rise">
      <section className="bfx-shell pb-[34px] pt-16">
        <div className="max-w-[640px]">
          <Eyebrow>COURSES</Eyebrow>
          {/* The handoff heading reads "Twelve-week programmes". `duration` is
              a real per-course field and varies, so the copy states the shape
              of a programme without asserting a length the data contradicts. */}
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none text-bfx-ink">
            Structured programmes
          </Display>
          <p className="bfx-pretty text-[18px] leading-relaxed text-bfx-body">
            Every course sets out what you will be able to do by the end, what to bring, and the
            formats you can take it in.
          </p>
        </div>
      </section>

      <CourseFilterBar
        levels={levels}
        activeLevel={activeLevel}
        instrument={instrument}
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
              instrument
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
            body="New terms are added as they open. Book a free trial and we will match you with a tutor in the meantime."
            action={
              <>
                <PillLink href={TRIAL_HREF} variant="amber" size="md">
                  Book a free trial
                </PillLink>
                <Link
                  href="/contact"
                  className="text-[14.5px] font-semibold text-bfx-bronze underline-offset-4 hover:underline"
                >
                  Talk to us
                </Link>
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
