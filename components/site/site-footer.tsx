/**
 * Site footer — "Banafix Redesign.dc.html", footer block.
 *
 * Handoff spec: ink ground, 4 auto-fit columns (min 200px) with a 48px gutter,
 * 76px top padding, and a hairline `#22314699` above the legal row.
 *
 * Two faithful extensions: the ACADEMY column carries FAQs and Testimonials so
 * those routes stay reachable now that the primary nav is down to four items,
 * and the POPULAR instruments deep-link into the courses filter instead of
 * being inert text.
 */

import Link from "next/link"

import { Wordmark } from "@/components/site/wordmark"
import {
  ENROL_HREF,
  ENROL_LABEL,
  POPULAR_INSTRUMENTS,
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_EMAIL_MAILTO,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_TEL,
  SOCIAL_LINKS,
} from "@/lib/site"

const ACADEMY_LINKS = [
  { label: "Courses", href: "/courses" },
  { label: "Tutors", href: "/tutors" },
  { label: "Contact", href: "/contact" },
  { label: ENROL_LABEL, href: ENROL_HREF },
  { label: "FAQs", href: "/faqs" },
  { label: "Testimonials", href: "/testimonials" },
]

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[18px] text-[12.5px] font-bold tracking-[0.1em] text-bfx-amber">{children}</div>
  )
}

export function SiteFooter() {
  return (
    <footer className="bg-bfx-ink text-white">
      <div className="bfx-shell grid gap-12 pt-[76px] pb-[34px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <div>
          <Link href="/" aria-label="Banafix home" className="mb-[18px] inline-block text-white">
            <Wordmark inverted />
          </Link>
          <p className="mb-[22px] max-w-[280px] text-[15px] leading-[1.65] text-bfx-on-dark-3">
            A Lagos music academy teaching one student at a time since 2016.
          </p>
          <div className="flex gap-[9px]">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="grid h-[38px] w-[38px] place-items-center rounded-[11px] bg-white/[0.08] text-sm font-bold text-bfx-on-dark transition-colors hover:bg-white/[0.16]"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <ColumnHeading>ACADEMY</ColumnHeading>
          <div className="flex flex-col gap-3 text-[15px] font-medium text-bfx-on-dark-2">
            {ACADEMY_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="w-fit transition-colors hover:text-bfx-amber">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <ColumnHeading>POPULAR</ColumnHeading>
          <div className="flex flex-col gap-3 text-[15px] font-medium text-bfx-on-dark-2">
            {POPULAR_INSTRUMENTS.map((instrument) => (
              <Link
                key={instrument}
                href={`/courses?instrument=${encodeURIComponent(instrument)}`}
                className="w-fit transition-colors hover:text-bfx-amber"
              >
                {instrument}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <ColumnHeading>VISIT</ColumnHeading>
          <div className="flex flex-col gap-3 text-[15px] font-medium leading-[1.55] text-bfx-on-dark-2">
            <a href={SITE_PHONE_TEL} className="w-fit transition-colors hover:text-bfx-amber">
              {SITE_PHONE_DISPLAY}
            </a>
            <a href={SITE_EMAIL_MAILTO} className="w-fit transition-colors hover:text-bfx-amber">
              {SITE_EMAIL}
            </a>
            <address className="not-italic">
              {SITE_ADDRESS_LINES[0]}
              <br />
              {SITE_ADDRESS_LINES[1]}
            </address>
          </div>
        </div>
      </div>

      <div className="bfx-shell flex flex-wrap justify-between gap-5 border-t border-[#22314699] pt-6 pb-10 text-[13.5px] text-bfx-on-dark-6">
        <span>© {new Date().getFullYear()} Banafix. All rights reserved.</span>
        <span className="flex gap-6">
          <Link href="/policies#privacy" className="transition-colors hover:text-bfx-amber">
            Privacy policy
          </Link>
          <Link href="/policies#terms" className="transition-colors hover:text-bfx-amber">
            Terms of service
          </Link>
        </span>
      </div>
    </footer>
  )
}
