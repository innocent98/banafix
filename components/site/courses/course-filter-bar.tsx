/**
 * Sticky filter bar — "Banafix Redesign.dc.html", `isCourses`.
 *
 * Handoff spec: the section is `position:sticky;top:76px` (76px is the header's
 * exact height) with a `rgba(250,246,240,0.92)` + 10px-blur strip inside it and
 * the result count pushed right with `margin-left:auto`.
 *
 * The handoff's chips are `setState` buttons over a hardcoded
 * `['All','Beginner','All levels']`. Here they are links that write `?level=`,
 * so the whole page stays a server component, the filtered view is shareable,
 * and the chip set is whatever levels the DB actually holds.
 */
import Link from "next/link"

import { chip } from "@/components/site/courses/styles"
import { plural } from "@/components/site/courses/course-data"

function coursesHref(params: { level?: string | null; instrument?: string | null }) {
  const search = new URLSearchParams()
  if (params.instrument) search.set("instrument", params.instrument)
  if (params.level) search.set("level", params.level)
  const query = search.toString()
  return query ? `/courses?${query}` : "/courses"
}

export function CourseFilterBar({
  levels,
  activeLevel,
  instrument,
  count,
}: {
  levels: string[]
  activeLevel: string | null
  instrument: string | null
  count: number
}) {
  return (
    <section className="bfx-shell sticky top-[76px] z-20 pb-5">
      <div className="flex flex-wrap items-center gap-2.5 bg-bfx-cream/[0.92] py-3.5 backdrop-blur-[10px]">
        <Link
          href={coursesHref({ instrument })}
          aria-current={activeLevel === null ? "page" : undefined}
          className={chip(activeLevel === null)}
        >
          All courses
        </Link>

        {levels.map((level) => (
          <Link
            key={level}
            href={coursesHref({ level, instrument })}
            aria-current={activeLevel === level ? "page" : undefined}
            className={chip(activeLevel === level)}
          >
            {level}
          </Link>
        ))}

        {/* The footer's POPULAR column deep-links in as `?instrument=Piano`.
            Surface it as its own removable chip so the filter is never silent. */}
        {instrument ? (
          <Link
            href={coursesHref({ level: activeLevel })}
            aria-label={`Remove the ${instrument} filter`}
            className={chip(true)}
          >
            {instrument}
            <span aria-hidden className="-mr-0.5 text-[15px] leading-none text-white/70">
              ×
            </span>
          </Link>
        ) : null}

        <span className="ml-auto text-[13.5px] font-semibold text-bfx-muted" aria-live="polite">
          {plural(count, "course")}
        </span>
      </div>
    </section>
  )
}
