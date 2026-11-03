# Stream 8: Website Content as Admin-Managed Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (single session, native). Steps use checkbox (`- [ ]`) syntax. This file is also the **ledger**: tick boxes and append to "Log" as work lands.

**Goal:** Replace the hardcoded testimonials, trusted-by logos, events and hero statistics with four admin-managed Prisma models, rendered honestly (empty data = empty state or omitted section, never placeholder content).

**Architecture:** Four additive tables, a JWT `withAuth` CRUD route pair + one admin page per type (copying `/admin/instructors`), pure rules (publish-permission guard, upcoming filter, Lagos datetime parse) in `lib/site-content.ts` with unit tests, and public server components that read Prisma directly (like the home page already does).

**Tech Stack:** Next.js 15.2 App Router, Prisma 6 / Postgres, Vercel Blob uploader (existing), Vitest (from S1's branch), `bfx-*` design tokens.

**Spec:** the task brief from the lead session + `docs/checklist/master-checklist.md` Stream 8 (D11).

## Global Constraints

- Branch pushed to exactly `feature/site-content-admin`; never `claude/` or AI-named. PR against `banafix`, never merged by me.
- No AI attribution in commits or PR body (no Co-Authored-By, no session link, no "Generated with" footer).
- No em/en dashes in public copy.
- Do not edit copy outside: home hero/stat files, trusted-by, home testimonials, `/testimonials`, `/events`, their data files. Per-class/12-module copy is S1's; offerings/locations/pricing/assessment/enrolment/emails are S2+3's.
- `.env` points at PRODUCTION. Never migrate/seed/test against it. Ephemeral Postgres on port **5457** only. **`npm install` runs `postinstall: prisma migrate deploy`: install with `--ignore-scripts`, then `npx prisma generate`.**
- Fast checks before every push: `npx tsc --noEmit`, `npx next build`, tests for touched logic. ESLint is known broken.
- Admin nav hunk stays tiny (another session adds nav items too).
- No invented content anywhere. No new claims.

## Review Focus

- Testimonial with `permissionToPublish=false` sent `isPublished=true` on create or PATCH: server returns 400, row unchanged.
- Permission later revoked on a published testimonial: it must be unpublished in the same write (consent withdrawn), audited.
- Event whose `startsAt` is earlier today / exactly now / yesterday: only `startsAt >= now` shows; admin datetime input is Lagos time (UTC+1), not the server's zone.
- `registrationUrl` / partner `linkUrl` / `videoUrl` that is not `http(s)`: rejected (no `javascript:` hrefs on the public site).
- All four tables empty: home renders with no stats strip, no trusted-by band, no testimonials section; `/testimonials` and `/events` show an honest empty state.

## File Structure

| File | Responsibility |
|---|---|
| `prisma/schema.prisma` + `prisma/migrations/<ts>_site_content/migration.sql` | 4 models, additive |
| `lib/site-content.ts` | Pure rules: `testimonialPublishError`, `normalizeHttpUrl`, `parseLagosLocal`, `upcomingEvents`, input parsers |
| `tests/site-content.test.ts` | Unit tests for the above |
| `lib/site-content-queries.ts` | Server-only public reads (published only, ordered) |
| `app/api/admin/{testimonials,trusted-partners,site-events,site-stats}/route.ts` + `[id]/route.ts` | CRUD, audit |
| `app/admin/{testimonials,partners,events,stats}/page.tsx` | Admin UI (table + dialog form) |
| `components/admin/admin-layout.tsx` | 4 nav entries |
| `components/site/home/{home-hero,trusted-by,testimonials}.tsx`, `app/(site)/page.tsx` | Home reads DB |
| `app/(site)/testimonials/page.tsx`, `components/site/testimonials/testimonial-wall.tsx` | Plain grid from DB (filters/ratings dropped: no real data behind them) |
| `app/(site)/events/page.tsx` | Upcoming events from DB |
| DELETE `components/site/testimonials/testimonials.ts`, `components/site/events/events.ts` | hardcoded constants |
| `docs/sop/site-content-admin.md`, master checklist, blueprint | docs |

---

### Task 1: Models + migration

**Interfaces:** Produces Prisma models `Testimonial`, `TrustedPartner`, `SiteEvent`, `SiteStat` (tables `testimonials`, `trusted_partners`, `site_events`, `site_stats`).
- `Testimonial`: id cuid, name, role?, quote, videoUrl?, permissionToPublish bool default false, isPublished bool default false, order int default 0, createdAt, updatedAt
- `TrustedPartner`: id, name, logoUrl?, linkUrl?, isPublished default false, order default 0, timestamps
- `SiteEvent`: id, title, description, startsAt DateTime, location, registrationUrl?, isPublished default false, timestamps
- `SiteStat`: id, label, value String, note?, isPublished default false, order default 0, timestamps
- Everything defaults to **unpublished**, so nothing goes live by accident.

- [ ] Start ephemeral Postgres on 5457; `prisma migrate deploy` existing migrations there
- [ ] Add models; `prisma migrate dev --create-only --name site_content`; inspect SQL is only `CREATE TABLE`/index
- [ ] Apply on ephemeral DB; `npx prisma generate`
- [ ] Commit `feat(db): site content models`

### Task 2: Pure rules (TDD)

**Interfaces (all in `lib/site-content.ts`):**
- `testimonialPublishError(t: {permissionToPublish: boolean; isPublished: boolean}): string | null` returns `"Permission to publish is required before a testimonial can go live"` when published without permission
- `normalizeHttpUrl(v: unknown): string | null | "invalid"` (empty/undefined → null; http/https only → trimmed string; else `"invalid"`)
- `parseLagosLocal(v: string): Date | null` (`"2026-12-05T14:00"` as Africa/Lagos = UTC+1 → `2026-12-05T13:00:00Z`; garbage → null)
- `upcomingEvents<T extends {startsAt: Date}>(events: T[], now?: Date): T[]` keeps `startsAt >= now`, soonest first

- [ ] Get Vitest: `git cherry-pick` S1's Vitest-setup commit from `feature/per-class-copy-and-modules`; do not invent config
- [ ] Failing tests: guard (published+no permission → error; published+permission → null; unpublished+no permission → null), URL (`javascript:alert(1)` → invalid, `https://x.com` ok, `""` → null), Lagos parse, upcoming (yesterday dropped, exactly now kept, order ascending)
- [ ] Implement; tests pass; commit

### Task 3: Admin API (4 resources)

**Interfaces:** each `route.ts`: `GET` list (all rows, admin sees unpublished), `POST` create; `[id]/route.ts`: `GET`, `PATCH`, `DELETE`. Responses `{ testimonials }` / `{ testimonial }` etc., errors `{ error }`. Audit actions `<entity>.create|update|delete|publish|unpublish` via `logAdminAction` (entityType `testimonial|trusted_partner|site_event|site_stat`).
- Testimonial create/PATCH merges onto existing, runs `testimonialPublishError`, 400 on failure; revoking `permissionToPublish` forces `isPublished=false` (audit metadata notes it).
- Required fields: testimonial name+quote; partner name; event title+description+startsAt+location; stat label+value. URLs through `normalizeHttpUrl`; 400 `"<field> must be an http(s) link"`.

- [ ] Implement testimonials routes, then partners, events, stats
- [ ] Exercise each with `curl` against dev server on ephemeral DB (needs a seeded admin on the scratch DB only)

### Task 4: Admin UI + nav

- [ ] Shared `components/admin/use-admin-api.ts` hook (token, 401 → `/admin/login`) to avoid four copies of fetch boilerplate
- [ ] Four pages (table, publish `Switch`, add/edit dialog, delete confirm); testimonial form has permission checkbox, publish switch disabled until permission ticked; partner form uses `ImageUpload` for logo; event form uses `datetime-local` labelled "Lagos time"
- [ ] 4 nav entries inserted above the commented `faqs` block (not next to `settings`) to minimise merge conflict
- [ ] Commit

### Task 5: Public site from DB

**Interfaces:** `lib/site-content-queries.ts`: `getPublishedStats()`, `getPublishedPartners()`, `getPublishedTestimonials()`, `getUpcomingEvents()`; all published-only.
- [ ] Hero: stats row from `getPublishedStats()` (omitted if none); remove the alumni count from the pill (replace with "Music academy in Lekki, Lagos", backed by the address in `lib/site.ts`); remove the hard-coded "4.9 / 5 from 412 student reviews" card (no review data exists)
- [ ] `TrustedBy` renders logos (or name text) from DB, returns `null` if none; `Testimonials` (home) returns `null` if none; both take props from `page.tsx`
- [ ] `/testimonials`: plain grid + honest empty state; keep "share yours" block
- [ ] `/events`: upcoming only, `force-dynamic`; drop category/host/price/image fields the model does not have
- [ ] Delete `testimonials.ts`, `events.ts`; grep that no references remain
- [ ] Commit

### Task 6: Verify

- [ ] `npx tsc --noEmit`, `npx next build`, unit tests
- [ ] Dev server on ephemeral DB: create/publish/unpublish each type; permission guard error; revoke-permission unpublishes; past event hidden; bad URL rejected; empty states
- [ ] Browser check home, /testimonials, /events at 375 and 1280, empty then populated
- [ ] Delete all test rows / tear down ephemeral DB

### Task 7: Docs + PR

- [ ] `docs/sop/site-content-admin.md`; tick Stream 8 in master checklist; blueprint drift note; noindex recommendation in report
- [ ] `git branch -m feature/site-content-admin`; push `HEAD:feature/site-content-admin`; open PR vs `banafix`; check head name and no attribution

## Log

- 2026-11-03: plan written. Worktree has no `node_modules`; installing with `--ignore-scripts` (postinstall would run `migrate deploy` against prod via `.env`). S1's Vitest commit not yet present on its branch when plan was written.
