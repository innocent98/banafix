/**
 * Shared primitives for the redesigned public site.
 *
 * Every value here is lifted from "Banafix Redesign.dc.html". The handoff has
 * no component layer — it inlines styles and uses `style-hover` attributes as
 * its stand-in for `:hover` — so these are the de-duplicated versions of the
 * button, eyebrow, heading and chip treatments that recur across its screens.
 *
 * Note the handoff deliberately uses two different outline greys (#D8CEBE on
 * the hero, #E1D8C9 elsewhere); both are preserved as separate variants rather
 * than normalised away.
 */
import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Button                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Exported so a non-interactive pill *surface* can reuse the real definition.
 * A card whose whole body is one <Link> (one tab stop, full-card hit area)
 * cannot nest a button, so its CTA must render as a <span> — that span should
 * still be styled from here rather than from a hand-copied class string.
 * Use `PillLink` / `PillButton` for anything actually interactive.
 */
export const pillButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream",
  {
    variants: {
      variant: {
        /** Header CTA, "View course". Ink → amber on hover. */
        ink: "border-0 bg-bfx-ink text-white hover:bg-bfx-amber hover:text-bfx-ink",
        /** Primary hero CTA. Amber with a soft amber cast, → ink on hover. */
        amber:
          "border-0 bg-bfx-amber text-bfx-ink shadow-[0_8px_24px_rgba(245,165,36,0.32)] hover:bg-bfx-ink hover:text-white",
        /** Amber on an ink ground — no cast, goes white on hover. */
        amberOnInk: "border-0 bg-bfx-amber text-bfx-ink hover:bg-white",
        /**
         * Amber with no drop cast — the enrol aside's primary button. The
         * handoff gives the hero CTA a shadow and this one none, so it is a
         * separate variant rather than `amber` + a shadow-none override.
         */
        amberFlat: "border-0 bg-bfx-amber text-bfx-ink hover:bg-bfx-ink hover:text-white",
        /** Hero secondary. */
        outline:
          "border-[1.5px] border-[#D8CEBE] bg-transparent text-bfx-ink hover:border-bfx-ink hover:bg-white",
        /** Section secondary ("All N courses →", "Book a free trial first"). */
        outlineSoft:
          "border-[1.5px] border-[#E1D8C9] bg-transparent text-bfx-ink hover:border-bfx-ink",
        /** Secondary on an ink ground. */
        outlineOnInk:
          "border-[1.5px] border-white/35 bg-transparent text-white hover:border-white hover:bg-white/10",
        /** Nav item. */
        ghost:
          "border-0 bg-transparent font-semibold text-bfx-label hover:bg-bfx-hover-nav hover:text-bfx-ink",
      },
      size: {
        /** Nav items — 9px 15px. */
        nav: "px-[15px] py-[9px] text-[14.5px]",
        /** Header CTA, card CTA — 12px 22px. */
        sm: "px-[22px] py-3 text-[14.5px]",
        /** Section secondary — 13px 22px. */
        md: "px-[22px] py-[13px] text-[14.5px]",
        /** Hero + band CTAs — 16-17px 26-30px. */
        lg: "px-7 py-4 text-[15.5px]",
        xl: "px-[30px] py-[17px] text-[15.5px]",
        /** Full-width block button in the enrol / pricing asides. */
        block: "w-full rounded-[14px] px-4 py-4 text-[15.5px]",
        blockSm: "w-full rounded-[14px] px-4 py-[14px] text-[15px]",
      },
    },
    defaultVariants: { variant: "ink", size: "sm" },
  },
)

type PillButtonVariants = VariantProps<typeof pillButton>

export interface PillLinkProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "className">,
    PillButtonVariants {
  className?: string
}

/** A pill styled as a link — use whenever the action is a navigation. */
export function PillLink({ variant, size, className, ...props }: PillLinkProps) {
  return <Link className={cn(pillButton({ variant, size }), className)} {...props} />
}

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    PillButtonVariants {}

/** A pill styled as a button — use for in-page state changes only. */
export function PillButton({ variant, size, className, type = "button", ...props }: PillButtonProps) {
  return <button type={type} className={cn(pillButton({ variant, size }), className)} {...props} />
}

/** Escape hatch for anchors that must stay native (tel:, mailto:, wa.me). */
export function PillAnchor({
  variant,
  size,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & PillButtonVariants) {
  return <a className={cn(pillButton({ variant, size }), className)} {...props} />
}

/* -------------------------------------------------------------------------- */
/*  Type                                                                       */
/* -------------------------------------------------------------------------- */

/** 12px / 700 / 0.12em tracked label above every section heading. */
export function Eyebrow({
  children,
  onInk = false,
  className,
}: {
  children: React.ReactNode
  onInk?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "mb-3 text-xs font-bold tracking-[0.12em]",
        onInk ? "text-bfx-amber" : "text-bfx-bronze",
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Instrument Serif display heading. The handoff always pairs weight 400 with
 * -0.02em tracking and a 1.0–1.08 leading — bolding it breaks the face.
 */
export function Display({
  as: Tag = "h2",
  children,
  className,
}: {
  as?: "h1" | "h2" | "h3"
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tag className={cn("font-display font-normal tracking-[-0.02em]", className)}>{children}</Tag>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bits                                                                       */
/* -------------------------------------------------------------------------- */

/** Metadata chip on course cards — "12 weeks", "4 formats". */
export function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-bfx-tint px-[11px] py-1.5 text-[12.5px] font-semibold text-bfx-body">
      {children}
    </span>
  )
}

/** Level badge overlaid on a course card's photo. */
export function LevelBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "absolute z-[2] rounded-full bg-bfx-ink/[0.86] px-[11px] py-1.5 text-[11.5px] font-bold tracking-[0.03em] text-white",
        className,
      )}
    >
      {children}
    </span>
  )
}

/** The amber ✓ pip used in outcome lists and format bullet points. */
export function CheckPip({ onInk = false }: { onInk?: boolean }) {
  return (
    <span
      className={cn(
        "grid flex-none place-items-center rounded-full",
        onInk
          ? "h-4 w-4 bg-bfx-amber/[0.18] text-[10px] text-bfx-amber"
          : "h-[22px] w-[22px] bg-bfx-ink text-[11px] text-bfx-amber",
      )}
      aria-hidden
    >
      ✓
    </span>
  )
}
