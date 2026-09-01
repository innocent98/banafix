# UI Redesign — implementation contract

Source of truth: **`Banafix Redesign.dc.html`** (Claude Design project
`7a918e54-fc4c-472c-ab90-482914a181a9`). A local copy of the exact handoff markup is at:

```
/private/tmp/claude-501/-Users-adebayovictor-Documents-dev-banafix/9da1230c-142f-43ab-b495-f3c65eff80e4/scratchpad/handoff.html
```

**Read that file for the screen you are building before writing any code.** Every px value,
hex, radius and copy string in it is intentional. Match them.

---

## 1. How to read the handoff

It is a Claude Design *canvas* document, not shippable HTML. Its runtime (`support.js`)
interprets:

| Handoff construct | Ships as |
| --- | --- |
| `<sc-if value="{{ isCourses }}">` | a route boundary — one screen per `sc-if` |
| `<sc-for list="{{ x }}" as="y">` | `x.map(y => …)` |
| `{{ expr }}` | a JSX expression |
| `style-hover="…"` | a Tailwind `hover:` variant |
| `style-focus="…"` | a Tailwind `focus:` variant |
| `<image-slot>` | `<MediaSlot>` (see §3) |
| `onClick="{{ go.courses }}"` | `<Link href="/courses">` |

The `<script type="text/x-dc">` block at the bottom holds the sample data and the derived
styles (`chip()`, `tabStyle()`, `row()`). Those three helpers are the active/inactive states
for filter chips, tabs and selectable rows — port them faithfully.

---

## 2. Design tokens — already built, do not redefine

All tokens live in `app/globals.css` under the "Banafix Redesign" block and are exposed as
Tailwind classes (`bg-bfx-cream`, `text-bfx-bronze`, `border-bfx-border-2`, …).

| Token | Hex | Use |
| --- | --- | --- |
| `bfx-cream` | `#FAF6F0` | page ground |
| `bfx-cream-2` | `#F2ECE3` | trusted-by band |
| `bfx-cream-3` | `#F1EAE0` | hero pill badge |
| `bfx-tint` | `#F4EEE4` | meta chips |
| `bfx-surface` | `#FFFFFF` | cards |
| `bfx-field` | `#FCFAF7` | input fill |
| `bfx-hover-nav` | `#F0E9DE` | nav hover |
| `bfx-ink` | `#101A28` | dark sections, primary text |
| `bfx-ink-2` | `#152337` | card on ink |
| `bfx-ink-3` | `#1C2C42` | media well on ink |
| `bfx-line-dark` | `#26364C` | rule on ink |
| `bfx-amber` | `#F5A524` | accent |
| `bfx-bronze` | `#B0730C` | eyebrows, links |
| `bfx-body` / `bfx-body-2` | `#4E5C71` / `#5B6A7E` | body copy |
| `bfx-strong` | `#26333F` | list copy |
| `bfx-label` | `#3D4B60` | form labels, nav |
| `bfx-muted` / `bfx-muted-2` | `#7A8798` / `#8B96A6` | captions |
| `bfx-phone` | `#62718A` | header phone |
| `bfx-on-dark`…`-6` | `#D5DEE9` `#B9C5D4` `#93A3B6` `#9CAABC` `#8797AB` `#7E8DA1` | text on ink |
| `bfx-border`…`-7` | `#EAE1D3` `#E4DACB` `#EBE3D7` `#E7DECF` `#EDE5D8` `#E9E0D2` `#E6DDCE` | graded rules |
| `bfx-hair` / `-2` | `#F2EBDF` / `#F0E8DB` | hairlines |
| `bfx-note-*` | `#FBF5EA` `#F0E2C9` `#6B5327` | amber note block |
| `bfx-ok-*` | `#F1F8F2` `#D6E8D9` `#2F5B39` | green security note |

The handoff uses **seven** near-identical border greys on purpose. Use the one the handoff
uses in that spot; do not collapse them.

### Type

- `font-display` → Instrument Serif. **Always `font-normal`** with `tracking-[-0.02em]`.
  Leading `1` for page headings, `1.08` for section headings. Never bold it.
- `font-body` / default → Plus Jakarta Sans. Weights 400–800.
- Handoff sizes are often half-pixel (`14.5px`, `15.5px`, `12.5px`, `18.5px`). Keep them:
  `text-[14.5px]`.

### Layout

