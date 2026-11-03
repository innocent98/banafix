# Stream 7 — Communications Implementation Plan (and session ledger)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** A channel-agnostic outbox with editable templates, event triggers, announcements and feedback, per the spec.

**Architecture:** Pure logic in `lib/messaging/*` (unit-tested). A thin DB layer (`outbox.ts`) enqueues with unique idempotency keys and drains through `ChannelProvider` adapters. Enrollment events are emitted from `transitionEnrollment` inside the status transaction; cron routes cover birthdays, new-month and the drain.

**Tech Stack:** Next.js 15 route handlers, Prisma/Postgres, Resend, Vitest, `after()` from `next/server`.

**Spec:** `docs/superpowers/specs/2026-11-03-communications-design.md` (decisions D10…, builder calls C1–C15).

## Global Constraints
- Branch `feature/communications-outbox` (never `claude/…`); PR base `feature/assessment-first-admission`; never merge.
- No AI attribution in commits or the PR body (no Co-Authored-By, no session link, no generated-with footer).
- `.env` points at PRODUCTION: never migrate/seed/test against it. Scratch Postgres on port 5490 only. Install with `npm install --ignore-scripts`.
- No secret-shaped strings in files. Amounts whole naira. Every admin mutation writes `AuditLog` via `lib/audit.ts`.
- Webhook route is **not modified** (if that changes, request an Opus review).
- Fast local checks before every push: `npx tsc --noEmit`, `npx next build`, `npm test`. ESLint is known broken.
- Other sessions edit `components/admin/admin-layout.tsx` and `prisma/schema.prisma`: keep hunks tiny and appended.

## Review Focus (inputs the spec implies but no happy-path test would hit)
1. Recipient with no phone on SMS/WhatsApp → `skipped` row "no phone number", never a crash or a send to `undefined`.
2. Template body containing HTML/`<script>` or a merge value containing `<` → escaped in the email HTML.
3. Webhook replay / two concurrent admin clicks → exactly one enqueue (only the CAS winner emits).
4. Cron run twice on the same day / the 1st month rolling at Lagos midnight vs UTC → no duplicate, correct month key.
5. A crashed drain leaves a row locked → lease expires and it is picked up again; a `sent` row is never re-sent.

## File map
| File | Responsibility |
|---|---|
| `lib/messaging/types.ts` | `Channel`, `Category`, `EventKey`, `ProviderResult`, row shapes |
| `lib/messaging/events.ts` | event registry: label, category, default channels, merge fields |
| `lib/messaging/template.ts` | field extraction, validation, text render, email HTML shell, SMS segments |
| `lib/messaging/default-templates.ts` | default subject/body/shortBody per event key |
| `lib/messaging/idempotency.ts` | key builders |
| `lib/messaging/consent.ts` | `canReceive`, student/parent consent resolution |
| `lib/messaging/recipients.ts` | enrollment recipients (student + guardian) |
| `lib/messaging/audience.ts` | announcement audience filter → recipients |
| `lib/messaging/month.ts` | Lagos month info, next month start |
| `lib/messaging/providers/*` | interface, Resend, SMS/WhatsApp stubs, fake, registry |
| `lib/messaging/outbox.ts` | `enqueue`, `drainOutbox`, `retryMessages`, `outboxCounts` |
| `lib/messaging/enrollment-events.ts` | `emitEnrollmentEvent` |
| `lib/messaging/runs.ts` | `runBirthdays`, `runNewMonth` (cron cores) |
| `lib/feedback.ts`, `lib/feedback-promotion.ts` | validation, testimonial promotion (isolated) |
| `lib/cron-auth.ts`, `lib/throttle.ts` | shared cron guard, in-memory throttle |
| `app/api/cron/{messages,new-month}/route.ts`, `…/birthdays/route.ts` | crons |
| `app/api/admin/{messages,templates,announcements,feedback}/…`, `app/api/feedback/route.ts` | APIs |
| `app/admin/{messages,templates,announcements,feedback}/page.tsx`, `app/(site)/feedback/page.tsx` | UI |

## Tasks

