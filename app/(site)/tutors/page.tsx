/**
 * /tutors — `isTutors` in "Banafix Redesign.dc.html" (handoff lines 407–438).
 *
 * A Server Component: the grid is read-only, so there is no reason to ship a
 * fetch, the JSON and a loading flag to the browser. `loading.tsx` streams the
 * skeleton while this resolves.
 *
 * The handoff shows no search / sort / filter controls on this screen, so the
 * previous `InstructorFilters` block is gone (see the report).
 */
import type { Metadata } from "next"

import { Display, Eyebrow } from "@/components/site/primitives"
import { TutorCard, type Tutor } from "@/components/site/tutors/tutor-card"
import { TutorsEmpty } from "@/components/site/tutors/tutors-empty"
import { TutorsError } from "@/components/site/tutors/tutors-error"
import { prisma } from "@/lib/prisma"

/**
 * Tutors appear and disappear as an admin publishes or unpublishes their
 * course, so this must not be baked at build time.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Tutors | Banafix",
  description:
    "The working musicians who teach at Banafix — their instruments, experience and what they specialise in.",
}

/**
 * Read the same rows `GET /api/instructors` serves, but directly.
 *
 * A Server Component can `fetch()` the app's own route (verified working), but
 * it has to rebuild an absolute URL out of request headers and then pay a
 * second HTTP hop plus a JSON round-trip on every render — for a query this
 * page could just run. The direct read has no host to guess and no dependency
 * on the app being reachable from inside itself.
 *
 * `app/api/instructors/route.ts` is untouched and remains the JSON contract for
 * client-side consumers. The `where` clause and the specialty/instrument
 * derivation below are kept deliberately identical to it, so the two cannot
 * disagree about which tutors are public.
 */
async function fetchTutors(): Promise<Tutor[]> {
  const rows = await prisma.instructor.findMany({
    where: { course: { isPublished: true, isActive: true } },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      credentials: true,
      rating: true,
      experience: true,
      availability: true,
      verified: true,
      course: {
        select: { id: true, title: true, instrument: true, level: true },
      },
    },
    orderBy: { name: "asc" },
  })

  return rows.map((row) => ({
    ...row,
    // Same derivation as the API route: the course instrument is the tutor's
    // specialty. There is no separate specialties column.
    specialties: [row.course?.instrument].filter((v): v is string => Boolean(v)),
  }))
}

export default async function TutorsPage() {
  let tutors: Tutor[] | null = null
  try {
    tutors = await fetchTutors()
  } catch (error) {
    console.error("Failed to load tutors:", error)
  }

  const count = tutors?.length ?? 0

  return (
    <div>
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[620px]">
          <Eyebrow>TUTORS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none text-bfx-ink">
            The people who&rsquo;ll teach you
          </Display>
          {/* The handoff says "Fifty working musicians" — a figure the data
              contradicts — so the count is read from the API and the rest is
              kept as static marketing copy. */}
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            {count > 1
              ? `${count} working musicians. Every one of them auditioned, background-checked, and trained to teach beginners.`
              : count === 1
                ? "One working musician \u2014 auditioned, background-checked, and trained to teach beginners."
                : "Every Banafix tutor is auditioned, background-checked, and trained to teach beginners."}
          </p>
        </div>
      </section>

      <section className="bfx-shell pb-[100px]">
        {tutors === null ? (
          <TutorsError />
        ) : count === 0 ? (
          <TutorsEmpty />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
