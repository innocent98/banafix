# Communications: channel-agnostic outbox, templates, announcements, feedback — design

**Date:** 2026-11-03 · **Status:** approved decisions from the lead (D10 and below), builder calls marked **(builder call)** · **Covers:** Stream 7 of the 2026-11-03 client meeting. Built on PR #12 (`feature/assessment-first-admission`, head `4a45b46`).

## Intent
John wants routine communication to run by itself once students are registered and admitted: birthday wishes
(student and parent), new-month messages, application and assessment acknowledgements, payment and enrolment
notices, announcements, student updates and feedback collection. He asked for WhatsApp and SMS through an
**external provider** (not a hand-built WhatsApp Business integration) and wants **costs on the table before
he commits**. Feedback should arrive outside the website too (a dedicated address) and be reusable as
testimonials with permission. Done means: every event below enqueues exactly one message per recipient and
channel, an admin can see, edit, retry and broadcast from `/admin`, and picking a provider later is an adapter
swap, not a redesign.

## Goals / non-goals
- **Goals:** one outbox every message goes through; email works (Resend); SMS and WhatsApp exist as honest,
  disabled adapters; triggers emitted from one place per concern; templates are admin-editable data (D11);
  consent respected for marketing-type messages; public feedback with testimonial consent; a cost research doc.
- **Non-goals:** a real SMS/WhatsApp integration (adapters stay stubs until John chooses), inbound WhatsApp/SMS
  or inbound email parsing, a student/parent portal, class reminders (Stream 4 emits those later; template keys are
  reserved), tuition receipt internals (Stream 5), moving the webhook's receipt emails (they carry PDFs and stay).
- **Anti-goals (failures even if they "work"):** a stub that pretends to send; a message sent twice on a replayed
  webhook or cron re-run; a marketing message to someone who did not consent; a failed send that crashes the
  transition or webhook it was triggered from; secrets in files; a real email sent from a test.

## Decisions taken (lead, approved by Adebayo)
| ID | Decision |
|---|---|
| D10 | Messaging is a channel-agnostic **outbox**: `MessageTemplate`, `OutboundMessage`, a `ChannelProvider` interface with a working Resend adapter and **disabled** SMS/WhatsApp stubs that record `skipped` ("provider not configured"). Provider settings via env. |
| D10a | Triggers come from **one place per concern**: enrollment status transitions (hooked into the S2+3 transition helper), plus cron for birthdays and new-month. Webhook keeps its receipt emails. |
| D10b | Marketing-type messages (birthday, new-month, announcement, feedback request) respect `Enrollment.consentToEmails`; transactional ones always send. |
| D10c | Admin pages `/admin/messages`, `/admin/templates`, `/admin/announcements`; feedback has a public form, `FEEDBACK_EMAIL`, an admin review page and a promote-to-testimonial action. |
| D11 | Everything editable is data: templates live in the DB (defaults in code), nothing hardcoded in a trigger. |

