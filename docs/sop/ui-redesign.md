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

---

# Round 2 — corrections (2026-09-02)

Follow-up pass after the owner reviewed round 1. Brief:
`docs/superpowers/specs/2026-09-02-redesign-corrections.md`.

## What changed

### 1. No "free trial" anywhere
Banafix does not run trial lessons. `TRIAL_HREF` was deleted; the site CTA is now `ENROL_LABEL`
("Enrol now") pointing at `ENROL_HREF` (`/courses`), both in `lib/site.ts`. This was a rewrite,
not a relabel: the hero sub-copy, the home CTA band, the course-detail secondary button, a
contact FAQ, the contact enquiry-subject allow-list, page metadata and several empty states all
*promised* something free, so changing only the button text would have left the promise standing.
The contact `?subject=` alias map now resolves `enrol` / `enroll` / `course`; a stale
`?subject=trial` degrades to the placeholder instead of erroring.

### 2. No em or en dashes in copy
Removed from every user-visible string on the public site, plus the customer-facing email
templates in `lib/email.ts` and the contact endpoint's mail subject and body. Rewritten as
commas or full stops rather than swapped for hyphens.

**Deliberately not changed:** admin UI (`app/admin/**`, `components/admin/**`) still contains
six, including two em-dash "no value" table placeholders. Admin was out of scope for the
redesign. Code comments were also left alone.

### 3. Course images
`lib/course-photo.ts` (new) supplies a fallback photograph keyed on `Course.instrument`, used by
the home featured cards, the courses list and the detail hero. An admin-uploaded `course.image`
always wins. Four of five published courses have `image: null`, so without this almost every card
rendered the empty state.

**Every photo was verified by downloading the file and looking at it.** That mattered: the id
first earmarked for saxophone is a photograph of a **trumpet**, and two of the five courses are
saxophone. It was replaced with a verified saxophonist shot. A trumpet entry was then dropped
entirely because its photographer could not be confirmed and shipping invented attribution is
worse than shipping no photo.

### 4. Delivery formats now come from the backend
- The home "How you learn" section hardcoded **three** formats under invented names
  ("At the studio", "Home training") and omitted `One-on-One` entirely. It now reads the
  `DeliveryMode` table (active, ordered) and renders all four, with the "from" price computed as
  the minimum `course.pricing[mode]` across published courses offering that mode.
- `MODE_NOTES` / `modeNote()` in `components/site/courses/course-data.ts` were invented per-mode
  descriptions. Deleted. Format rows now show the real mode name and its real price only.
- The per-format blurbs and bullet lists asserted specifics no field supports. Deleted.

### 5. Copy replacement
The course Overview rental note is now, verbatim:
> No worries! We offer instrument rental services and starter kits for beginners. Contact our support team to learn more about equipment options.

"support team" links to `/contact`.

### 6. Coverage audit (verified live, per course)

| Course | Tabs rendered | outcomes | equipment | curriculum | faqs | instructor |
| --- | --- | --- | --- | --- | --- | --- |
| `sample-guitar-course` | Overview, Curriculum, Your tutor, FAQs | 6 | 4 | 5 | 3 | John Adebayo |
| `saxophone-beginner` | Overview, Curriculum | 4 | 4 | 12 | 0 | none |
| `saxophone-intermediate` | Overview, Curriculum | 4 | 4 | 12 | 0 | none |
| `violin-beginner` | Overview, Curriculum | 4 | 4 | 12 | 0 | none |
| `violin-intermediate` | Overview, Curriculum | 4 | 4 | 12 | 0 | none |

Reviews and per-course policies have no Prisma model, so no tabs for them. The aside links to
`/policies` instead.

## Instructor roster merge

`origin/banafix` (`63609a2`) was merged in. The live database had been migrated to the roster
shape (`20260902114015_instructor_roster`) while the branch still assumed one instructor per
course, which broke the build. The merge brought the migration, the schema and fixed versions of
`app/api/instructors/route.ts`, the admin instructor route, dashboard stats and `prisma/seed.ts`.
`app/(site)/tutors/page.tsx` and `components/site/tutors/tutor-card.tsx` were ported by hand:
`where: { courses: { some: … } }`, and a tutor's specialties are now the deduped instruments of
every published course they teach. One conflict in `master-checklist.md`, resolved to keep both
modules.

