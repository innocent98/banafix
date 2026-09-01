/**
 * Course not-found — reached when the id does not exist, or when the course is
 * unpublished, deactivated or removed. Lives inside the route group so it keeps
 * the site header and footer.
 */
import { Display, Eyebrow, PillLink } from "@/components/site/primitives"
import { TRIAL_HREF } from "@/lib/site"

export default function CourseNotFound() {
  return (
    <section className="bfx-shell pb-[120px] pt-20">
      <div className="max-w-[560px]">
        <Eyebrow>COURSE UNAVAILABLE</Eyebrow>
        <Display as="h1" className="mb-4 text-[clamp(34px,4.5vw,52px)] leading-none text-bfx-ink">
          We can&rsquo;t find that course
        </Display>
        <p className="bfx-pretty mb-8 text-[17px] leading-relaxed text-bfx-body">
          It may have finished its term, or the link may be out of date. Everything currently open
          for enrolment is on the courses page.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PillLink href="/courses" variant="ink" size="md">
            Browse all courses
          </PillLink>
          <PillLink href={TRIAL_HREF} variant="outlineSoft" size="md">
            Book a free trial
          </PillLink>
        </div>
      </div>
    </section>
  )
}