### Task 1: Pure logic (TDD)
**Files:** create `lib/messaging/{types,events,template,default-templates,idempotency,consent,recipients,month}.ts` and a `*.test.ts` beside each.
**Interfaces — Produces:**
- `renderTemplate(src: string, vars: Record<string,string|number|undefined>): string`; `renderEmailHtml(input:{subject:string; body:string; category:Category; supportEmail:string}): string`
- `extractFields(src: string): string[]`; `validateTemplate(key: EventKey, t:{subject:string; body:string; shortBody?:string|null}): {ok:true}|{ok:false; unknown:string[]}`
- `smsSegments(text: string): {encoding:'GSM'|'UNICODE'; length:number; segments:number}`
- `idempotencyKey(scope: string, channel: Channel, recipientType: string, recipientId: string): string`; scope builders `enrollmentScope(id, event, discriminator?)`, `birthdayScope(year)`, `monthScope(year, month)`, `announcementScope(id)`, `feedbackScope(id)`
- `canReceive(category: Category, consent: boolean[], operational?: boolean): {ok:true}|{ok:false; reason:string}`
- `enrollmentRecipients(e:{studentName…}): Recipient[]` (student + distinct guardian)
- `lagosMonthInfo(now: Date): {year:number; month:number; monthName:string; key:string}`; `nextMonthStart(now: Date): Date`
- [ ] Step 1: write failing tests: unknown field rejected naming the field; `{{ firstName }}` with spaces accepted; missing var renders empty; HTML in a merge value escaped in `renderEmailHtml` and left raw in text; `<script>` in a template body escaped; blank line makes a paragraph; 160-char GSM = 1 segment, 161 = 2, a 70-char emoji text = 1 UNICODE segment, 71 = 2; keys are stable and differ by channel/recipient/year/slot; marketing with `[]` or `[false]` blocked with a reason, `[false,true]` allowed, transactional always allowed, `operational` overrides marketing; guardian dropped when same address as student; `lagosMonthInfo(2026-11-30T23:30Z)` is December 2026 (Lagos is UTC+1), key `2026-12`; `nextMonthStart` of a December date is 1 Jan next year 00:00 Lagos.
- [ ] Step 2: run `npx vitest run lib/messaging` → FAIL.
- [ ] Step 3: implement; registry holds the per-event allowed merge fields (`firstName, lastName, fullName, courseTitle, locationName, assessmentDate, assessmentTime, assessmentArrangement, planSummary, monthName, year, academyName, supportEmail, siteUrl, feedbackUrl, feedbackEmail` as relevant).
- [ ] Step 4: run → PASS. Commit `feat(messaging): template rendering, keys, consent, month helpers`.

### Task 2: Schema, migration, providers, outbox (TDD for providers/outbox with injected fakes)
**Files:** modify `prisma/schema.prisma` (append models); create migration; create `lib/messaging/providers/*`, `outbox.ts`; test `lib/messaging/providers/providers.test.ts`.
**Interfaces — Produces:** `getProvider(channel): ChannelProvider`, `setProvidersForTest(p: Partial<Record<Channel, ChannelProvider>> | null)`; `enqueueMessages(db, rows: NewMessage[]): Promise<{created:number}>` (createMany skipDuplicates; rows with unknown address are written `skipped`); `drainOutbox(opts?:{limit?:number; budgetMs?:number; ids?:string[]}): Promise<{sent:number; failed:number; skipped:number; remaining:number}>`; `retryMessages(ids?: string[]): Promise<number>`; `outboxCounts(): Promise<Record<Status,number>>`; `scheduleDrainAfterResponse(): void` (try `after()`, swallow outside request scope).
- [ ] Step 1: failing tests: unconfigured SMS/WhatsApp return `{status:'skipped', reason:'SMS provider not configured'}` (reason names `SMS_PROVIDER` value if set but no adapter); the Resend adapter with no key is `isConfigured()===false`; `MESSAGING_EMAIL_PROVIDER=fake` ignored when `NODE_ENV==='production'`.
- [ ] Step 2: schema + migration (`prisma migrate dev --create-only` against scratch 5490, then apply and diff check); additive only.
- [ ] Step 3: implement providers and outbox; claim = `updateMany where {id, status in (queued, failed<3), lockedAt null or older than 5 min}` then send then update; failed rows retry up to 3 attempts, 10 min apart.
- [ ] Step 4: integration script `scripts/test-messaging.ts` (scratch DB, fake adapter) asserting: duplicate enqueue creates one row; stub channels end `skipped`; fake failure → `failed`, retry → `sent`; a stale lock is reclaimed; a `sent` row is not re-sent. Run → PASS. Commit.