## Enrolment audit — bugs found and fixed

Audited by execution against the live database and a real browser, not by reading.

| # | Bug | Fix |
| --- | --- | --- |
| 1 | **Expired and fully-booked courses were never gated client-side.** You could fill all three steps and only be refused at the Pay button, with the raw server string. | `CourseUnavailable` renders before step 1 for expired, fully booked, and no-delivery-modes |
| 2 | **`dateOfBirth` was never collected by any screen.** The server writes it to `Student.dateOfBirth`, which is the field the birthday-email cron reads, so **every student enrolled through the site had a null birthday and could never receive one** | Added as an optional field; persistence verified |
| 3 | Client trimmed the email, server did not, so a trailing space passed the gate and 400'd | Sends `email.trim()` |
| 4 | Whitespace-only names passed the required gate (`" "` is truthy) | Gate tests trimmed values |
| 5 | Server rejections surfaced as raw sentences with a Try-again that could not help | Six known messages mapped to actionable copy and the right control |
| 6 | Continue button was `aria-disabled` with its reason hidden behind a click | Genuinely operable, reason wired via `aria-describedby` |
| 7 | 6px horizontal overflow at 375px in the step-progress header | `min-w-0` on the flex item; measured 0px after |
| 8 | "Preferred day" labelled a time-of-day select, in a wizard that also has a real preferred-days chip group | Relabelled "Preferred time"; stored values unchanged |

Unsupported commercial claims removed from the wizard: the **VAT (7.5%) line** (nothing in the
codebase configures or charges VAT, and it inflated the displayed total by ₦1,500-2,600), "billed
before classes begin", "any travel fee", payment-channel settlement times, and the guardian
under-18 note. The payment **channel names** were kept and are accurate: `lib/paystack.ts:280`
really does send `['card','bank','ussd','bank_transfer']`.

A full valid submission was exercised end to end and reached Paystack checkout
(`PAYSTACK_SECRET_KEY` is a working `sk_test_` key, not a placeholder). All test rows were
deleted afterwards: 2 students, 2 enrolments, 2 application payments, verified 0 remaining.

## Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Clean, exit 0, whole project |
| `npx next build` | Passes, 38/38 static pages |
| 13 public routes | All 200 |
| Home formats | All four modes from `DeliveryMode` with real prices |
| Course images | Violin and saxophone fallbacks confirmed in the served HTML |
| "free trial" in live code | Zero. Three dead files still contain it, all with **0 importers** |
| Dashes outside comments | Zero on the public site; 6 remain in admin UI, deliberately |

## Follow-ups from round 2

1. **Home Training address is silently discarded for returning students.** In
   `app/api/enrollments/route.ts` the student upsert is `update: {}` and `Enrollment.create` does
   not write `address`/`landmark`, so a returning student passes a hard client gate and the tutor
   gets no address. Proven live. Fix: write `address`, `landmark` and the guardian fields onto the
   `Enrollment` so per-enrolment details stop fighting the student record.
2. **The policy dialog contradicts the code** — it offers PayPal (no integration) and an
   instalment plan the `installmentPlan` field never actions. Left untouched: this is text a
   student legally consents to, and rewriting it unilaterally is worse than leaving it. Needs a
   decision.
3. **`billingAddress` / `billingCity` / `billingState`** are written to every `ApplicationPayment`
   as empty strings. Either drop them server-side or collect them.
4. **Dead code**: `components/sections/*`, `components/enrollment/*`,
   `components/contact/faq-section.tsx`, `components/instructors/*` are all unreferenced. Three of
   them still contain "free trial" copy. One deletion commit would remove the phrase from the repo
   entirely.
5. **An agent edited `prisma/schema.prisma` despite it being declared frozen**, to unblock its own
   type-checking after finding the checked-out schema did not match the live database. The merge
   superseded the edit and nothing of it survives, but the process failure is worth noting.
6. Visual QA in a browser at 375px and 1280px is still outstanding for the pages the enrolment
   audit did not cover.
