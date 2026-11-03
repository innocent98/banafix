/**
 * Location chooser. Physical centres and ONLINE-kind locations (Online, Diaspora) sit in one list,
 * so anyone can pick the online options regardless of where they live. The choice is persisted in
 * the URL as `?location=<slug>` (B1): shareable, and a plain link keeps the page a server component.
 *
 * `hrefFor(null)` is the "no location" target; the caller decides which other params to keep.
 */
import Link from "next/link"

import { chip } from "@/components/site/courses/styles"

export interface ChooserLocation {
  id: string
  name: string
  slug: string
  kind: "PHYSICAL" | "ONLINE"
}

export function LocationChooser({
  locations,
  activeSlug,
  hrefFor,
  allLabel,
  label = "Where do you want to learn?",
}: {
  locations: readonly ChooserLocation[]
  activeSlug: string | null
  hrefFor: (slug: string | null) => string
  /** Label of the "no location" chip. Omit to hide that chip (a location is then required). */
  allLabel?: string
  label?: string
}) {
  if (locations.length === 0) return null

  return (
    <nav aria-label="Choose a location">
      <p className="mb-3 text-[12.5px] font-bold tracking-[0.06em] text-bfx-muted-2">
        {label.toUpperCase()}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {allLabel ? (
          <Link
            href={hrefFor(null)}
            aria-current={activeSlug === null ? "page" : undefined}
            className={chip(activeSlug === null)}
          >
            {allLabel}
          </Link>
        ) : null}
        {locations.map((location) => (
          <Link
            key={location.id}
            href={hrefFor(location.slug)}
            aria-current={activeSlug === location.slug ? "page" : undefined}
            className={chip(activeSlug === location.slug)}
          >
            {location.name}
            {location.kind === "ONLINE" ? (
              <span
                className={
                  "text-[11px] font-bold tracking-[0.04em] " +
                  (activeSlug === location.slug ? "text-white/70" : "text-bfx-muted-2")
                }
              >
                ONLINE
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  )
}