## Builder calls
| # | Call | Why |
|---|---|---|
| C1 | Templates are **plain text with `{{mergeFields}}`** (blank line = paragraph), rendered into one branded HTML shell for email and used as-is for SMS/WhatsApp. A template also has an optional shorter `shortBody` for SMS/WhatsApp. | Admins cannot break the HTML; SMS segments cost money, so a short variant matters. HTML escaping happens once, in the renderer. |
| C2 | **Defaults live in code** (`lib/messaging/default-templates.ts`); a DB row overrides. Missing row = use the default; the templates page materialises rows on first open; "Reset to default" restores. No data migration. | Reviewable defaults, nothing to seed on deploy, nothing to forget. |
| C3 | Merge fields are **validated on save** against the per-event allow-list; unknown `{{field}}` is rejected with the list of valid ones. Rendering never throws into a trigger: a render failure writes a `failed` row with the reason. | A typo must not silently send "Dear {{firstNmae}}", and a bad template must not abort a status change. |
| C4 | **Idempotency is a unique key on every row** (`idempotencyKey`), shaped `<event-scope>:<channel>:<recipientType>:<recipientId>`; enqueue is `createMany(skipDuplicates)`. Event scopes: `enr:<enrollmentId>:<event>[:<discriminator>]`, `birthday:<year>`, `newmonth:<YYYY-MM>`, `ann:<announcementId>`, `fb:<feedbackId>`. | Replays (webhook retry, cron re-run, double click) cannot double-send; the same mechanism covers every trigger. |
| C5 | Birthday dedup moves to **outbox idempotency** (key includes the year). `BirthdayEmailLog` is kept in the schema and still **read** as an exclusion so a deploy after that morning's run does not re-send; it is no longer written. | Staged-migration precedent; no drop. |
| C6 | Emission happens **inside `transitionEnrollment`** on a won compare-and-set, in the same transaction, via one function `emitEnrollmentEvent(tx, enrollmentId, event)`. Only the CAS winner enqueues, so webhook replay or concurrent admin clicks enqueue once. Sending is **after commit** (`after()` from `next/server`, plus the cron drain, plus an admin "Send now"). | One place, atomic with the status move, no scattered call sites, no network call inside a DB transaction. |
| C7 | Events without a status change use the same emitter: `application_received` (public POST, replaces the direct `sendEnrollmentConfirmation`), and a **reschedule** of an assessment (key carries `assessmentId` + the slot, so a new slot re-notifies, the same slot does not). | The only two non-transition triggers. |
| C8 | Event → message mapping: `assessment_paid` (SMS/WhatsApp slot only; the **webhook's PDF receipt stays the email**), `assessment_scheduled`, `assessed` (neutral "assessment complete, we will contact you about your plan", no result detail), `plan_agreed`, `enrolled` (+ a **delayed `feedback_request`** with `scheduledFor = +30 days`), `cancelled` sends nothing. Plan edits while `plan_agreed` do not re-notify. | Sensible defaults; John can edit text and channels. Delayed rows need no extra cron logic and never touch legacy students. |
| C9 | Transactional recipients: the student, plus the **guardian** (from the enrollment's `guardianEmail`/`guardianPhone`) when present and different. | Under-18 learners' parents pay and schedule. |
| C10 | Consent: a **student** may receive marketing if any of their enrollments has `consentToEmails`. A **parent** may if any linked child does; a parent linked to no one has no consent on record and is **skipped** (visible as `skipped` with the reason, never silent). Announcements have an "Operational notice" toggle that sends regardless of consent (closures, schedule changes). | Existing cron ignored consent; the lead wants it respected. Unlinked parents are an open question for John. |
| C11 | Delivery: a drain claims rows with a `lockedAt` lease (no `sending` status, so no stuck rows), honours a time budget, sends sequentially with a small gap (Resend rate limit), and auto-retries `failed` rows up to 3 attempts. Admin retry resets `failed` **or provider-skipped** rows. | Serverless-safe, bounded, and a provider plugged in later can replay what it skipped. |
| C12 | Cron: `/api/cron/messages` (drain, daily 05:30 UTC), `/api/cron/new-month` (05:00 UTC on the 1st), birthdays (existing). Both content crons also drain at the end. Daily, not hourly: Vercel Hobby rejects sub-daily crons; tighten the drain on Pro. The admin announcements page drains in client-driven chunks so a broadcast does not wait for the next cron. | Plan tier unknown; the design degrades gracefully. |
| C13 | Test/e2e provider override: `MESSAGING_EMAIL_PROVIDER=fake` is honoured **only when `NODE_ENV !== 'production'`**; unit tests inject providers directly. | A fake must be impossible to enable in production. |
| C14 | Announcement audience = `{scope: students|parents|both, locationId?, courseId?, includeApplicants}`; default students are those with a status `enrolled`; with no filter, parents means every parent record. Persisted as an `Announcement` row (history, audit). | Matches the lead's list (all, by location, by course, parents only). |
| C15 | Feedback `source` is `EMAIL|WEB|WHATSAPP|ADMIN`. Inbound email is out of scope: **forwarding works today by an admin adding the entry** (`/admin/feedback` → "Add feedback"). Promote-to-testimonial needs `allowTestimonial` and creates an **unpublished** `Testimonial`; that model lives in PR #11, not in this base, so the create sits behind one isolated function with a TODO. | Consent first; do not recreate Stream 8's model. |

## Data model (names final; see `prisma/schema.prisma`)
- **`MessageTemplate`** `{ key @unique, name, category TRANSACTIONAL|MARKETING, channels String[], subject, body, shortBody?, isActive }`
- **`OutboundMessage`** `{ channel, recipientType, recipientId?, toName?, toAddress?, templateKey, category, subject?, body, html?, status queued|sent|failed|skipped, provider?, providerMessageId?, error?, attempts, idempotencyKey @unique, batchId?, enrollmentId?, scheduledFor?, lockedAt?, lastAttemptAt?, sentAt?, createdAt }`
- **`Announcement`** `{ subject, body, channels, category, audience Json, recipientCount, createdByAdminId?, createdAt }` (messages carry `batchId = announcement.id`)
- **`Feedback`** `{ authorName, relationship?, email?, rating?, text, source, allowTestimonial, status new|reviewed|archived, testimonialId?, createdAt }`
- Additive migration, no drops. `BirthdayEmailLog` stays.

## Provider interface
```ts
interface ChannelProvider {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP'
  name: string
  isConfigured(): boolean            // false => the drain records "skipped", never "sent"
  send(m: { to: string; toName?: string; subject?: string; text: string; html?: string }): Promise<
    | { status: 'sent'; providerMessageId?: string }
    | { status: 'failed'; error: string }
    | { status: 'skipped'; reason: string }>
}
```
Env (no secrets in files): `RESEND_API_KEY`, `FROM_EMAIL` (existing); `FEEDBACK_EMAIL`; `SMS_PROVIDER`, `WHATSAPP_PROVIDER` (names only, read for the skip reason; adapters ship disabled); `CRON_SECRET`.

## Admin UI
`/admin/messages` (filters: status, channel, template, text; counts; retry one or all failed; "Send now"), `/admin/templates`
(list, edit with live preview, merge-field help, SMS segment count, reset to default), `/admin/announcements` (compose + audience
count preview + channels + operational toggle, history, progress), `/admin/feedback` (list, filters, add, status, consent toggle,
promote). Nav: four small items in `components/admin/admin-layout.tsx`.

## Verification
Vitest for pure logic (render and merge-field validation, idempotency keys, consent, audience where-builders and recipient
resolution, month/next-month, SMS segments, feedback → testimonial mapping). Migration on an ephemeral Postgres (port 5490).
An integration script on the scratch DB with a fake email adapter proves: a transition enqueues once and replays do not; birthday
run enqueues student + parent once; a filtered announcement; SMS/WhatsApp stubs record `skipped`; a failed send is retryable.
`tsc`, `next build`, `npm test`; browser check of the three admin pages, feedback admin and `/feedback` at 1280px and 375px.
**Live email delivery stays NOT verified** until a real `RESEND_API_KEY` exists.

## Open questions for John / Adebayo
1. Parents linked to no child have no consent record: skip them (current) or treat admin-created parents as consenting?
2. Which provider (see `docs/research/messaging-providers.md`)? Until then SMS/WhatsApp channels stay disabled.
3. Feedback-request timing: 30 days after enrolment, once (current). Different cadence?
4. Marketing emails carry no unsubscribe link yet (reply-to-opt-out wording only); NDPR practice suggests adding one.
