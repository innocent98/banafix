# SOP — Public site UI redesign (Banafix Redesign handoff)

**Shipped:** 2026-09-01 · branch `ui-redesign` · 94 files, +8,431 / −4,392

## What shipped

The entire public site rebuilt against the **`Banafix Redesign.dc.html`** UI handoff
(Claude Design project `7a918e54-fc4c-472c-ab90-482914a181a9`) — a new visual language
(cream `#FAF6F0` / navy `#101A28` / amber `#F5A524`, Instrument Serif + Plus Jakarta Sans)
replacing the previous blue/gold Inter+Sora system, across all six designed screens plus
seven secondary pages. `/admin` is deliberately untouched.

## Why

A design handoff was delivered as a Claude Design canvas document and needed to become the
real site at full parity. Four scope decisions were taken with the user up front:

| Question | Decision |
| --- | --- |
| How far does the redesign reach? | Six handoff screens at full parity **plus** every other public page restyled. Admin unchanged. |
| Are the handoff's ₦5,000 / 7.5% VAT / mode-delta figures the real model? | **No — visual parity only.** Real DB pricing and `lib/application-fee.ts` unchanged; no backend pricing change. |
| Nav / IA | Match the handoff's four-item nav; `/instructors` → `/tutors` with a permanent redirect. |
| The "Book a free trial" CTA (no trial flow exists) | Lands on `/contact?subject=trial`, which preselects that subject. |

## How

### Architecture

- **Route group `app/(site)/`.** All 11 public routes moved in via `git mv`; one layout owns
  the cream ground, the sticky header and the ink footer. This exists because the handoff's
  **76px header height is load-bearing** — the courses filter sticks at `top:76px` and the
  course-detail aside at `top:104px`, both measured off it. One layout, one source of truth.
  `/admin` and `/api` stay at the root and are unaffected.
- **Token layer is additive.** The `bfx-*` tokens were appended to `app/globals.css` in their
  own block; the existing shadcn tokens are untouched, so `/admin` keeps its old look. The
  cream ground and Plus Jakarta face are applied by a `.bfx-site` class on the site shell,
  **not** on `<body>` — that is what keeps admin out of it.
- **Server components throughout.** Every public page was previously `"use client"` with a
  `useEffect` + `fetch` waterfall. They now read Prisma directly, with small client leaves for
  genuine interactivity. `/courses` and `/` ship ~180 B of route JS.

### Key decisions and trade-offs

| Decision | Rationale | Alternative rejected |
| --- | --- | --- |
| Delete `app/instructors/[id]` | It was a hardcoded "John Adebayo" page that ignored its route param — every id rendered the same fabricated person. The handoff has no tutor detail screen and its cards aren't clickable. | Restyling it, which would have made fabricated data look more credible. |
| Hide the course **Reviews** tab | No review model exists in Prisma; the handoff's three quotes are canvas sample data. | Shipping invented reviews, or a "coming soon" panel on a page selling a course. |
| Real `course.faqs[]` as a fifth tab | Live data that the outgoing page rendered inline. Built on `<details>/<summary>` — zero JS, keyboard-operable. | — |
| Enrol wizard 5 steps → 3 | The handoff's structure. Nothing load-bearing lost: **two** consent checkboxes are still rendered (the server rejects without both `agreeToTerms` and `agreeToRefundPolicy`), and the old Review step's content moved into the always-visible summary aside. | Collapsing two legal consents into the handoff's single checkbox. |
| Payment-method rows are informational, not selectable | The app sends Paystack no channel and the server overwrites `paymentMethod` with `'pending'`. A pickable row that changes nothing is a lie the student discovers on the next screen. | Faithful-but-dishonest selectable rows. |
| Contact form given a real backend | The handoff ships a working "Send message" button; the form was decorative (no `onSubmit`, no endpoint). | Shipping a button that silently does nothing. |
| `MediaSlot` `<img>` split into a client leaf | The one live Instructor row points `avatar` at `/instructor-john.jpg`, which does not exist. Without `onError`, the broken-image icon paints over the designed empty state. Only mounts when a `src` exists. | Making all of `MediaSlot` a client component. |

### Live bug fixed by the redesign

The format a user picked on the course page **was being discarded**. `formData.selectedMode`
was never set anywhere in the enrol flow, so `app/enroll/page.tsx:227` always fell back to
`course.modes[0]` — meaning the price shown and the mode stored on the `Enrollment` (which
admin tuition billing later reads at `app/api/admin/enrollments/[id]/tuition/route.ts:95`)
could both be wrong. The handoff makes format an explicit step, so implementing it faithfully
closes the gap: the course aside now emits `/enroll?courseId=…&mode=…`, and the wizard reads,
validates against `course.availableModes`, and submits the real choice.

### Handoff hardcodes replaced with derived values

Every money figure in the handoff is design filler. All are now derived:

- `₦5,000` registration → `calculateApplicationFee(course.location).amount`
  (₦5,000 Lagos/Abuja/Online · ₦8,000 diaspora · ₦2,000 other) — the handoff hardcodes it in
  four places; all four derive it.
- Mode deltas `+₦5,000 / −₦5,000 / +₦10,000` → real `course.pricing[mode]`.
- "Twelve weeks" / "Total for 12 weeks" → real `course.duration`.
- Per-lesson price → rendered **only** when `duration` parses to a week count.
- "All 12 courses" → the real published count.
- Level filter chips → distinct `level` values actually present.
- VAT 7.5% stays **display-only** on the course fee, exactly as before. It is never charged
  and never sent to the server.

