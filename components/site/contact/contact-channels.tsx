/**
 * Left column of `isContact` in "Banafix Redesign.dc.html" (handoff lines
 * 567–587): the grouped WHATSAPP / EMAIL / STUDIO list, then the 220px studio
 * media well.
 *
 * The group is a 2px-gap flex stack on `bfx-border-4` with white rows, so the
 * gaps read as hairline rules without a border per row — the handoff's own
 * trick. Every row is a real link (wa.me / mailto / maps); the handoff renders
 * them as inert text, which would be a dead end on a phone.
 *
 * All values come from `lib/site.ts` — none are re-typed here.
 */
import { MediaSlot } from "@/components/site/media-slot"
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_EMAIL_MAILTO,
  SITE_HOURS,
  SITE_PHONE_DISPLAY,
  SITE_WHATSAPP,
} from "@/lib/site"

/**
 * Static marketing photo, carried over from the handoff's `bfx-studio` slot
 * (Photo by Caught In Joy on Unsplash). Replace with a real studio photo when
 * one exists.
 */
const STUDIO_PHOTO =
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1400&q=70"

const MAPS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  SITE_ADDRESS_LINES.join(" "),
)}`

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1.5 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">{children}</div>
  )
}

export function ContactChannels() {
  return (
    <>
      <div className="mb-[26px] flex flex-col gap-[2px] overflow-hidden rounded-[20px] border border-bfx-border-4 bg-bfx-border-4">
        <a
          href={SITE_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-bfx-surface px-6 py-[22px] transition-colors hover:bg-bfx-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bfx-amber"
        >
          <RowLabel>WHATSAPP</RowLabel>
          <div className="text-[19px] font-bold text-bfx-ink">{SITE_PHONE_DISPLAY}</div>
        </a>

        <a
          href={SITE_EMAIL_MAILTO}
          className="bg-bfx-surface px-6 py-[22px] transition-colors hover:bg-bfx-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bfx-amber"
        >
          <RowLabel>EMAIL</RowLabel>
          <div className="text-[19px] font-bold break-words text-bfx-ink">{SITE_EMAIL}</div>
        </a>

        <a
          href={MAPS_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-bfx-surface px-6 py-[22px] transition-colors hover:bg-bfx-field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bfx-amber"
        >
          <RowLabel>STUDIO</RowLabel>
          <address className="text-[17px] font-bold leading-[1.5] text-bfx-ink not-italic">
            {SITE_ADDRESS_LINES.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <div className="mt-2 text-sm font-semibold text-bfx-muted">{SITE_HOURS}</div>
        </a>
      </div>

      <div className="relative h-[220px] overflow-hidden rounded-[20px]">
        <MediaSlot
          src={STUDIO_PHOTO}
          alt="Inside the Banafix studio in Lekki"
          glyph="beamed"
          glyphSize={84}
        />
      </div>
    </>
  )
}
