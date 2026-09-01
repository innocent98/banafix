/**
 * MediaSlot — the shipped counterpart of the handoff's `<image-slot>`.
 *
 * In "Banafix Redesign.dc.html" every photo sits on top of a designed empty
 * state: a diagonal cream (or navy) gradient with an oversized, very low
 * opacity Instrument Serif music glyph pinned bottom-left. That is not
 * decoration to drop — most courses and tutors in the DB have no `image`, so
 * the empty state is what renders most of the time.
 *
 * A plain <img> is used rather than next/image on purpose: sources are
 * admin-supplied (Vercel Blob today, anything tomorrow) and next/image would
 * hard-fail on a host missing from `next.config.ts` remotePatterns.
 *
 * This component stays server-side; only the <img> itself is a client leaf
 * (it needs onError), and only when a src actually exists. Most rows have no
 * image, so most pages ship no JS for this at all.
 */
import { MediaSlotImage } from "@/components/site/media-slot-image"
import { cn } from "@/lib/utils"

/** The three glyphs the handoff uses, by their original HTML entities. */
const GLYPHS = {
  note: "♪", // &#9834; — course cards, tutor cards
  notes: "♫", // &#9835; — hero, course hero
  beamed: "♬", // &#9836; — format cards, studio photo
} as const

export type MediaGlyph = keyof typeof GLYPHS

interface MediaSlotProps {
  src?: string | null
  alt: string
  /** Which music glyph backs the empty state. */
  glyph?: MediaGlyph
  /** Glyph size in px — the handoff scales it to the slot (62–150px). */
  glyphSize?: number
  /** `dark` is the navy variant used inside ink sections. */
  tone?: "light" | "dark"
  className?: string
  /** Applied to the <img> only; the gradient always fills the slot. */
  imgClassName?: string
  loading?: "lazy" | "eager"
  /**
   * Flat fill instead of the gradient + glyph. The handoff's testimonial
   * avatars are bare `#EDE4D5` discs with no glyph — at 44px the empty state
   * reads as an icon rather than as texture. Pass a CSS colour.
   */
  bare?: string
}

export function MediaSlot({
  src,
  alt,
  glyph = "note",
  glyphSize = 62,
  tone = "light",
  className,
  imgClassName,
  loading = "lazy",
  bare,
}: MediaSlotProps) {
  const isDark = tone === "dark"

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {/* Empty state: gradient + glyph. Always rendered so a broken or slow
          image reveals the designed ground rather than a blank box. */}
      {bare ? (
        <div aria-hidden className="absolute inset-0 z-0" style={{ background: bare }} />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 z-0 grid place-items-end justify-items-start pb-[14px] pl-[18px]"
          style={{
            background: isDark
              ? "linear-gradient(150deg, var(--bfx-media-dark-a) 0%, var(--bfx-media-dark-b) 100%)"
              : "linear-gradient(150deg, var(--bfx-media-a) 0%, var(--bfx-media-b) 100%)",
          }}
        >
          <span
            className="font-display leading-none"
            style={{
              fontSize: `${glyphSize}px`,
              color: isDark ? "rgba(245,165,36,0.16)" : "rgba(16,26,40,0.10)",
            }}
          >
            {GLYPHS[glyph]}
          </span>
        </div>
      )}

      {src ? (
        <MediaSlotImage src={src} alt={alt} loading={loading} className={imgClassName} />
      ) : null}
    </div>
  )
}
