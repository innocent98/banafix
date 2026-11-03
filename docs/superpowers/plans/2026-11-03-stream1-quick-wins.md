# Stream 1 Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. **This file is the Stream 1 ledger**: tick boxes and append to "Ledger" as work lands.

**Goal:** Land the three independent quick wins of the assessment-first rework: a Vitest runner, per-class / 12-module copy, and an optional `CurriculumModule.weeks`.

**Architecture:** Three small, independent commits on one branch, Vitest first so sibling sessions can cherry-pick it. Copy edits are text-only. The `weeks` change is an additive Prisma migration (`weeks` becomes nullable) plus tolerating null in admin forms, admin/public APIs and the public render; `parseWeeks` and its per-lesson caption are deleted.

**Tech Stack:** Next.js 15, Prisma 6 / Postgres, Tailwind, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-03-assessment-first-admission-design.md` (Stream 1 line in `docs/checklist/master-checklist.md`).

## Global Constraints

- Branch: push to exactly `feature/per-class-copy-and-modules` (`git push -u origin HEAD:feature/per-class-copy-and-modules`). Never `claude/` or AI-named.
- Commits and PR body carry NO AI attribution (no `Co-Authored-By`, session link, "Generated with" footer). Never merge the PR.
- No em/en dashes in public copy. Never invent facts (no new stats/claims).
- Do NOT edit `components/site/enroll/policy-dialog.tsx` or `components/site/policies/policies.ts`; list contradictions in the report.
- Do not touch offerings/locations/pricing/assessment/enrollment status (S2+3) or testimonials/trusted-by/events/site stats (S8). Keep edits to admin course pages minimal.
- Ignore the unreferenced dirs `components/sections/` and `components/enrollment/`.
- `.env` is PRODUCTION. Never run migrate/seed/tests against it. Install with `--ignore-scripts` (postinstall runs `prisma migrate deploy`). Migration checks only on an ephemeral Postgres (`initdb`, `LC_ALL=C pg_ctl ... -p 5455`).
- Fast checks before each push: `npx tsc --noEmit`, `npx next build`, `npm test`. ESLint is known broken.

## Review Focus

- A course whose modules all have `weeks = null`: public `/courses/[id]` curriculum and `/api/courses/[id]` must render and return without a blank or "null" timeframe.
- Admin create flow with modules that have no timeframe: step validation must let the wizard proceed and the API must accept the module.
- Admin PATCH of a module with `weeks: ""`: must store null, not an empty string.
- Existing rows with `weeks = "Weeks 1-2"`: migration is additive and leaves them untouched.
- `/courses/[id]` for a course whose `duration` is not "N weeks": no per-lesson caption, no crash after `parseWeeks` removal.

---

### Task 1: Vitest runner (first commit, push immediately)

**Files:**
- Create: `vitest.config.ts`, `lib/utils.test.ts` (tiny proof test against an existing pure helper)
- Modify: `package.json` (`vitest` devDependency, `"test": "vitest run"`), `package-lock.json`

**Interfaces:** Produces `npm test`; alias `@/*` resolves to repo root like `tsconfig.json`.

- [x] **Step 1:** Install `vitest` as a devDependency with `npm install -D vitest --ignore-scripts`.
- [x] **Step 2:** `vitest.config.ts`: `defineConfig` with `resolve.alias { "@": repo root }`, `test.environment: "node"`, `test.include: ["**/*.test.ts"]`, exclude `node_modules` and `.next`.
- [x] **Step 3:** Write a passing test importing from `@/lib/...` (proves the alias) and asserting a known pure output.
- [x] **Step 4:** Run `npm test`; expect 1 passed. `npx tsc --noEmit` clean.
- [x] **Step 5:** Commit `chore: add vitest test runner`, push to `feature/per-class-copy-and-modules`, tell lead the SHA.

### Task 2: Per-class and 12-module copy

**Files:**
- Modify: `app/(site)/admissions/page.tsx` (delete `TUITION` const and the "What it costs" tiers section; replace with a short pointer section to `/courses`; fix header comment, metadata description "what lessons cost" stays neutral), `components/site/home/why-banafix.tsx:21`, `app/(site)/courses/page.tsx:93` (comment only, heading "Structured programmes" is fine), `components/site/contact/contact-faq.tsx:40` (billing answer), `components/site/faqs/faqs.ts` (payments category if monthly wording exists; none found, verify), `components/site/courses/enrol-aside.tsx` (the "Total for 12 weeks" comment), `components/site/courses/course-panels.tsx:110` (comment), `components/site/primitives.tsx:161` (comment, example chip text only).
- Rules: where no number is shown say "per class" or stay neutral; do not restate fees as per month; leave the `₦5,000 registration` wording alone (S3 owns the assessment-fee relabel).

- [x] **Step 1:** Re-run `grep -rniE "per month|/month|monthly|a month|twelve.week|12.week|per term|a term"` over `app components lib` excluding the two dead dirs and the two legal files; this list is the work list. Record every hit and its disposition in the Ledger.
- [x] **Step 2:** Apply the edits above; expected copy: why-banafix reason 02 describes "a 12-module programme" (modules, not weeks) and drops the invented "termly recital" / "every fourth lesson" claims only if they are not otherwise established (see Ledger for decision); admissions cost section says prices are per class and set per course and location, with a "See courses and prices" link to `/courses`.
- [x] **Step 3:** Re-grep: zero remaining monthly / twelve-week hits in public copy. No `—` or `–` in changed strings (`grep -nP "[\x{2013}\x{2014}]"` on changed files, public strings only).
- [x] **Step 4:** `npx tsc --noEmit`; commit `copy: per-class and 12-module wording, remove monthly tiers`.

