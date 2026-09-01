/**
 * Featured courses — handoff `isHome`, third <section> (the white band).
 *
 * Real data: the four cards and the "All N courses" count both come from the
 * published Course rows the page reads in `app/(site)/page.tsx`. Nothing on
 * the card is invented — "Multiple skill levels" is the handoff's own fixed
 * sub-label, not a per-course value.
 */
import Link from "next/link"

import { MediaSlot } from "@/components/site/media-slot"
import { Display, Eyebrow, LevelBadge, PillLink } from "@/components/site/primitives"

export interface FeaturedCourse {
  id: string
  title: string
  level: string
  image: string | null
}

export function FeaturedCourses({
  courses,
  total,
}: {
  courses: readonly FeaturedCourse[]
  total: number
}) {
  return (
    <section className="border-t border-b border-[#EEE6DA] bg-white">
      <div className="bfx-shell py-[88px]">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-10">
          <div>
            <Eyebrow>COURSES</Eyebrow>
            <Display as="h2" className="text-[clamp(32px,4vw,50px)] leading-[1.08]">
              Pick an instrument.
              <br />
              We&rsquo;ll build the path.
            </Display>
          </div>
          {total > 0 ? (
            <PillLink href="/courses" variant="outlineSoft" size="md">
              All {total} {total === 1 ? "course" : "courses"} →
            </PillLink>
          ) : null}
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-[22px]">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="block overflow-hidden rounded-[20px] border border-bfx-border bg-white text-bfx-ink transition-[transform,box-shadow] duration-200 hover:-translate-y-[5px] hover:text-bfx-ink hover:shadow-[0_22px_40px_-22px_rgba(16,26,40,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="relative h-[184px] bg-[#EFE8DC]">
                  <MediaSlot src={course.image} alt={course.title} glyph="note" glyphSize={62} />
                  <LevelBadge className="top-3 left-3">{course.level}</LevelBadge>
                </div>
                <div className="p-5">
                  <div className="mb-1.5 text-[18.5px] font-bold tracking-[-0.01em]">
                    {course.title}
                  </div>
                  <div className="text-[13.5px] font-semibold text-bfx-muted">
                    Multiple skill levels
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <FeaturedCoursesEmpty />
        )}
      </div>
    </section>
  )
}

/**
 * First-run / between-terms empty state. Reached whenever nothing is published,
 * active and inside its 30-day window — a real state for this site, not a
 * theoretical one, since courses expire on their own.
 */
function FeaturedCoursesEmpty() {
  return (
    <div className="rounded-[20px] border border-dashed border-bfx-border-7 bg-bfx-cream px-6 py-16 text-center">
      <div
        className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-bfx-tint font-display text-[34px] leading-none text-bfx-bronze"
        aria-hidden
      >
        ♪
      </div>
      <Display as="h3" className="mb-2.5 text-[26px] leading-[1.08]">
        Enrolment for the next term isn&rsquo;t open yet
      </Display>
      <p className="mx-auto mb-7 max-w-[440px] text-[15.5px] leading-[1.6] text-bfx-body-2">
        Tell us which instrument you want and we&rsquo;ll hold you a place the moment the new
        timetable goes up.
      </p>
      <PillLink href="/contact" variant="ink" size="md">
        Tell us what you want to learn
      </PillLink>
    </div>
  )
}
