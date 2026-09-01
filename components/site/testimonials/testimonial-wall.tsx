"use client"

import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { MediaSlot } from "@/components/site/media-slot"
import {
  testimonialInstruments,
  testimonialLevels,
  type Testimonial,
} from "@/components/site/testimonials/testimonials"

/**
 * Filterable testimonial wall.
 *
 * The card is the handoff's home-screen testimonial `<figure>`: white on
 * cream, #EAE1D3 hairline, 22px radius, an Instrument Serif blockquote at
 * 23px/1.35, and a 44px round portrait above the name and role, separated by
 * an #F0E8DB rule. Filter chips reuse its `chip()` helper.
 */

/** Handoff `chip(active)`. `min-h-10` keeps small chips tappable. */
function chipClass(active: boolean) {
  return cn(
    "min-h-10 rounded-full border-0 px-[15px] py-[9px] text-[13.5px] font-bold transition-shadow",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream",
    active
      ? "bg-bfx-ink text-white shadow-[inset_0_0_0_1px_var(--bfx-ink)]"
      : "bg-bfx-surface text-bfx-body shadow-[inset_0_0_0_1px_var(--bfx-border-2)] hover:shadow-[inset_0_0_0_1px_var(--bfx-ink)]",
  )
}

export function TestimonialWall({ testimonials }: { testimonials: Testimonial[] }) {
  const [instrument, setInstrument] = useState("all")
  const [level, setLevel] = useState("all")

  const instruments = useMemo(() => testimonialInstruments(testimonials), [testimonials])
  const levels = useMemo(() => testimonialLevels(testimonials), [testimonials])

  const visible = useMemo(
    () =>
      testimonials.filter(
        (item) =>
          (instrument === "all" || item.instrument === instrument) &&
          (level === "all" || item.level === level),
      ),
    [testimonials, instrument, level],
  )

  const isFiltered = instrument !== "all" || level !== "all"

  return (
    <div>
      {/* Filters — every chip is derived from the data, so none can be empty */}
      <div className="mb-9 flex flex-col gap-4 rounded-[20px] border border-bfx-border bg-bfx-surface p-6">
        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="mr-1 w-[76px] shrink-0 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
            INSTRUMENT
          </span>
          <button type="button" onClick={() => setInstrument("all")} className={chipClass(instrument === "all")}>
            All
          </button>
          {instruments.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setInstrument(name)}
              className={chipClass(instrument === name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-[10px] border-t border-bfx-hair pt-4">
          <span className="mr-1 w-[76px] shrink-0 text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
            LEVEL
          </span>
          <button type="button" onClick={() => setLevel("all")} className={chipClass(level === "all")}>
            All
          </button>
          {levels.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setLevel(name)}
              className={chipClass(level === name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(290px,1fr))]">
          {visible.map((item) => (
            <figure
              key={item.id}
              className="m-0 flex flex-col justify-between gap-6 rounded-[22px] border border-bfx-border bg-bfx-surface px-[30px] pt-[30px] pb-[26px]"
            >
              <div>
                <div
                  aria-label={`Rated ${item.rating} out of 5`}
                  className="mb-4 text-[14px] tracking-[2px] text-bfx-amber"
                >
                  <span aria-hidden>{"★".repeat(item.rating)}</span>
                </div>
                <blockquote className="bfx-pretty m-0 font-display text-[23px] leading-[1.35] tracking-[-0.01em] text-[#1A2534]">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>

              <figcaption className="border-t border-bfx-hair-2 pt-5">
                <div className="flex items-center gap-[13px]">
                  <div className="h-11 w-11 flex-none overflow-hidden rounded-full">
                    {/* Handoff: a bare #EDE4D5 disc, no glyph, at this size. */}
                    <MediaSlot src={null} alt="" bare="#EDE4D5" />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-bfx-ink">{item.name}</div>
                    <div className="text-[13px] font-semibold text-bfx-muted">
                      {item.instrument} · {item.level}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-[13px] font-semibold text-bfx-muted-2">
                  Course: <span className="text-bfx-body">{item.course}</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        /* Filtered-empty state */
        <div className="rounded-[22px] border border-bfx-border bg-bfx-surface px-8 py-14 text-center">
          <p className="font-display text-[26px] leading-none tracking-[-0.02em] text-bfx-ink">
            Nothing under that combination
          </p>
          <p className="mx-auto mt-3 max-w-[380px] text-[15px] leading-[1.6] text-bfx-body-2">
            We don&apos;t have a story from that instrument at that level yet.
          </p>
          {isFiltered ? (
            <button
              type="button"
              onClick={() => {
                setInstrument("all")
                setLevel("all")
              }}
              className="mt-6 inline-flex min-h-11 items-center rounded-full border-[1.5px] border-[#E1D8C9] px-[22px] py-[13px] text-[14.5px] font-bold text-bfx-ink transition-colors hover:border-bfx-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}
