/**
 * Tutor card — `isTutors` in "Banafix Redesign.dc.html" (handoff lines
 * 414–432): a 260px portrait well over the MediaSlot empty state, then name,
 * a bronze specialty line, the bio, and tag chips.
 *
 * The card is intentionally NOT a link. The handoff has no tutor detail
 * screen and the old mock `/instructors/[id]` page has been deleted (see the
 * redirect in `next.config.ts`), so there is nowhere for a click to go.
 */
import { MediaSlot } from "@/components/site/media-slot"

/**
 * What this screen reads off an instructor record. It is a strict subset of
 * what `GET /api/instructors` returns, so the same objects satisfy it either
 * way — see `app/api/instructors/route.ts` for the full JSON shape.
 */
export interface Tutor {
  id: string
  name: string
  avatar: string | null
  bio: string | null
  credentials: string[] | null
  rating: number | null
  experience: string | null
  availability: string | null
  verified: boolean
  /** Derived from the course instrument — there is no specialties column. */
  specialties: string[] | null
  course: {
    id: string
    title: string
    instrument: string
    level: string
  } | null
}

/**
 * The handoff's `t.tags` has no counterpart in the DB, so the chips are
 * assembled from fields that genuinely exist on the record: the course
 * instrument (`specialties`), the tutor's `credentials`, their `experience`
 * string, and a "Verified" chip only when `verified` is true. Nothing here is
 * invented.
 */
export function tutorTags(tutor: Tutor): string[] {
  const raw = [
    ...(tutor.specialties ?? []),
    ...(tutor.credentials ?? []),
    tutor.experience ?? "",
    tutor.verified ? "Verified" : "",
  ]

  const seen = new Set<string>()
  const tags: string[] = []
  for (const entry of raw) {
    const value = typeof entry === "string" ? entry.trim() : ""
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(value)
  }
  return tags
}

/** The handoff's specialty line — instrument first, course title as fallback. */
function specialtyLine(tutor: Tutor): string {
  const specialties = (tutor.specialties ?? []).map((s) => s.trim()).filter(Boolean)
  if (specialties.length > 0) return specialties.join(" · ")
  return tutor.course?.instrument?.trim() || tutor.course?.title?.trim() || ""
}

export function TutorCard({ tutor }: { tutor: Tutor }) {
  const specialty = specialtyLine(tutor)
  const tags = tutorTags(tutor)
  const bio = tutor.bio?.trim()

  return (
    <article className="overflow-hidden rounded-[22px] border border-bfx-border bg-bfx-surface">
      <div className="relative h-[260px]">
        <MediaSlot
          src={tutor.avatar}
          alt={`${tutor.name} portrait`}
          glyph="note"
          glyphSize={72}
        />
      </div>

      <div className="px-6 pt-[22px] pb-[26px]">
        <h2 className="text-[19px] font-bold tracking-[-0.01em] text-bfx-ink">{tutor.name}</h2>

        {specialty ? (
          <p className="mb-[14px] text-[13.5px] font-semibold text-bfx-bronze">{specialty}</p>
        ) : (
          <div className="mb-[14px]" />
        )}

        {bio ? (
          <p className="bfx-pretty mb-[18px] text-[14.5px] leading-[1.6] text-bfx-body-2">{bio}</p>
        ) : null}

        {tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-lg bg-bfx-tint px-2.5 py-[5px] text-xs font-semibold text-bfx-body"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