- `bfx-shell` utility = `max-width:1240px; margin-inline:auto; padding-inline:clamp(20px,4vw,40px)`.
- The header is **76px** tall. Sticky offsets measured from it (courses filter `top-[76px]`,
  course aside `top-[104px]`) must be preserved.
- Entrance animation: `bfx-rise` / `bfx-rise-2` utilities.

---

## 3. Shared components — already built, **do not modify**

Treat these as frozen. If you need a change, note it in your report instead of editing.

```
components/site/primitives.tsx   PillLink · PillButton · PillAnchor · Eyebrow · Display
                                 MetaChip · LevelBadge · CheckPip
components/site/media-slot.tsx   MediaSlot
components/site/site-header.tsx  SiteHeader · Wordmark
components/site/site-footer.tsx  SiteFooter
lib/site.ts                      contact details, PRIMARY_NAV, TRIAL_HREF, formatNaira()
app/(site)/layout.tsx            shell — already renders header + footer
app/globals.css                  tokens
```

**`MediaSlot`** replaces every `<image-slot>`. It renders the handoff's designed empty state
(diagonal gradient + oversized low-opacity music glyph) and lays the photo over it when one
exists. Most DB rows have no image, so the empty state is the common case.

```tsx
<MediaSlot src={course.image} alt={course.title} glyph="note" glyphSize={62} tone="light" />
// glyph: "note" ♪ (cards) · "notes" ♫ (heroes) · "beamed" ♬ (formats, studio)
// tone:  "dark" inside ink sections
```

**`formatNaira(n)`** is the handoff's `NGN()` helper. Use it for every price.

### Rules for every page you build

1. **Do not render `<Navigation>` or `<Footer>`** — `app/(site)/layout.tsx` provides them.
   Delete those imports from any page you touch.
2. Page-specific components go in `components/site/<screen>/`. Do not add to
   `components/sections/` (that is the outgoing design).
3. Do not touch `/admin`, `/api` (except where your brief says so), Prisma, or payment logic.

---

## 4. Data rules — non-negotiable

The user's decision: **visual parity only. Real data everywhere it exists; no backend or
pricing changes.**

- Course prices come from `course.pricing[mode]` (a JSON map keyed by delivery-mode name).
  `price` from the API is `Math.min(...)` across modes — the "from" price.
- The registration fee is `calculateApplicationFee(course.location)` in
  `lib/application-fee.ts` (₦5,000 Lagos/Abuja/Online · ₦8,000 diaspora · ₦2,000 other).
  **Do not hardcode ₦5,000** even though the handoff shows it — derive it.
- VAT 7.5% is **display-only** on the course fee and is already computed that way in
  `components/enrollment/enrollment-sidebar.tsx:15-26`. Keep it display-only. Never add it to
  a charged amount.
- Delivery modes come from `GET /api/delivery-modes` and `course.availableModes`. The four
  canonical names are `On-site`, `One-on-One`, `Online`, `Home Training`. The handoff's
  invented `+₦5,000 / −₦5,000 / +₦10,000` deltas are **design filler — ignore them** and read
  real per-mode prices from `course.pricing`.
- Where the handoff shows content the DB has no field for (the three format blurbs, the home
  testimonials, "3,200 alumni", "₦8,000 a term rental"), keep it as **static marketing copy**
  in the component, and add a one-line comment saying it is static. Do **not** invent a DB
  field, and do **not** fabricate per-record data (e.g. per-course reviews).
- Never present placeholder data as real. If the handoff shows a list the DB cannot fill,
  render a designed empty state or omit the block, and say so in your report.

---

## 5. Verification you must run before reporting

```bash
npx tsc --noEmit
```

Must be clean for the files you touched. Report the actual output — do not claim it passed
without running it.

---

## 6. Screen inventory

| Handoff `sc-if` | Route | Data |
| --- | --- | --- |
| `isHome` | `app/(site)/page.tsx` | `GET /api/courses` for the featured grid |
| `isCourses` | `app/(site)/courses/page.tsx` | `GET /api/courses`, `GET /api/delivery-modes` |
| `isCourse` | `app/(site)/courses/[id]/page.tsx` | `GET /api/courses/[id]` |
| `isTutors` | `app/(site)/tutors/page.tsx` | `GET /api/instructors` |
| `isEnroll` | `app/(site)/enroll/page.tsx` | `GET /api/courses/[id]` → `POST /api/enrollments` |
| `isContact` | `app/(site)/contact/page.tsx` | static + FAQ accordion |
