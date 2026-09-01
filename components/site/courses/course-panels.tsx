/**
 * The course-detail tab panels — "Banafix Redesign.dc.html", `isCourse`.
 *
 * These are server components. They are rendered on the server and handed to
 * the client `<CourseTabs>` as props, so switching tabs costs no JS beyond the
 * tab widget itself.
 *
 * Two panels the handoff draws are deliberately absent:
 *   • Reviews — there is no review model in Prisma. The handoff's three quotes
 *     are canvas sample data; fabricating per-course reviews is not on. The tab
 *     is dropped rather than shown empty.
 *   • The tutor's "180+ students taught / 4.9 / ABRSM" tiles are only rendered
 *     for the fields that exist on the record; a stat with no data is dropped.
 */
import { MediaSlot } from "@/components/site/media-slot"
import { CheckPip, Display, MetaChip } from "@/components/site/primitives"
import { plural } from "@/components/site/courses/course-data"

/* -------------------------------------------------------------------------- */
/*  Overview                                                                   */
/* -------------------------------------------------------------------------- */

export function OverviewPanel({
  outcomes,
  equipment,
}: {
  outcomes: string[]
  equipment: string[]
}) {
  return (
    <div>
      {outcomes.length > 0 ? (
        <>
          <Display className="mb-[18px] text-[34px] leading-[1.08] text-bfx-ink">
            What you&rsquo;ll be able to do
          </Display>
          <div className="mb-12 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3.5">
            {outcomes.map((outcome) => (
              <div
                key={outcome}
                className="flex items-start gap-[13px] rounded-2xl border border-bfx-border-5 bg-bfx-surface px-5 py-[19px]"
              >
                <CheckPip />
                <span className="text-[15.5px] font-medium leading-[1.5] text-bfx-strong">
                  {outcome}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {equipment.length > 0 ? (
        <>
          <Display className="mb-[18px] text-[34px] leading-[1.08] text-bfx-ink">
            What to bring
          </Display>
          <div className="rounded-[20px] border border-bfx-border-5 bg-bfx-surface px-[26px] py-2">
            {equipment.map((item) => (
              <div
                key={item}
                className="border-b border-bfx-hair py-[17px] text-[15.5px] font-medium text-bfx-strong"
              >
                {item}
              </div>
            ))}
            {/* STATIC MARKETING COPY — the rental price is not a DB field. */}
            <p className="py-5 text-[14.5px] leading-relaxed text-bfx-note-text">
              No instrument yet? We rent for ₦8,000 a term, or you can use ours in the studio at no
              cost.
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Curriculum                                                                 */
/* -------------------------------------------------------------------------- */

export interface CurriculumModuleData {
  module: number
  title: string
  weeks: string
  outcomes: string[]
  tasks: string[]
}

export function CurriculumPanel({
  modules,
  duration,
}: {
  modules: CurriculumModuleData[]
  duration: string
}) {
  return (
    <div>
      {/* The handoff hardcodes "Twelve weeks, four phases"; both halves are
          real data here — the course's own duration and module count. */}
      <Display className="mb-[22px] text-[34px] leading-[1.08] text-bfx-ink">
        {duration}, {plural(modules.length, "module")}
      </Display>
      <ol className="flex flex-col gap-3.5">
        {modules.map((item) => (
          <li
            key={item.module}
            className="grid grid-cols-1 gap-3 rounded-[18px] border border-bfx-border-5 bg-bfx-surface px-[26px] py-6 sm:grid-cols-[96px_1fr] sm:gap-6"
          >
            <div className="pt-1 text-xs font-bold uppercase tracking-[0.08em] text-bfx-bronze">
              {item.weeks}
            </div>
            <div>
              <h3 className="mb-[7px] text-[19px] font-bold tracking-[-0.01em] text-bfx-ink">
                {item.title}
              </h3>
              {item.outcomes.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {item.outcomes.map((outcome) => (
                    <li
                      key={outcome}
                      className="flex items-start gap-2.5 text-[15.5px] leading-relaxed text-bfx-body-2"
                    >
                      <span aria-hidden className="mt-[9px] h-1 w-1 flex-none rounded-full bg-bfx-amber" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.tasks.length > 0 ? (
                <p className="mt-4 border-t border-bfx-hair pt-3.5 text-[14.5px] leading-relaxed text-bfx-muted">
                  <span className="font-bold text-bfx-label">Practice: </span>
                  {item.tasks.join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Your tutor                                                                 */
/* -------------------------------------------------------------------------- */

export interface InstructorData {
  name: string
  bio: string | null
  avatar: string | null
  credentials: string[]
  rating: number
  experience: string | null
  availability: string | null
  verified: boolean
}

export function TutorPanel({
  instructor,
  instrument,
  students,
}: {
  instructor: InstructorData
  instrument: string
  students: number
}) {
  // Only stats with a value behind them. The handoff's three tiles are sample
  // data; an absent field drops its tile rather than inventing a number.
  const stats: Array<{ value: string; label: string }> = []
  if (students > 0) stats.push({ value: String(students), label: "students enrolled" })
  if (instructor.rating > 0)
    stats.push({ value: instructor.rating.toFixed(1), label: "average rating" })
  if (instructor.experience)
    stats.push({ value: instructor.experience, label: "teaching experience" })

  const subtitle = [`${instrument} tutor`, instructor.experience].filter(Boolean).join(" · ")

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),auto))] items-start gap-[30px] rounded-[22px] border border-bfx-border-5 bg-bfx-surface p-[34px]">
      <div className="h-[180px] w-[150px] overflow-hidden rounded-[18px]">
        <MediaSlot
          src={instructor.avatar}
          alt={`${instructor.name}, ${instrument} tutor`}
          glyph="note"
          glyphSize={54}
        />
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2.5">
          <h2 className="text-[26px] font-bold tracking-[-0.015em] text-bfx-ink">
            {instructor.name}
          </h2>
          {instructor.verified ? (
            <span className="rounded-full bg-bfx-ok-bg px-2.5 py-1 text-[11.5px] font-bold text-bfx-ok-text ring-1 ring-inset ring-bfx-ok-border">
              Verified
            </span>
          ) : null}
        </div>

        <p className="mb-[18px] text-[14.5px] font-semibold text-bfx-bronze">{subtitle}</p>

        {instructor.bio ? (
          <p className="bfx-pretty mb-5 text-[16px] leading-[1.65] text-bfx-body">{instructor.bio}</p>
        ) : null}

        {instructor.credentials.length > 0 ? (
          <ul className="mb-5 flex flex-wrap gap-2">
            {instructor.credentials.map((credential) => (
              <li key={credential}>
                <MetaChip>{credential}</MetaChip>
              </li>
            ))}
          </ul>
        ) : null}

        {stats.length > 0 ? (
          <dl className="flex flex-wrap gap-x-[26px] gap-y-4 border-t border-bfx-hair pt-5">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-[22px] font-extrabold text-bfx-ink">{stat.value}</dd>
                <dt className="text-[13px] font-semibold text-bfx-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        ) : null}

        {instructor.availability ? (
          <p className="mt-4 text-[14px] font-medium text-bfx-label">
            Usually available {instructor.availability}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  FAQs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The handoff's FAQ card (contact screen): white, 1px #EAE1D3, radius 16,
 * 20/22 padding, a bronze +/− on the right. Built on <details> so it opens and
 * closes with no client JS and stays keyboard-operable.
 */
export function FaqsPanel({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group rounded-2xl border border-bfx-border bg-bfx-surface px-[22px] py-5"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold tracking-[-0.01em] text-bfx-ink marker:hidden [&::-webkit-details-marker]:hidden">
            {faq.question}
            <span aria-hidden className="text-[19px] leading-none text-bfx-bronze">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <p className="bfx-pretty mt-3 text-[15px] leading-[1.65] text-bfx-body-2">{faq.answer}</p>
        </details>
      ))}
    </div>
  )
}
