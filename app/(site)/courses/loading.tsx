/**
 * Courses list loading state.
 *
 * The skeleton is laid out on the same grid as the real page — 290px minimum
 * columns, a 196px media well, the same chip row and the same dashed footer —
 * so nothing shifts when the data lands.
 */
import { CourseCardSkeleton } from "@/components/site/courses/course-card"
import { Display, Eyebrow } from "@/components/site/primitives"

export default function Loading() {
  return (
    <div>
      <section className="bfx-shell pb-[34px] pt-16">
        <div className="max-w-[640px]">
          <Eyebrow>COURSES</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none text-bfx-ink">
            Structured programmes
          </Display>
          <p className="bfx-pretty text-[18px] leading-relaxed text-bfx-body">
            Every course sets out what you will be able to do by the end, what to bring, and the
            formats you can take it in.
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-5" aria-hidden>
        <div className="flex flex-wrap items-center gap-2.5 py-3.5">
          {[96, 112, 120].map((width) => (
            <div
              key={width}
              style={{ width }}
              className="h-[42px] animate-pulse rounded-full bg-bfx-surface shadow-[inset_0_0_0_1px_var(--bfx-border-2)]"
            />
          ))}
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-bfx-tint" />
        </div>
      </section>

      <section className="bfx-shell pb-[100px] pt-3">
        <span className="sr-only" role="status">
          Loading courses
        </span>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-6" aria-hidden>
          {Array.from({ length: 6 }, (_, index) => (
            <CourseCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  )
}
