"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * Sticky table of contents for /policies.
 *
 * These are real `#id` anchors, not a JS tab switcher — the site footer links
 * to /policies#privacy and /policies#terms, and those have to land on the
 * right section with JS off. The only thing JavaScript adds here is the active
 * highlight, which follows the handoff's numbered treatment: an Instrument
 * Serif index in bronze beside the label.
 *
 * `top-[104px]` is measured from the 76px header, matching the course-detail
 * aside in the handoff.
 */
export function PolicyNav({ items }: { items: { id: string; navLabel: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null)

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // Trigger once a section's top clears the sticky header.
      { rootMargin: "-104px 0px -65% 0px", threshold: 0 },
    )

    for (const heading of headings) observer.observe(heading)
    return () => observer.disconnect()
  }, [items])

  return (
    <nav aria-label="Policy sections" className="lg:sticky lg:top-[104px]">
      <div className="overflow-hidden rounded-[20px] border border-bfx-border bg-bfx-surface">
        <div className="border-b border-bfx-hair px-6 py-[18px] text-[12.5px] font-bold tracking-[0.08em] text-bfx-muted-2">
          ON THIS PAGE
        </div>
        <ul className="m-0 flex list-none flex-col p-2">
          {items.map((item, index) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-[12px] px-4 py-[11px] text-[14.5px] font-semibold transition-colors",
                  active === item.id
                    ? "bg-bfx-cream text-bfx-ink"
                    : "text-bfx-body-2 hover:bg-bfx-cream hover:text-bfx-ink",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "font-display text-[17px] leading-none",
                    active === item.id ? "text-bfx-bronze" : "text-bfx-muted-2",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.navLabel}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
