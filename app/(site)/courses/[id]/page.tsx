/**
 * Course detail — "Banafix Redesign.dc.html", `isCourse`.
 *
 * Server component. Only the two interactive pieces hydrate: the tab strip and
 * the format picker in the aside. Everything else — hero, panels, rates — is
 * rendered on the server. The location is `?location=<slug>`.
 *
 * Reads Prisma directly rather than `/api/courses/[id]`; the visibility rule
 * (`isPublished && isActive`) is the same one that route applies.
 */
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import {
  CurriculumPanel,
  FaqsPanel,
  OverviewPanel,
  TutorPanel,
} from "@/components/site/courses/course-panels"
import { CourseTabs, type CourseTab } from "@/components/site/courses/course-tabs"
import { EnrolAside } from "@/components/site/courses/enrol-aside"
import { LocationChooser } from "@/components/site/location-chooser"
import { MediaSlot } from "@/components/site/media-slot"
import { Display, PillLink } from "@/components/site/primitives"
import { coursePhotoSrc } from "@/lib/course-photo"
import { getPublicOfferings } from "@/lib/offerings"
import { prisma } from "@/lib/prisma"

async function getCourse(id: string) {
  return prisma.course.findFirst({
    where: { id, isPublished: true, isActive: true },
    include: {
      instructor: true,
      curriculum: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      _count: { select: { enrollments: true } },
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const course = await prisma.course.findFirst({
    where: { id, isPublished: true, isActive: true },
    select: { title: true, description: true },
  })

  if (!course) return { title: "Course not found | Banafix" }

  return {
    title: `${course.title} | Banafix`,
    ...(course.description ? { description: course.description } : {}),
  }
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ location?: string }>
}) {
  const { id } = await params
  const { location: locationParam } = await searchParams
  const course = await getCourse(id)

  if (!course) notFound()

  // Everything shown about formats and rates comes from offerable offerings (an active offering at
  // an active location with at least one per-class rate). Nothing reads the deprecated
  // `Course.pricing` / `availableModes` / `location`.
  const allOfferings = await getPublicOfferings(course.id)
  const locations = [
    ...new Map(allOfferings.map((offering) => [offering.location.id, offering.location])).values(),
  ]
  const activeLocation = locations.find((l) => l.slug === locationParam?.trim()) ?? null
  const offerings = activeLocation
    ? allOfferings.filter((offering) => offering.location.id === activeLocation.id)
    : []

  const tabs: CourseTab[] = []

  if (course.outcomes.length > 0 || course.equipment.length > 0) {
    tabs.push({
      key: "overview",
      label: "Overview",
      panel: <OverviewPanel outcomes={course.outcomes} equipment={course.equipment} />,
    })
  }

  if (course.curriculum.length > 0) {
    tabs.push({
      key: "curriculum",
      label: "Curriculum",
      panel: <CurriculumPanel modules={course.curriculum} />,
    })
  }

  if (course.instructor) {
    tabs.push({
      key: "tutor",
      label: "Your tutor",
      panel: (
        <TutorPanel
          instructor={course.instructor}
          instrument={course.instrument}
          students={course._count.enrollments}
        />
      ),
    })
  }

  if (course.faqs.length > 0) {
    tabs.push({
      key: "faqs",
      label: "FAQs",
      panel: <FaqsPanel faqs={course.faqs} />,
    })
  }

  // There is no Reviews tab: Prisma has no review model, and the handoff's
  // three quotes are canvas sample data.

  return (
    <div>
      <section className="bg-bfx-ink text-white">
        <div className="bfx-shell pb-16 pt-[26px]">
          <Link
            href="/courses"
            className="mb-[34px] inline-block text-sm font-semibold text-bfx-on-dark-3 transition-colors hover:text-bfx-amber"
          >
            ← All courses
          </Link>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(400px,100%),1fr))] items-end gap-14">
            <div className="bfx-rise">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-bfx-amber px-3 py-1.5 text-xs font-bold text-bfx-ink">
                  {course.level}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-bfx-on-dark">
                  {course.duration}
                </span>
                {activeLocation ? (
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-bfx-on-dark">
                    {activeLocation.name}
                  </span>
                ) : null}
              </div>

              <Display as="h1" className="mb-4 text-[clamp(38px,5vw,64px)] leading-none">
                {course.title}
              </Display>

              {course.description ? (
                <p className="bfx-pretty max-w-[520px] text-[18px] leading-[1.65] text-bfx-on-dark-2">
                  {course.description}
                </p>
              ) : null}
            </div>

            <div className="bfx-rise-2 h-[280px] overflow-hidden rounded-[22px] bg-bfx-ink-3">
              <MediaSlot
                src={coursePhotoSrc(course)}
                alt={`${course.title} lesson photo`}
                glyph="notes"
                glyphSize={96}
                tone="dark"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {locations.length > 0 ? (
        <section className="bfx-shell pt-9">
          <LocationChooser
            locations={locations}
            activeSlug={activeLocation?.slug ?? null}
            label="Choose your location to see formats and rates"
            hrefFor={(slug) =>
              slug ? `/courses/${course.id}?location=${encodeURIComponent(slug)}` : `/courses/${course.id}`
            }
          />
        </section>
      ) : null}

      <section className="bfx-shell grid grid-cols-1 items-start gap-[52px] pb-[100px] pt-11 lg:grid-cols-[minmax(0,1fr)_minmax(0,372px)]">
        <div>
          {tabs.length > 0 ? (
            <CourseTabs tabs={tabs} />
          ) : (
            <div className="rounded-[20px] border border-dashed border-bfx-border-2 bg-bfx-surface px-6 py-12 text-center">
              <h2 className="text-[19px] font-bold text-bfx-ink">
                Full course details are on the way
              </h2>
              <p className="bfx-pretty mx-auto mt-2 max-w-[420px] text-[15px] leading-relaxed text-bfx-body-2">
                The outline for this course has not been published yet. Ask us and we will send you
                the modules, the equipment list and the tutor.
              </p>
              <div className="mt-6 flex justify-center">
                <PillLink href="/contact" variant="ink" size="md">
                  Ask about this course
                </PillLink>
              </div>
            </div>
          )}
        </div>

        {/* Keyed by location so the format selection resets when the location changes. */}
        <EnrolAside
          key={activeLocation?.id ?? "none"}
          courseId={course.id}
          hasAnyOffering={allOfferings.length > 0}
          location={activeLocation}
          offerings={offerings}
        />
      </section>
    </div>
  )
}
