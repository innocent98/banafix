"use client"

/**
 * Sticky site header — "Banafix Redesign.dc.html", header block.
 *
 * Handoff spec: 76px tall, cream at 86% with a 14px backdrop blur, hairline
 * #EBE3D7 underneath, 1240px shell. The 76px height is load-bearing: the
 * courses filter bar sticks at `top:76px` and the course-detail aside at
 * `top:104px`, both measured from it.
 *
 * The handoff has no mobile design (it is a desktop canvas), so the drawer
 * below is an extension built from the same tokens rather than a transcription.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { PillAnchor, PillLink } from "@/components/site/primitives"
import { Wordmark } from "@/components/site/wordmark"
import { ENROL_HREF, ENROL_LABEL, PRIMARY_NAV, SITE_PHONE_DISPLAY, SITE_PHONE_TEL } from "@/lib/site"
import { cn } from "@/lib/utils"

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the drawer on navigation, so a tap on a link doesn't leave it open.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-bfx-border-3 bg-bfx-cream/[0.86] backdrop-blur-[14px]">
      <div className="bfx-shell flex h-[76px] items-center justify-between gap-8">
        <Link href="/" aria-label="Banafix home" className="text-bfx-ink">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <PillLink
              key={item.href}
              href={item.href}
              variant="ghost"
              size="nav"
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(isActive(pathname, item.href) && "bg-bfx-hover-nav text-bfx-ink")}
            >
              {item.label}
            </PillLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={SITE_PHONE_TEL}
            className="hidden text-sm font-semibold text-bfx-phone transition-colors hover:text-bfx-ink xl:inline"
          >
            {SITE_PHONE_DISPLAY}
          </a>
          <PillLink href={ENROL_HREF} variant="ink" size="sm" className="hidden sm:inline-flex">
            {ENROL_LABEL}
          </PillLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="bfx-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-full text-bfx-ink transition-colors hover:bg-bfx-hover-nav lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="bfx-mobile-nav" className="border-t border-bfx-border-3 bg-bfx-cream lg:hidden">
          <nav className="bfx-shell flex flex-col gap-1 py-4">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-4 py-3 text-[15px] font-semibold text-bfx-label transition-colors hover:bg-bfx-hover-nav hover:text-bfx-ink",
                  isActive(pathname, item.href) && "bg-bfx-hover-nav text-bfx-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-bfx-border-3 pt-4">
              <PillLink href={ENROL_HREF} variant="ink" size="blockSm" className="sm:hidden">
                {ENROL_LABEL}
              </PillLink>
              <PillAnchor href={SITE_PHONE_TEL} variant="outlineSoft" size="blockSm">
                {SITE_PHONE_DISPLAY}
              </PillAnchor>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

/** Re-exported for callers that already import the mark from the header. */
export { Wordmark }