## What's involved

| Area | Paths |
| --- | --- |
| Tokens & type | `app/globals.css` (appended `bfx-*` block + reduced-motion guard), `app/layout.tsx` (Instrument Serif, Plus Jakarta Sans) |
| Shell | `app/(site)/layout.tsx`, `app/(site)/error.tsx`, `components/site/site-header.tsx`, `site-footer.tsx`, `wordmark.tsx` |
| Primitives | `components/site/primitives.tsx`, `media-slot.tsx`, `media-slot-image.tsx`, `lib/site.ts` |
| Screens | `app/(site)/{page,courses,courses/[id],tutors,enroll,enroll/success,contact}` + `components/site/{home,courses,tutors,enroll,contact}/` |
| Secondary | `app/(site)/{faqs,testimonials,policies,admissions,events,dashboard}`, `app/not-found.tsx` + `components/site/{faqs,testimonials,policies,events}/` |
| New endpoint | `app/api/contact/route.ts`, `lib/contact-message.ts` |
| Routing | `next.config.ts` — permanent redirects `/instructors`, `/instructors/:id`, `/tutors/:id` → `/tutors` |
| Contract | `docs/superpowers/specs/2026-09-01-ui-redesign-contract.md` |

**Deleted:** `app/instructors/[id]/page.tsx`, `components/instructors/instructor-profile-header.tsx`,
`instructor-profile-tabs.tsx`, `instructor-sidebar.tsx`.

**Unchanged, verified byte-identical:** `app/api/enrollments/route.ts`, `lib/paystack.ts`,
`lib/application-fee.ts`, `app/api/webhooks/paystack/route.ts`, Prisma schema, all of `/admin`.

## New endpoint — `POST /api/contact`

The only backend addition. Unauthenticated, so it carries a honeypot field, a per-IP throttle
(3 per 10 min), and a strict subject allow-list. Sends via Resend to
`SUPPORT_EMAIL || ADMIN_EMAIL` with `replyTo` set to the sender.

| Case | Status |
| --- | --- |
| Valid, Resend unavailable | `502` + copy pointing at WhatsApp/email — **never a fake success** |
| Missing name / bad email / short message | `400` with per-field messages |
| Honeypot filled | `200` `{success:true}`, no send, logged |
| Subject off the allow-list | `400` |
| 4th send from one IP in the window | `429` |

Validation lives in `lib/contact-message.ts` and is imported by both the form and the route so
the two cannot drift.

## Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **Clean, exit 0**, whole project |
| `npx next build` | **Passes** — 36/36 static pages generated |
| All 11 public routes + 404 | **200 / 404 as expected** against `next start` |
| `/instructors` redirect | **308 → /tutors** |
| `POST /api/contact` — 7 cases | **All behave as tabled above** (exercised live against a running server) |
| Enrol POST contract vs `api/enrollments/route.ts` | **Verified field by field by execution**, not inspection — all 5 required fields, both consent booleans, email regex, mode ∈ `availableModes`, all 26 destructured keys present, and zero client-computed money fields in the body |
| Fee derivation | ₦5,000 Lagos · ₦8,000 diaspora · ₦2,000 Akure — computed, not hardcoded |
| Home featured data | Live fetch confirmed real course ids, real levels, and real per-mode "from" prices (On-site ₦25,000 · Online ₦20,000 · Home Training ₦35,000) |

**Not verified:** no human has looked at these screens in a browser. `tsc`, the build and the
route smoke tests prove the code is sound; they prove nothing about how it *looks* at 375px
or 1280px. See Follow-ups.

## Operate / roll back

Nothing to migrate, no env var required, no data touched. `git revert` the merge, or reset the
branch — the route-group move was done with `git mv`, so history follows the files.

`POST /api/contact` will return 502 until a real `RESEND_API_KEY` and a verified sender domain
are in place. That is the same pre-existing blocker as the enrolment and birthday emails, and
the form degrades honestly (tells the visitor to use WhatsApp) rather than silently failing.

## Follow-ups

1. **Visual QA in a browser** — the one real gap. Walk `/`, `/courses`, `/courses/[id]`,
   `/enroll`, `/contact` at 375px and 1280px.
2. **Fabricated content removed from `/dashboard` and `/events`** — see
   `docs/checklist/master-checklist.md`; both need a product decision.
3. **`/admissions` tuition tiers** (₦25,000 / ₦15,000 / ₦12,000) contradict real per-course
   pricing. Reframed as indicative; should probably be deleted.
4. **Dead code sweep** — `components/enrollment/*`, `components/sections/*`,
   `components/instructors/instructor-card.tsx`, `instructor-filters.tsx` are now unreferenced.
   Left in place deliberately so this diff stays a redesign, not a deletion.
5. **ESLint is broken repo-wide** (pre-existing): `Could not find plugin "@typescript-eslint"`.
   The packages *are* installed — it is an eslint 9 / legacy `.eslintrc.json` resolution
   failure. Not a gate today (`eslint.ignoreDuringBuilds: true`, no CI workflows), but it
   means there is no lint gate at all.
6. **`sendContactEnquiry()` belongs in `lib/email.ts`** — the route re-declares the Resend
   client to stay in scope. Note the route HTML-escapes every interpolated field;
   `lib/email.ts` does not, which is fine for admin input but a trap for the next
   public-input template.
7. **Policy pages still say "Last updated: December 15, 2024"** — ~21 months stale.
