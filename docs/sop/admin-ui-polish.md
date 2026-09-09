# SOP — Admin UI polish (inputs, toggles, popups) + footer social icons

## What shipped
Global fixes so `/admin` forms look professional: **visible input borders**, a **clearly
on/off toggle**, and **popups that no longer feel cramped** — plus **real social icons** in the
site footer. Branch `ui-redesign`.

## Why
- **Root-cause bug:** `--input` was `oklch(1 0 0)` (**white**) in `app/globals.css`. The `Input`
  draws its border with `border-input` and the `Switch` draws its **off** track with `bg-input`,
  so on a white surface the **input outline and the off-toggle were literally invisible** — the
  two complaints ("inputs need visible borders", "toggle on/off always invisible").
- Popups read "shrunk/cranky": tight input height and no vertical scroll cap.
- The footer rendered social **letters** (`f`, `ig`, `x`, `yt`) instead of icons.

## How (key decisions)
- `app/globals.css`: `--input` → **grey-350** (`oklch(0.845 0 0)`) so every `border-input` control
  and the switch off-track are visible on white; `--border` nudged to `oklch(0.90 0 0)`. One token
  change fixes borders + toggles app-wide — no per-component churn.
- `components/ui/switch.tsx`: larger track (`h-6 w-11`), white thumb with shadow, and an explicit
  visible off-track (`bg-muted-foreground/35`) so on/off reads at a glance.
- `components/ui/input.tsx`: `h-9 → h-10` (+`py-2`) for breathing room; `select`/`textarea` inherit
  the border fix via `border-input`.
- `components/ui/dialog.tsx`: base `DialogContent` gains `max-h-[90vh] overflow-y-auto` so tall
  admin popups scroll instead of squeezing. Individual modals keep their wider `max-w-*`.
- `components/site/site-footer.tsx`: map each `SOCIAL_LINKS` entry to a lucide brand icon
  (Facebook/Instagram/YouTube) with an inline **X** SVG (lucide has no X mark), keeping aria-labels.

## What's involved (files)
`app/globals.css`, `components/ui/{input,switch,dialog}.tsx`, `components/site/site-footer.tsx`.

## Verification
- `npx tsc --noEmit` → 0 · `npm run build` → succeeds.
- **Visual confirmation pending on your side** — I didn't drive the live admin (it points at the
  prod DB). Eyeball an admin popup: inputs should show a grey outline, the toggle a clear grey
  off-track / gold on-track, and the footer should show icons.

## Follow-ups
- If you want borders even stronger, bump `--input` darker (e.g. `oklch(0.80 0 0)`).