### Task 3: Triggers
**Files:** create `lib/messaging/enrollment-events.ts`, `runs.ts`, `lib/cron-auth.ts`, cron routes; modify `lib/enrollment-transition.ts` (emit on a won CAS), `app/api/enrollments/route.ts` (replace direct ack), `app/api/admin/enrollments/[id]/assessment/route.ts` (reschedule emit only), `lib/birthdays.ts` (also exclude via outbox), `app/api/cron/birthdays/route.ts`, `vercel.json`.
**Interfaces — Consumes:** Task 1 and 2. **Produces:** `emitEnrollmentEvent(tx, enrollmentId, event: EnrollmentEvent): Promise<number>`; `runBirthdays(now?: Date)`, `runNewMonth(now?: Date)` returning counts.
- [ ] Step 1: extend `scripts/test-messaging.ts`: transition `pending→assessment_paid` twice → one set of rows; `assessment_scheduled` reschedule to a new slot → new rows, same slot → none; `enrolled` also writes a `feedback_request` with `scheduledFor` ≈ +30d; birthday run twice → student + parent once; non-consenting student/parent → `skipped` with reason; new-month run twice → once; legacy `BirthdayEmailLog` row for the year → excluded.
- [ ] Step 2: implement. `transitionEnrollment` calls the emitter only when `tx` exposes the delegates (unit test fakes do not) and never throws render errors into the tx.
- [ ] Step 3: run script + `npm test` → PASS. Commit.

### Task 4: Feedback
**Files:** schema (Task 2), `lib/feedback.ts`, `lib/feedback-promotion.ts`, `lib/throttle.ts`, `app/api/feedback/route.ts`, `app/(site)/feedback/page.tsx`, `app/api/admin/feedback/**`; tests for validation and mapping.
**Interfaces — Produces:** `validateFeedback(input: unknown): {ok:true; value:FeedbackInput}|{ok:false; errors:Record<string,string>}`; `toTestimonialInput(f: Feedback): {name; role|null; quote; permissionToPublish:true; isPublished:false}` (throws unless `allowTestimonial`); `createTestimonial(input)` (isolated stub with TODO until PR #11).
- [ ] Step 1: failing tests: empty text rejected; rating 0 or 6 rejected; honeypot field name constant; `toTestimonialInput` refuses without consent, always unpublished.
- [ ] Step 2: implement, admin notice goes through the outbox to `FEEDBACK_EMAIL` (fallback `ADMIN_EMAIL`). Commit.

### Task 5: Admin APIs and UI
**Files:** the API and page files in the map; nav hunk. **Delegate** the four pages to Sonnet subagents after the APIs exist (≤2 at once), each given the spec, the locations page pattern and the API shapes.
- [ ] Step 1: APIs (`withAuth`, audited): list/filter/retry/dispatch messages; templates list/get/put/reset/preview; announcements list/preview-count/create; feedback list/create/patch/promote.
- [ ] Step 2: pages; tiny nav hunk. Step 3: `tsc` + build. Commit.

### Task 6: Verify (see spec). Step 1: migration + `scripts/test-messaging.ts`. Step 2: browser at 1280 and 375. Step 3: `tsc`, `next build`, `npm test`.
### Task 7: Docs: `docs/sop/communications.md`, update birthday and enrollment-email SOPs, checklist Stream 7, blueprint, `.env.example`; push, open PR (base `feature/assessment-first-admission`).

## Ledger (update as work lands)
| Step | State | Notes |
|---|---|---|
| Research subagent (`docs/research/messaging-providers.md`) | running | Sonnet, background |
| Spec | done | `docs/superpowers/specs/2026-11-03-communications-design.md` |
| Plan | done | this file |
| Task 1–7 | pending | |
