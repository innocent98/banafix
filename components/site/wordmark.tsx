/**
 * The Banafix wordmark — 32px tile + name, from the handoff's header and
 * footer blocks (inverted between the two).
 *
 * It lives in its own server-safe module rather than inside `site-header.tsx`
 * because `app/not-found.tsx` sits outside the `(site)` route group and needs
 * the mark without dragging the sticky header's client bundle (drawer state,
 * effects, lucide icons) onto an otherwise static page.
 */
import { cn } from "@/lib/utils"

export function Wordmark({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-[11px]">
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-[10px] text-[17px] font-extrabold",
          inverted ? "bg-bfx-amber text-bfx-ink" : "bg-bfx-ink text-bfx-amber",
        )}
      >
        B
      </span>
      <span className="text-[21px] font-extrabold tracking-[-0.02em]">Banafix</span>
    </span>
  )
}
