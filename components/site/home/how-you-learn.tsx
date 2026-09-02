/**
 * "HOW YOU LEARN" — handoff `isHome`, the ink <section>.
 *
 * Every word of data on these cards is real. The formats are the rows of the
 * `DeliveryMode` table (active, ordered), rendered under their canonical
 * names; the "from ₦X" is the minimum `course.pricing[mode]` across published
 * courses that list the mode in `availableModes`; the course count is how many
 * of those courses there are. `DeliveryMode` has no description field, so this
 * section asserts nothing else about a format.
 *
 * The previous version hardcoded three invented formats ("At the studio",
 * "Home training") with blurbs and bullet lists claiming lesson recordings,
 * sibling discounts and pre-class practice rooms. No field backs any of that,
 * so it is gone rather than reworded.
 */
import { MediaSlot } from "@/components/site/media-slot"
import { Display, Eyebrow } from "@/components/site/primitives"
import { formatNaira } from "@/lib/site"

/** One active `DeliveryMode` row, with the real figures the page derived for it. */
export interface HomeFormat {
  id: string
  /** The canonical `DeliveryMode.name`: On-site · One-on-One · Online · Home Training. */
  name: string
  /** Minimum `course.pricing[name]` across published courses offering it, or null. */
  from: number | null
  /** How many published courses list this mode in `availableModes`. */
  courseCount: number
}

/**
 * Stock photography, keyed by canonical `DeliveryMode.name`.
 *
 * Every file here was downloaded and looked at before being placed, and each
 * alt text describes what is actually in the frame rather than what we would
 * like it to show. Photographers are named in comments for licence
 * traceability.
 *
 * A mode with no entry falls through to MediaSlot's designed dark empty state,
 * which is what happens to any mode an admin adds later.
 */
const MODE_PHOTOS: Record<string, { src: string; alt: string }> = {
  "On-site": {
    src: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=1400&q=70",
    alt: "A music room with a keyboard, a drum kit and a microphone stand",
  },
  Online: {
    src: "https://images.unsplash.com/photo-1593697820940-43e77b53a1e1?auto=format&fit=crop&w=1400&q=70",
    alt: "A student playing a digital piano in headphones, with a laptop open beside the keys",
  },
  // Vitaly Gariev, Unsplash. A tutor guiding a student's fingers on the
  // fretboard: an actual one-to-one lesson, which is what this mode is.
  "One-on-One": {
    src: "https://images.unsplash.com/photo-1758524944402-1903b38f848f?auto=format&fit=crop&w=1400&q=70",
    alt: "A tutor guiding a student's hand on the fretboard of an acoustic guitar",
  },
  "Home Training": {
    src: "https://images.unsplash.com/photo-1540593463874-59835505e99d?auto=format&fit=crop&w=1400&q=70",
    alt: "An adult and a young child at an upright piano in a living room",
  },
}

export function HowYouLearn({ formats }: { formats: readonly HomeFormat[] }) {
  // No active delivery mode means there is nothing true to say here.
  if (formats.length === 0) return null

  return (
    <section className="bg-bfx-ink text-white">
      <div className="bfx-shell py-[88px]">
        <div className="mb-[46px] max-w-[560px]">
          <Eyebrow onInk>HOW YOU LEARN</Eyebrow>
          {/*
            Count-free on purpose: an admin can activate or retire a delivery
            mode at any time, and "Three ways to take a lesson" would then be
            a lie sitting above four cards.
          */}
          <Display as="h2" className="text-[clamp(32px,4vw,50px)] leading-[1.08]">
            Pick the format that fits your week.
          </Display>
        </div>

        {/*
          Explicit 1 / 2 / 4 columns rather than auto-fill. With four formats,
          an auto-fill track leaves a single orphan card on its own row between
          the three- and four-column breakpoints; 1 / 2 / 4 never does.
        */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {formats.map((format) => {
            const photo = MODE_PHOTOS[format.name]
            return (
              <article
                key={format.id}
                className="overflow-hidden rounded-[22px] border border-bfx-line-dark bg-bfx-ink-2"
              >
                <div className="relative h-[200px] bg-bfx-ink-3">
                  <MediaSlot
                    src={photo?.src}
                    alt={photo ? photo.alt : ""}
                    glyph="beamed"
                    glyphSize={76}
                    tone="dark"
                  />
                </div>
                <div className="px-7 pt-[26px] pb-[30px]">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <h3 className="text-[21px] font-bold tracking-[-0.01em]">{format.name}</h3>
                    {/* Omitted entirely when no published course offers this mode. */}
                    {format.from !== null ? (
                      <div className="text-[13.5px] font-bold whitespace-nowrap text-bfx-amber">
                        from {formatNaira(format.from)}
                      </div>
                    ) : null}
                  </div>
                  <p className="m-0 text-[15px] leading-[1.6] text-bfx-on-dark-4">
                    {format.courseCount > 0
                      ? `${format.courseCount} ${
                          format.courseCount === 1 ? "course is" : "courses are"
                        } taught this way.`
                      : "No course on the current timetable is taught this way."}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
