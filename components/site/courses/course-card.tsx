/**
 * Course card — "Banafix Redesign.dc.html", `isCourses` grid (and the same
 * card the home page's featured row uses).
 *
 * Handoff spec: 1px #EAE1D3, radius 22, white, a 196px photo well with the
 * level badge inset 13px, 24px body, and a dashed #E6DDCE footer rule.
 *
 * The handoff makes only the "View course" button clickable; here the whole
 * card is the link (one tab stop, a 100%-wide touch target) and the pill is a
 * span that reacts to `group-hover`.
 */
import Link from "next/link"

import { MediaSlot } from "@/components/site/media-slot"
import { LevelBadge, MetaChip } from "@/components/site/primitives"
import { plural } from "@/components/site/courses/course-data"
import { formatNaira } from "@/lib/site"

export interface CourseCardData {
  id: string
  title: string
  description: string | null
  level: string
  duration: string
  image: string | null
  formatCount: number
  fromPrice: number | null
}

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-[22px] border border-bfx-border bg-bfx-surface transition-shadow duration-200 hover:shadow-[0_22px_44px_-24px_rgba(16,26,40,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream"
    >
      <div className="relative h-[196px]">
        <MediaSlot src={course.image} alt={course.title} glyph="note" glyphSize={68} />
        <LevelBadge className="left-[13px] top-[13px]">{course.level}</LevelBadge>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-[9px] text-[21px] font-bold leading-tight tracking-[-0.015em] text-bfx-ink">
          {course.title}
        </h3>

        {/* `description` is nullable on the model — omit the blurb rather than
            filling the slot with placeholder prose. */}
        {course.description ? (
          <p className="bfx-pretty mb-[18px] text-[15px] leading-relaxed text-bfx-body-2">
            {course.description}
          </p>
        ) : null}

        <div className="mb-[22px] flex flex-wrap gap-2">
          <MetaChip>{course.duration}</MetaChip>
          <MetaChip>{plural(course.formatCount, "format")}</MetaChip>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3.5 border-t border-dashed border-bfx-border-7 pt-[18px]">
          <div>
            {course.fromPrice === null ? (
              <div className="text-[15px] font-bold text-bfx-ink">Price on request</div>
            ) : (
              <>
                <div className="text-xs font-semibold text-bfx-muted-2">from</div>
                <div className="text-[21px] font-extrabold tracking-[-0.01em] text-bfx-ink">
                  {formatNaira(course.fromPrice)}
                </div>
              </>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-bfx-ink px-5 py-3 text-sm font-bold text-white transition-colors duration-200 group-hover:bg-bfx-amber group-hover:text-bfx-ink">
            View course
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Skeleton twin — same 196px well, same 24px body, same footer rule. */
export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[22px] border border-bfx-border bg-bfx-surface">
      <div className="h-[196px] animate-pulse bg-bfx-tint" />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 h-[21px] w-3/5 animate-pulse rounded bg-bfx-tint" />
        <div className="mb-2 h-[15px] w-full animate-pulse rounded bg-bfx-hair" />
        <div className="mb-[18px] h-[15px] w-4/5 animate-pulse rounded bg-bfx-hair" />
        <div className="mb-[22px] flex gap-2">
          <div className="h-[29px] w-20 animate-pulse rounded-lg bg-bfx-tint" />
          <div className="h-[29px] w-24 animate-pulse rounded-lg bg-bfx-tint" />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3.5 border-t border-dashed border-bfx-border-7 pt-[18px]">
          <div className="h-[38px] w-24 animate-pulse rounded bg-bfx-tint" />
          <div className="h-[42px] w-32 animate-pulse rounded-full bg-bfx-tint" />
        </div>
      </div>
    </div>
  )
}
