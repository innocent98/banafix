# SOP: Website content as admin-managed data (Stream 8)

## What shipped
Testimonials, trusted-by partners, events and hero statistics moved from hardcoded constants into four
admin-managed tables with CRUD under `/admin`. The public home page, `/testimonials` and `/events`
render only **published** rows. Empty data means an honest empty state or an omitted section, never
placeholder content. Branch `feature/site-content-admin` (PR against `banafix`).

## Why
John wants real, honest content only (actual figures, genuine testimonials with permission, genuine
partners, upcoming events) and everything commercial configurable from `/admin` (D11). The site shipped
invented content: four partner names, three quotes, a "3,200 alumni" claim, "4.9 / 5 from 412 student
reviews", and a hardcoded events list (previously emptied). None of it had a data source.

## How (key decisions)
| Decision | Why |
|---|---|
| Everything defaults to `isPublished = false` | Nothing goes live by accident. |
| **Consent rule, enforced server-side**: a testimonial cannot be published unless `permissionToPublish` is true; withdrawing permission from a live testimonial unpublishes it in the same write | Consent is a legal/trust matter; the UI mirrors it but is not trusted. The public query also filters `permissionToPublish: true` as defence in depth. |
| Pure rules in `lib/site-content.ts` (guard, URL check, Lagos datetime, upcoming filter, input parsers) with unit tests | Logic is testable without a DB. |
| One handler factory (`lib/site-content-admin.ts`) and one admin manager component (`components/admin/site-content-manager.tsx`) for all four types | Avoids eight near-identical route files and four drifting pages. Each route/page is a few lines of config. |
| Links (`videoUrl`, `linkUrl`, `registrationUrl`, `logoUrl`) must be `http(s)` | No `javascript:` hrefs on the public site. |
| Event time entered as **Lagos time** (UTC+1, no DST), stored as UTC, displayed with `timeZone: "Africa/Lagos"` | Admin and server timezones never matter. |
| Upcoming = `startsAt >= now`; past events are hidden, not deleted | Matches the brief; `/events` is `force-dynamic` so it is correct the moment time passes. |
| Testimonial instrument/level filters, star ratings, course names, event category/host/price/photo dropped | No real data backed them; fewer invented fields. Re-add as real fields if John wants them. |
| `SiteStat.value` is free text; `note` is admin-only (source of the figure) | "120", "3,200+" both work; the note stays internal. |
| Hero: removed "3,200 alumni" and the "4.9 / 5 from 412 student reviews" card; pill now reads "Music academy in Lekki, Lagos" (address is in `lib/site.ts`) | No data backs them. Rating card removal also fixes an invented-review claim. |

Rejected: a single polymorphic `SiteContent` table (loses typed fields and per-type rules); seeding the
old copy as "starter" rows (it is exactly the content John wants gone).

## What's involved
- **Schema/migration:** `prisma/schema.prisma` (models `Testimonial`, `TrustedPartner`, `SiteEvent`, `SiteStat`; tables `testimonials`, `trusted_partners`, `site_events`, `site_stats`); `prisma/migrations/20261103142518_site_content/migration.sql` (additive: 4 `CREATE TABLE` + 4 indexes only).
- **Rules + tests:** `lib/site-content.ts`, `tests/site-content.test.ts` (23 tests).
- **Admin API (JWT `withAuth`):** `app/api/admin/{testimonials,trusted-partners,site-events,site-stats}` (`route.ts` = list/create, `[id]/route.ts` = get/patch/delete) built by `lib/site-content-admin.ts`.
- **Audit:** `<entity>.create|update|delete`, plus `.publish` / `.unpublish` when `isPublished` changes. Entity types `testimonial`, `trusted_partner`, `site_event`, `site_stat`. A consent withdrawal adds `unpublishedForConsent: true` to the update metadata.
- **Admin UI:** `app/admin/{testimonials,partners,events,stats}/page.tsx`, `components/admin/site-content-manager.tsx`; four nav items in `components/admin/admin-layout.tsx`. Partner logo uses the existing `ImageUpload` (Vercel Blob; needs `BLOB_READ_WRITE_TOKEN`).
- **Public:** `lib/site-content-queries.ts`; `app/(site)/page.tsx`, `components/site/home/{home-hero,trusted-by,testimonials}.tsx`, `app/(site)/testimonials/page.tsx`, `app/(site)/events/page.tsx`, new `components/site/testimonials/testimonial-card.tsx`.
- **Deleted:** `components/site/testimonials/testimonials.ts`, `components/site/testimonials/testimonial-wall.tsx`, `components/site/events/events.ts`.

## Verification
- Migration applied on an ephemeral Postgres (port 5457) on top of all existing migrations.
- Live against `next dev` on that DB with a scratch admin: create/publish/unpublish/delete for all four types; publish without permission returns 400 `Permission to publish is required before a testimonial can go live` (create and PATCH); revoking permission auto-unpublishes and the page drops it; `javascript:`/`ftp:` links rejected; bad date rejected; past and draft events hidden; stat `note` not leaked; 401 without a token; all mutations audited.
- Browser: home, `/testimonials`, `/events` empty and populated at 1280px; no horizontal overflow at 375px on all three; admin testimonials list and add dialog (publish switch disabled until permission is on).
- `npx tsc --noEmit` 0 errors, `npx next build` succeeds, 23 unit tests pass (mutation-checked: flipping `>=` and the guard fail tests).
- All test rows, the scratch admin and audit rows deleted. **Not verified:** logo upload through Vercel Blob (no token locally); real Safari/mobile device rendering; the 375px populated screenshots were taken while the page's entry animation was still fading in, so spacing was checked by overflow measurement rather than by eye.

## Operate / roll back
- Deploy: `prisma migrate deploy` (additive). Then John enters content in `/admin/stats`, `/admin/partners`, `/admin/testimonials`, `/admin/events` and flips "Show on the site".
- Until rows exist, the home page shows no stats strip, no trusted-by band and no testimonials section; `/testimonials` and `/events` show empty states.
- Roll back: revert the PR; the four tables are unused by anything else and can be left or dropped.
- Local install gotcha: `npm install` runs `postinstall: prisma migrate deploy`. With a `.env` pointing at production use `npm install --ignore-scripts` then `npx prisma generate`.

## Follow-ups
- Confirm "SINCE 2016" (hero pill, `components/site/site-footer.tsx`, legacy `components/footer.tsx`) and "A Lagos music academy teaching one student at a time since 2016" with John; left untouched (outside this stream's files).
- Legacy unused components still hold unbacked claims (`components/sections/curated-picks.tsx` "1,200+", `enrollment-card.tsx` "Lifetime alumni network access"). They are not imported anywhere; delete or fix in a cleanup.
- Page-level order is manual (`order` field); no drag-and-drop.
- Team review: see the noindex recommendation in the PR description (Vercel previews are already noindex; production-domain review needs a flag).
