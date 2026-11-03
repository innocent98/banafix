# SOP — Per-class copy, 12-module curriculum, Vitest (Stream 1)

## What shipped
Three independent quick wins from the 2026-11-03 client meeting (master checklist, Stream 1):
1. **Vitest** test runner (`npm test`).
2. **Copy** rewritten so nothing claims monthly billing or "twelve-week programmes".
3. **`CurriculumModule.weeks` is optional** end to end (DB, admin forms, admin APIs, public render);
   `parseWeeks` and the per-lesson caption are gone.

Branch `feature/per-class-copy-and-modules` (off `banafix` @ 6e96f9c). PR: see the checklist entry.

## Why
The client's model is **tuition per class** and **courses of 12 modules** (not 12 weeks). The site still
said "from ₦X / month", "Four sessions a month", "Twelve-week programmes", and the admin forms forced a
"weeks" string on every module. The repo also had no test runner, which Streams 2+ need for pure logic.

## How (key decisions)
- **Vitest first, own commit**, so sibling sessions can cherry-pick it. `vitest.config.ts` mirrors the
  tsconfig `@/*` alias; tests are `**/*.test.ts` (node environment, no DOM yet).
- **Admissions cost section: tiers deleted, not reworded.** The three per-month tiers were invented
  indicative numbers that contradicted real course data. The section is now a single "Priced per class"
  card with a link to `/courses`. No figures appear (per-class price display is Stream 2). The
  `₦5,000` registration line and "sibling discounts / split payments" claim went with the tiers.
- **No new facts.** Wording is "per class" / neutral only. Existing unverified claims (see Follow-ups)
  were left alone, not added to.
- **Timeframe stays a free-text optional label** ("Weeks 1-2", "Month 1"), relabelled
  "Timeframe (optional)". Blank is stored as `null` via `normalizeWeeks()` (`lib/course-utils.ts`), so
  the public page omits the label instead of rendering an empty one.
- **12 modules is a convention, not a constraint**: a hint on the admin Curriculum tab; nothing enforces it.
- **Curriculum heading** on `/courses/[id]` is now just "N modules" (was "`{duration}`, N modules"),
  and the timeframe column is dropped entirely when no module has one.
- Rejected: making `weeks` an integer or deriving it from module order. Free text keeps John's
  existing "Weeks 1-2" rows valid and lets him use any scheme.

## What's involved
| Area | Files |
| --- | --- |
| Test runner | `vitest.config.ts`, `package.json` (`test` script, devDependency), `lib/utils.test.ts`, `lib/course-utils.test.ts` |
| Copy | `app/(site)/admissions/page.tsx`, `components/site/home/why-banafix.tsx`, `components/site/contact/contact-faq.tsx`, `app/(site)/courses/page.tsx` (comment), `components/site/primitives.tsx` (comment) |
| Schema | `prisma/schema.prisma` (`CurriculumModule.weeks String?`), migration `20261103130000_curriculum_weeks_optional` (`ALTER TABLE "curriculum_modules" ALTER COLUMN "weeks" DROP NOT NULL`) |
| Admin API | `app/api/admin/courses/[id]/curriculum/route.ts` (POST needs only `title`), `.../[moduleId]/route.ts` (PUT; `weeks: ""` becomes null) |
| Admin UI | `app/admin/courses/create/page.tsx`, `app/admin/courses/[id]/edit/page.tsx` (validation, label, 12-module hint, hide empty timeframe) |
| Public | `components/site/courses/course-panels.tsx` (null-tolerant, no `duration` prop), `components/site/courses/enrol-aside.tsx` + `app/(site)/courses/[id]/page.tsx` (per-lesson caption and `weeks` prop removed), `components/site/courses/course-data.ts` (`parseWeeks` deleted). `GET /api/courses/[id]` already passes `weeks` through, so it now returns `null` when unset. |

## Verification
- Migration on an **ephemeral Postgres 17** (all prior migrations applied, then this one): a module with
  `weeks = 'Weeks 1-2'` survives untouched; inserting a module with `weeks = NULL` succeeds after, column
  `is_nullable = YES` (was `NO`).
- `npx tsc --noEmit`, `npx next build`, `npm test` (see PR for results). Unit tests: `normalizeWeeks`
  (trim, blank to null, non-string to null) and a `cn` smoke test proving the alias.
- **Not verified live:** the admin forms and the public curriculum render in a browser against a real
  database (no safe database here; `.env` is production). Covered by types, build and the migration test.

## Operate / roll back
- Deploy: `prisma migrate deploy` applies the one-line migration (instant, no rewrite, no data change).
- Roll back the DB only if **no module has a null timeframe**: `ALTER TABLE "curriculum_modules" ALTER COLUMN "weeks" SET NOT NULL;`
  (fails if nulls exist; backfill first). Code rollback is a plain revert; old code would break on null rows.

## Follow-ups
- **Legal text for John to review (not edited):** `policy-dialog.tsx` / `policies.ts` still describe the
  fee as an application/registration fee and mention PayPal and instalments; the refund tiers use
  "weeks" and "sessions attended" (a per-class model may need different wording).
- **Still on the site, owned by other streams:** `Course.duration` ("12 weeks") shows on course cards,
  the course header chip, the enrol summary and "Total for {duration}" in `enrol-aside.tsx` (Stream 2,
  price/duration display); admin placeholder "e.g., 12 weeks" for the course duration field; seed data
  `duration: '12 weeks'`; the `₦5,000 registration` line in `contact-faq.tsx` (the real fee varies by
  location and is renamed in Stream 3).
- **Marketing claims:** confirmed true by Adebayo 2026-11-03: "termly recital" (and the termly-recital line on
  the events page) and "Since 2016". Still unconfirmed, left untouched: "written feedback after every fourth
  lesson", "rentals are ₦8,000 a term", "one free makeup lesson each term".
- **Pre-existing bug, fixed 2026-11-03:** `POST /api/admin/courses` ignored the `curriculum` (and `faqs`) arrays sent by
  the create form, so modules and FAQs entered at create time were never saved. The handler now nested-creates
  both with the course (`buildCurriculumRows` / `buildFaqRows` in `lib/course-utils.ts`: untitled modules and
  incomplete FAQs dropped, survivors numbered from 1, blank timeframe stored as null). Proven against a scratch
  Postgres (modules `[1,1,M1,null],[2,2,M2,null]`, FAQ filtered, cascade delete leaves no rows) plus 5 unit tests.
