/**
 * Streamed while `page.tsx` resolves its fetch. The header block is real (it
 * does not depend on data, minus the count) and the grid is the skeleton, so
 * the only thing that changes on arrival is the card contents.
 */
import { Display, Eyebrow } from "@/components/site/primitives"
import { TutorGridSkeleton } from "@/components/site/tutors/tutor-card-skeleton"

export default function Loading() {
  return (
    <div>
      <section className="bfx-shell pt-16 pb-11">
        <div className="max-w-[620px]">
          <Eyebrow>TUTORS</Eyebrow>
          <Display as="h1" className="mb-4 text-[clamp(38px,5vw,62px)] leading-none text-bfx-ink">
            The people who&rsquo;ll teach you
          </Display>
          <p className="bfx-pretty text-[18px] leading-[1.6] text-bfx-body">
            Every Banafix tutor is auditioned, background-checked, and trained to teach beginners.
          </p>
        </div>
      </section>
      <section className="bfx-shell pb-[100px]">
        <TutorGridSkeleton />
      </section>
    </div>
  )
}