### Task 3: `CurriculumModule.weeks` optional

**Files:**
- Modify: `prisma/schema.prisma:116` (`weeks String?`), `app/admin/courses/create/page.tsx`, `app/admin/courses/[id]/edit/page.tsx`, `app/api/admin/courses/[id]/curriculum/route.ts`, `app/api/admin/courses/[id]/curriculum/[moduleId]/route.ts`, `app/api/courses/[id]/route.ts:72`, `components/site/courses/course-panels.tsx` (curriculum item `weeks: string | null`), `app/(site)/courses/[id]/page.tsx:23,192`, `components/site/courses/enrol-aside.tsx` (drop `weeks` prop and per-lesson caption), `components/site/courses/course-data.ts` (delete `parseWeeks`), `prisma/seed.ts` (unchanged data is still valid).
- Create: `prisma/migrations/<ts>_curriculum_weeks_optional/migration.sql` containing `ALTER TABLE "CurriculumModule" ALTER COLUMN "weeks" DROP NOT NULL;` (confirm real table name from earlier migrations).

**Interfaces:** Module shape on the wire becomes `weeks: string | null`. Admin forms keep a `weeks` field, label "Timeframe (optional)", placeholder e.g. "Weeks 1-2"; empty string is normalised to `null` at the API boundary.

- [x] **Step 1:** Edit schema, add migration SQL by hand (never run against `.env` DB). `npx prisma generate`.
- [x] **Step 2:** API: POST requires only `title`; both routes store `weeks?.trim() || null`. PATCH treats `weeks: ""` as null.
- [x] **Step 3:** Admin create/edit: drop `!weeks` checks (validation messages, step gate at create `:443`, per-module check `:368`), relabel field, show timeframe in the module list only when present, add hint "A course normally has 12 modules (a convention, not a limit)".
- [x] **Step 4:** Public: `course-panels` renders the timeframe only when present; `/api/courses/[id]` returns `weeks` as stored (null allowed); remove `parseWeeks`, `weeks` prop and the "a lesson" caption in `enrol-aside`.
- [x] **Step 5:** Pure-logic test if any helper is introduced (e.g. `normalizeWeeks(input): string | null` in `lib/course-utils.ts`, tests: `"  Weeks 1-2 "` -> `"Weeks 1-2"`, `""` -> `null`, `undefined` -> `null`); use it in both admin routes. Run `npm test`.
- [x] **Step 6:** Verify migration on ephemeral Postgres: apply all migrations, insert a module with weeks, apply the new one, row intact, insert a module with null weeks succeeds. Record output in Ledger.
- [x] **Step 7:** `npx tsc --noEmit`, `npx next build`, `npm test`; commit `feat(courses): make curriculum module timeframe optional`.

### Task 4: Docs and PR

**Files:**
- Create: `docs/sop/per-class-copy-and-modules.md`
- Modify: `docs/checklist/master-checklist.md` (tick Stream 1 items, with commit refs), `docs/architecture/banafix-blueprint.md` (note `weeks` now optional / drift)

- [x] **Step 1:** SOP in house style (see `docs/sop/instructor-roster.md`): What shipped, Why, How, What's involved, Verification, Operate/roll back, Follow-ups (incl. contradictions found in legal text and invented marketing facts).
- [x] **Step 2:** Tick checklist, note blueprint drift.
- [x] **Step 3:** Push; open PR against `banafix` (no attribution, no merge); bind with `bind_pr`; report to lead.

## Ledger

- 2026-11-03 Task 1 `3ce101c`: vitest **^3.2.7** (v5.1 needs @types/node 22+; repo pins 20, npm ERESOLVE). Pushed first; S2+3 told.
- Task 2 `224a92b`: admissions tiers section deleted (replaced by a no-figures "Priced per class" card), why-banafix reason 02, contact-faq billing answer, two comments. faqs.ts had no monthly or 12-week wording, unchanged. Left on purpose: `Course.duration` chips ("12 weeks"), "Total for {duration}" in enrol-aside (S2), admin duration placeholder, seed `duration`, the `₦5,000 registration` line in contact-faq (S3 rename).
- Task 3 `e5e5dd6`: `weeks String?`, migration `20261103130000_curriculum_weeks_optional`, `normalizeWeeks` (3 unit tests), admin POST needs only `title`, admin route is PUT (not PATCH), forms relabelled, hint added, `CurriculumPanel` drops the `duration` prop and hides the timeframe column when no module has one, `parseWeeks` + per-lesson caption removed.
- Verification: ephemeral Postgres 17 (all prior migrations, then new): `Weeks 1-2` row intact, NULL insert OK, `is_nullable` NO to YES. `npx tsc --noEmit` clean, `npm test` 4 passed, `npx next build` OK (dummy env vars + scratch DB; no `.env` exists in this worktree).
- Not verified: browser walk-through of admin forms and `/courses/[id]` with null timeframes; no safe DB to serve them.
- Security hook flagged `@napi-rs/lzma-linux-x64-gnu` in the lockfile: registry shows rollup (>= 4.66.0) itself declares it as an optional linux-x64 dependency, no install scripts, napi-rs maintainer. Acknowledged, no change. Lockfile also moved 3 transitive dev deps (@types/estree, tinyglobby, picomatch).
- Pre-existing bug found, not fixed: `POST /api/admin/courses` ignores the `curriculum` array.
