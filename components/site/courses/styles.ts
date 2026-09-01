/**
 * Direct ports of the three derived-style helpers in "Banafix Redesign.dc.html"
 * (`chip()`, `tabStyle()`, `row()`). The handoff builds them as inline style
 * strings switched on an `active` boolean; these are the same values expressed
 * as Tailwind classes so the active/inactive states stay in one place.
 *
 * The literal hexes are referenced through their `--bfx-*` variables — every
 * one is already defined in app/globals.css.
 */
import { cn } from "@/lib/utils"

/**
 * Filter chip — courses list.
 * Handoff: `border:0;padding:11px 18px;border-radius:999px;font-size:14px;
 * font-weight:700;background:#101A28|#fff;color:#fff|#4E5C71;
 * box-shadow:inset 0 0 0 1px #101A28|#E4DACB`
 */
export function chip(active: boolean) {
  return cn(
    "inline-flex items-center gap-2 rounded-full border-0 px-[18px] py-[11px] text-sm font-bold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-offset-2 focus-visible:ring-offset-bfx-cream",
    active
      ? "bg-bfx-ink text-white shadow-[inset_0_0_0_1px_var(--bfx-ink)]"
      : "bg-bfx-surface text-bfx-body shadow-[inset_0_0_0_1px_var(--bfx-border-2)] hover:text-bfx-ink hover:shadow-[inset_0_0_0_1px_var(--bfx-ink)]",
  )
}

/**
 * Course-detail tab.
 * Handoff: `background:transparent;border:0;padding:14px 20px;font-size:15px;
 * font-weight:700;color:#101A28|#7A8798;box-shadow:inset 0 -2px 0 #F5A524|transparent`
 */
export function tabStyle(active: boolean) {
  return cn(
    "shrink-0 border-0 bg-transparent px-5 py-3.5 text-[15px] font-bold transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bfx-amber focus-visible:ring-inset",
    active
      ? "text-bfx-ink shadow-[inset_0_-2px_0_var(--bfx-amber)]"
      : "text-bfx-muted shadow-[inset_0_-2px_0_transparent] hover:text-bfx-ink",
  )
}

/**
 * Selectable row — the aside's format picker.
 * Handoff: `display:flex;align-items:center;justify-content:space-between;
 * gap:14px;padding:15px 17px;border-radius:14px;cursor:pointer;
 * background:#FBF5EA|#FCFAF7;box-shadow:inset 0 0 0 1.5px #F5A524|1px #EAE1D3`
 */
export function row(active: boolean) {
  return cn(
    "flex cursor-pointer items-center justify-between gap-3.5 rounded-[14px] px-[17px] py-[15px] text-left transition-colors",
    active
      ? "bg-bfx-note-bg shadow-[inset_0_0_0_1.5px_var(--bfx-amber)]"
      : "bg-bfx-field shadow-[inset_0_0_0_1px_var(--bfx-border)] hover:shadow-[inset_0_0_0_1px_var(--bfx-border-2)]",
  )
}
