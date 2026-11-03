import { MediaSlot } from "@/components/site/media-slot"
import type { PublicTestimonial } from "@/lib/site-content-queries"

/**
 * One published testimonial. The card is the handoff's home-screen testimonial
 * `<figure>`: white on cream, #EAE1D3 hairline, 22px radius, an Instrument
 * Serif blockquote at 23px/1.35 and a 44px round portrait above the name and
 * relationship. There is no portrait data, so the portrait is the handoff's
 * bare #EDE4D5 disc.
 */
export function TestimonialCard({ item }: { item: PublicTestimonial }) {
  return (
    <figure className="m-0 flex flex-col justify-between gap-6 rounded-[22px] border border-bfx-border bg-white px-[30px] pt-[30px] pb-[26px]">
      <blockquote className="bfx-pretty m-0 font-display text-[23px] leading-[1.35] tracking-[-0.01em] text-[#1A2534]">
        &ldquo;{item.quote}&rdquo;
      </blockquote>
      <figcaption className="border-t border-bfx-hair-2 pt-5">
        <div className="flex items-center gap-[13px]">
          <div className="relative h-11 w-11 flex-none overflow-hidden rounded-full bg-[#EDE4D5]">
            <MediaSlot src={null} alt="" bare="#EDE4D5" />
          </div>
          <div>
            <div className="text-[15px] font-bold">{item.name}</div>
            {item.role ? (
              <div className="text-[13px] font-semibold text-bfx-muted">{item.role}</div>
            ) : null}
          </div>
        </div>
        {item.videoUrl ? (
          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-[13.5px] font-bold text-bfx-bronze underline-offset-4 hover:underline"
          >
            Watch the video
          </a>
        ) : null}
      </figcaption>
    </figure>
  )
}
